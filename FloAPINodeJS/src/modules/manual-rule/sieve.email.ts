import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiLastModifiedName, DELETED_ITEM_TYPE, IS_TRASHED } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  ACTION_MANUAL_RULE,
  CONDITION_MANUAL_RULE,
  FIND_CONTAIN_CONDITION,
  FIND_END_WITH_CONDITION,
  FIND_START_WITH_CONDITION,
  MAIL_FOLDER,
  MANUAL_RULE_STATUS,
  MATCH_TYPE,
  OPERATOR_CONTAIN_TYPE,
  OPERATOR_MANUAL_RULE,
  REGEX_END_WORD,
  REGEX_START_WORD,
  VALIDATE_CONTAINS_WILDCARD_RULE_CONDITION,
  VALIDATE_IS_WILDCARD_RULE_CONDITION
} from '../../common/constants/manual_rule.constant';
import {
  CONDITION_BLANK_PATTERN,
  CONDITION_END_PATTERN,
  CONDITION_PATTERN,
  DESTINATION_PATTERN,
  INBOX,
  SIEVE_ACTION,
  SIEVE_ACTION_WEIGHT,
  SIEVE_CONDITION,
  SIEVE_LIBS,
  SIEVE_MATCH_OPERATOR_RULE,
  SIEVE_MATCH_TYPE,
  SIEVE_OPERATOR_RULE,
  SIEVE_SCRIPT_NAME
} from '../../common/constants/sieve.constant';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';

export interface SieveRuleOptions<T> {
  userId: number;
  username: string;
  repository: Repository<T>;
}

@Injectable()
export class SieveEmailService {
  constructor(private readonly httpService: HttpService) { }

  public replaceSpecialCharacters = (str) => {
    return str.replace(/(\W)/g, '\\$1');
  }
  // Fix bug: https://floware.atlassian.net/browse/FB-2344
  public escapeRegexCharacters(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
  }

  public getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  }

  public getByKey = (object, key) => {
    return object[key];
  }

  public sortByKey(array, key) {
    return array.sort((a, b) => {
      const x = a[key];
      const y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }

  public sortDescByKey(array, key) {
    return array.sort((a, b) => {
      const x = a[key];
      const y = b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

  public modifyRuleConditions(conditions) {
    if (!conditions) {
      return conditions;
    }

    conditions.map(item => {
      if (
        [
          OPERATOR_MANUAL_RULE._contains,
          OPERATOR_MANUAL_RULE._is
        ].includes(item.operator) === true
        && item.value
        && (
          item.condition === CONDITION_MANUAL_RULE.Subject
          || [
            CONDITION_MANUAL_RULE.From
            // CONDITION_MANUAL_RULE.To,
            // CONDITION_MANUAL_RULE.Cc
          ].includes(item.condition) === true
        )
      ) {
        switch (item.operator) {
          case OPERATOR_MANUAL_RULE._is: {
            if (item.value.match(VALIDATE_IS_WILDCARD_RULE_CONDITION)) {
              item.value = item.value.replace(FIND_END_WITH_CONDITION, '');
              item.regex_type = OPERATOR_CONTAIN_TYPE.END_WITH;
            }
            break;
          }
          case OPERATOR_MANUAL_RULE._contains: {
            if (!item.value.match(VALIDATE_CONTAINS_WILDCARD_RULE_CONDITION)) {
              if (item.value.match(FIND_CONTAIN_CONDITION)) {
                item.regex_type = OPERATOR_CONTAIN_TYPE.WILDCARD;
                item.value = item.value
                  .replace(FIND_START_WITH_CONDITION, '')
                  .replace(FIND_END_WITH_CONDITION, '');
              }
              //
              else if (
                item.value.match(FIND_START_WITH_CONDITION)
                && item.value.match(FIND_END_WITH_CONDITION)
              ) {
                item.regex_type = OPERATOR_CONTAIN_TYPE.WILDCARD;
              }
              //
              else if (item.value.match(FIND_START_WITH_CONDITION)) {
                item.value = item.value.replace(FIND_START_WITH_CONDITION, '');
                item.regex_type = OPERATOR_CONTAIN_TYPE.START_WITH;
              }
              //
              else if (item.value.match(FIND_END_WITH_CONDITION)) {
                item.value = item.value.replace(FIND_END_WITH_CONDITION, '');
                item.regex_type = OPERATOR_CONTAIN_TYPE.END_WITH;
              }
              // Case operator === "contains" but value don't have *
              else if (item.operator === OPERATOR_MANUAL_RULE._contains) {
                item.regex_type = OPERATOR_CONTAIN_TYPE.DEFAULT;
              }
            }
            break;
          }
        }
      }
      return item;
    });
    return conditions;
  }

  public async modifySieveRule(options: SieveRuleOptions<any>): Promise<any> {
    try {
      const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
      const url = `${BASE_PATH}/user-sieve-script`;
      const scriptData = await this.generateSieveScript(options.userId, options.repository);
      if (scriptData === false) {
        const payloadData = {
          scriptName: SIEVE_SCRIPT_NAME[1],
          username: options.username
        };
        const rsDelete = await this.httpService.delete(url, {
          data: { data: payloadData }
        }).toPromise();
        return rsDelete?.data;
      }

      const body_data = {
        scriptName: SIEVE_SCRIPT_NAME[1],
        scriptData,
        username: options.username
      };
      const response = await this.httpService.put(url, {
        data: body_data
      }, {
        headers: {
          Accept: 'application/json',
        },
      }).toPromise();
      return response?.data;
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return errItem;
    }
  }

  public createMasterQueryRunner<T>(ruleRepository: Repository<T>) {
    return ruleRepository.manager.connection.createQueryRunner('master');
  }

  public async generateSieveScript(userId: number, ruleRepository) {
    const ruleHeaderScripts = SIEVE_LIBS.init;
    const ruleScripts = [];
    const masterQueryRunner = this.createMasterQueryRunner(ruleRepository);
    let rules = [];
    try {
      const aliasName = ruleRepository.metadata.name || 'model';
      rules = await ruleRepository
        .createQueryBuilder(aliasName)
        .setQueryRunner(masterQueryRunner)
        .where(`user_id = :userId`, { userId })
        .andWhere(`is_enable = :isEnable`, {
          isEnable: MANUAL_RULE_STATUS.Enabled
        })
        .andWhere(`is_trashed = :isTrash`, {
          isTrash: IS_TRASHED.NOT_TRASHED
        })
        .addOrderBy('order_number', 'ASC')
        .getMany();
    } finally {
      await masterQueryRunner.release();
    }

    if (!rules || rules.length === 0) {
      return false; // will delete empty rule
    }
    let rulesWithWeight = [];
    rules.forEach((rule) => {
      // Check in case of data null destinations && conditions
      if (rule.destinations && rule.conditions) {
        const destWithWeight = this.generateDestination(rule.destinations);
        const conditions = this.modifyRuleConditions(
          rule.conditions
        ); // Modify condition value for regex feature
        rulesWithWeight.push({
          match_type: rule.match_type,
          conditions,
          destinations: destWithWeight.destinations,
          actionWeight: destWithWeight.actionWeight
        });
      }
    });
    rulesWithWeight = this.sortDescByKey(rulesWithWeight, 'actionWeight');
    rulesWithWeight.forEach((rule, index) => {
      const isLastItem = rulesWithWeight.length === (index + 1);
      const ruleCons = this.generateCondition(
        rule.match_type,
        rule.conditions,
        rule.destinations,
        isLastItem
      );
      if (ruleCons) {
        ruleScripts.push(ruleCons);
      }
    });
    if (ruleScripts.length === 0) {
      return false;
    }
    return [
      ...ruleHeaderScripts,
      ...ruleScripts
    ].join('');
  }

  public generateDestination(data) {
    const result = [];
    let maxWeight = 0;
    data.forEach((obj) => {
      const action = this.getKeyByValue(ACTION_MANUAL_RULE, obj.action);
      let actionWeight = Number(this.getByKey(SIEVE_ACTION_WEIGHT, action));
      actionWeight = actionWeight ? actionWeight : 1;
      if (actionWeight > maxWeight) maxWeight = actionWeight;
      result.push({
        ...obj,
        actionWeight
      });
    });

    return {
      destinations: this.sortDescByKey(result, 'actionWeight'),
      actionWeight: maxWeight,
    };
  }

  public generateCondition(ruleMatchType, conditions, destinations, isLastItem: boolean) {
    const replaceMultiple = (str, placeHolder) => {
      const regex = new RegExp(`(?:${Object.keys(placeHolder).join('|')})`, 'gi');
      return str.replace(regex, (matched) => {
        return placeHolder[matched];
      });
    };

    const matchType = ruleMatchType === MATCH_TYPE.All
      ? SIEVE_MATCH_TYPE.All : SIEVE_MATCH_TYPE.Any;
    const conditionPatternArr = [];
    const destinationPatternArr = [];

    conditions.forEach((obj) => {
      const condition = this.getKeyByValue(SIEVE_CONDITION, obj.condition).toLowerCase();
      let operator = this.getKeyByValue(SIEVE_OPERATOR_RULE, obj.operator);

      if (operator && condition) {
        const cleaned = this.replaceSpecialCharacters(obj.value);
        switch (obj.regex_type) {
          case OPERATOR_CONTAIN_TYPE.DEFAULT:
            const escaped = this.escapeRegexCharacters(obj.value);
            operator = SIEVE_MATCH_OPERATOR_RULE.regex;
            obj.value = `${REGEX_START_WORD}(${escaped})${REGEX_END_WORD}`;
            break;
          case OPERATOR_CONTAIN_TYPE.WILDCARD:
            operator = SIEVE_MATCH_OPERATOR_RULE.contains;
            obj.value = `${cleaned}`;
            break;
          case OPERATOR_CONTAIN_TYPE.START_WITH:
            operator = SIEVE_MATCH_OPERATOR_RULE.starts_with;
            obj.value = `${cleaned}*`;
            break;
          case OPERATOR_CONTAIN_TYPE.END_WITH:
            operator = SIEVE_MATCH_OPERATOR_RULE.ends_with;
            obj.value = `*${cleaned}`;
            break;
          default:
            if (operator === SIEVE_MATCH_OPERATOR_RULE.regex) {
              obj.value = this.escapeRegexCharacters(obj.value);
            } else {
              obj.value = cleaned;
            }
        }

        switch (obj.condition) {
          case CONDITION_MANUAL_RULE.Subject:
            conditionPatternArr.push(`header :${operator} "${condition}" "${obj.value}"`);
            break;
          case CONDITION_MANUAL_RULE.From:
            conditionPatternArr.push(`address :${operator} "${condition}" "${obj.value}"`);
            break;
        }
      }

    });
    let isStop = false;
    destinations.forEach((obj) => {
      const action = this.getKeyByValue(ACTION_MANUAL_RULE, obj.action);
      const actionPattern = SIEVE_ACTION[action];
      if (actionPattern) {
        switch (action) {
          case 'move_to_folder': {
            destinationPatternArr.push(
              replaceMultiple(actionPattern, {
                '{{rule_value}}': this.replaceSpecialCharacters(obj.value)
              })
            );
            isStop = true;
            break;
          }
          case 'move_to_collection': {
            destinationPatternArr.push(
              replaceMultiple(actionPattern, {
                '{{rule_collection}}': obj.collection_id,
                '{{rule_file_path}}':
                  obj.value
                    ? this.replaceSpecialCharacters(obj.value)
                    : MAIL_FOLDER.OMNI
              })
            );
            isStop = true;
            break;
          }
          case 'move_to_trash': {
            destinationPatternArr.push(actionPattern);
            isStop = true;
            break;
          }
          case 'add_to_collection': {
            if (obj.value && obj.value.trim().toUpperCase() !== INBOX) {
              destinationPatternArr.push(
                replaceMultiple(SIEVE_ACTION.add_to_collection_with_imap_folder, {
                  '{{rule_collection}}': obj.collection_id,
                  '{{rule_file_path}}': this.replaceSpecialCharacters(obj.value)
                })
              );
            } else {
              destinationPatternArr.push(
                replaceMultiple(actionPattern, {
                  '{{rule_collection}}': obj.collection_id
                })
              );
            }
            break;
          }
        }
      }
    });

    if (conditionPatternArr.length === 0 || destinationPatternArr.length === 0) {
      return false;
    }

    isStop = isLastItem ? true : isStop;
    const conditionEndPattern = isStop ? CONDITION_END_PATTERN : CONDITION_BLANK_PATTERN;
    const destinationPlaceHolder = {
      destinationPattern: destinationPatternArr.join(''),
      conditionEndPattern
    };

    const conditionPlaceHolder = {
      conditionStartPattern: ` if ${matchType}(${conditionPatternArr.join(',')}) {`,
      destinationPattern: replaceMultiple(DESTINATION_PATTERN, destinationPlaceHolder),
      conditionEndPattern: '}'
    };

    return replaceMultiple(CONDITION_PATTERN, conditionPlaceHolder);

  }

  public async deleteRuleByCollection(colIds: number[], user_id: number, email: string
    , manualRuleRepo: RuleRepository
    , apiLastModifiedQueueService: ApiLastModifiedQueueService
    , deletedItem: DeletedItemService
  ) {
    if (colIds.length === 0) return;
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    const rules = await manualRuleRepo.findByCollection(user_id, colIds);
    await Promise.all(rules.map(async (item, idx) => {
      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        const isInsertDeletedItem = await deletedItem.create(user_id, {
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.MANUAL_RULE,
          is_recovery: 0,
          created_date: dateItem,
          updated_date: dateItem
        });
        if (!isInsertDeletedItem) { // push item into itemFail if false
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, '', item);
          itemFail.push(errItem);
        } else { // remove item in cloud table
          await manualRuleRepo.delete({ id: item.id, user_id });
          timeLastModify.push(dateItem);
          itemPass.push({ id: item.id });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.modifySieveRule({
        userId: user_id,
        username: email,
        repository: manualRuleRepo
      });
      apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.MANUAL_RULE,
        userId: user_id,
        email,
        updatedDate
      }, null);
    }

    return { itemPass, itemFail };
  }

  public async trashRuleByCollection(colIds: number[], user_id: number, email: string
    , manualRuleRepo: RuleRepository
    , apiLastModifiedQueueService: ApiLastModifiedQueueService
    , is_trashed: IS_TRASHED
  ) {
    if (colIds.length === 0) return;
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    const rules = await manualRuleRepo.findByCollection(user_id, colIds);
    await Promise.all(rules.map(async (item, idx) => {
      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        await manualRuleRepo.update(
          { id: item.id, user_id },
          { is_trashed }
        );
        timeLastModify.push(dateItem);
        itemPass.push({ id: item.id });

      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.modifySieveRule({
        userId: user_id,
        username: email,
        repository: manualRuleRepo
      });
      apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.MANUAL_RULE,
        userId: user_id,
        email,
        updatedDate
      }, null);
    }

    return { itemPass, itemFail };
  }
}