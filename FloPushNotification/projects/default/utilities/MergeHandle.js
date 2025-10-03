const _ = require('lodash');
const moment = require('moment');
const Decimal = require('decimal.js');
const Sort = require('./Sort');

const MAX_ORDER_NUMBER = 999999;
const MIN_ORDER_NUMBER = -999999;

const Timestamp = (millisecond = Date.now()) => {
    try {
        if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
            return millisecond / 1000;
        }
        return false;
    } catch (error) {
        return false;
    }
};

const SortList = (data) => {
    return data.sort((a, b) => {
        const aOrderNumber = new Decimal(a.order_number);
        const bOrderNumber = new Decimal(b.order_number);
        if (aOrderNumber.eq(bOrderNumber) === true) {
            return (b.updated_date - a.updated_date);
        } 
        return (aOrderNumber.minus(bOrderNumber));
    });
};

const ConflictItem = (data, conflictItem) => {
    const conflictOrderNumber = new Decimal(conflictItem.order_number);    
    if (conflictOrderNumber.lt(MIN_ORDER_NUMBER) === true) {
        return conflictItem;
    } if (conflictOrderNumber.gt(MAX_ORDER_NUMBER) === true) {
        return conflictItem;
    }
   
    let duplicatedOrderNumber = {};
    _.forEach(data, (item) => {
        _.forEach(data, (compareItem) => {
            if (compareItem.order_number.eq(conflictOrderNumber) === true
            && (compareItem.obj_id !== conflictItem.obj_id || compareItem.obj_type !== conflictItem.obj_type)) {
                duplicatedOrderNumber = item;
            }
        });
    });    
    return duplicatedOrderNumber;
};

const SetConflictItemOrderNumber = (data, conflictItem) => {
    const conflictOrderNumber = new Decimal(conflictItem.order_number);    
    if (conflictOrderNumber.lt(MIN_ORDER_NUMBER) === true) {
        return conflictItem;
    } if (conflictOrderNumber.gt(MAX_ORDER_NUMBER) === true) {
        return conflictItem;
    }
   
    let duplicatedOrderNumber = {};
    _.forEach(data, (compareItem) => {
        if (compareItem.order_number.eq(conflictOrderNumber) === true
            && (compareItem.obj_id !== conflictItem.obj_id || compareItem.obj_type !== conflictItem.obj_type)) {
            duplicatedOrderNumber = {
                ...conflictItem,
                order_number: compareItem.order_number
            };
        }
    });    
    
    return duplicatedOrderNumber;
};

const DuplicateItems = (localData, requestData) => {
    const duplicateItems = [];
    _.forEach(requestData, (item) => {
        const itemOrderDecimal = new Decimal(item.order_number);
        _.forEach(localData, (localItem) => {
            const localItemOrderDecimal = new Decimal(localItem.order_number);
            if (itemOrderDecimal.eq(localItemOrderDecimal) === true && item.obj_id !== localItem.obj_id) {
                let updatedDate = _.clone(item.updated_date);
                if (item.updated_date > Timestamp()) {
                    updatedDate = Timestamp();
                }

                duplicateItems.push({
                    ...item,
                    updated_date: updatedDate
                });
            }
        });
    });
    return duplicateItems;
};

const RangeHandle = (localData, conflictItemInfo, node) => {
    try {
        const items = _.clone(localData); 
        let duplicateOrderIndex = -1;
        _.forEach(items, (item, index) => {
            if (item.order_number.eq(conflictItemInfo.order_number) === true && duplicateOrderIndex === -1) {
                duplicateOrderIndex = index;
            }
        });
        
        const conflictOrderNumber = new Decimal(conflictItemInfo.order_number);   
        const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();
        
        let aNumberIndex = duplicateOrderIndex - 1;
        let bNumberIndex = duplicateOrderIndex + 2;
        if (node > 0) {
            aNumberIndex = duplicateOrderIndex - node;
            bNumberIndex = duplicateOrderIndex + node + 1;
        } 
        
        const aNumberOrder = _.get(localData, `${aNumberIndex}.order_number`, false);
        const bNumberOrder = _.get(localData, `${bNumberIndex}.order_number`, false);
        
        if (aNumberOrder === false && bNumberOrder === false) {
            if (aNumberIndex < 0) {
                if (conflictOrderNumber.lt(MIN_ORDER_NUMBER) === true) {
                    // Check lower item
                    const lowerItemInit = Sort.init(duplicateOrder, bNumberOrder);
                    const lowerItemRange = lowerItemInit.baseB.minus(lowerItemInit.baseA);
                    const scale = Sort.generateRangeNumber(lowerItemRange);
                    const rangeLength = Sort.generateRangeLength(scale);
                    return {
                        ...lowerItemInit,
                        range: lowerItemRange.toFixed(14),
                        rangeLength,
                        dragDecisive: 'moveDown'
                    };
                } 
                
                return { dragDecisive: 'moveBottom' };
            }
            
            if (bNumberIndex === items.length) {
                if (conflictOrderNumber.gt(MAX_ORDER_NUMBER) === true) {
                    const upperItemInit = Sort.init(aNumberOrder, duplicateOrder);        
                    const upperItemRange = upperItemInit.baseB.minus(upperItemInit.baseA);
                    const scale = Sort.generateRangeNumber(upperItemRange);
                    const rangeLength = Sort.generateRangeLength(scale);
                    return {
                        ...upperItemInit,
                        range: upperItemRange.toFixed(14),
                        rangeLength,
                        dragDecisive: 'moveUp'
                    };
                }
                return { dragDecisive: 'moveTop' };
            }
        }
        if (aNumberOrder !== false && bNumberOrder === false) {
            const upperItemInit = Sort.init(aNumberOrder, duplicateOrder);        
            const upperItemRange = upperItemInit.baseB.minus(upperItemInit.baseA);
            const scale = Sort.generateRangeNumber(upperItemRange);
            const rangeLength = Sort.generateRangeLength(scale);
            return {
                ...upperItemInit,
                range: upperItemRange.toFixed(14),
                rangeLength,
                dragDecisive: 'moveUp'
            };
        }

        if (aNumberOrder === false && bNumberOrder !== false) {
            const lowerItemInit = Sort.init(duplicateOrder, bNumberOrder);
            const lowerItemRange = lowerItemInit.baseB.minus(lowerItemInit.baseA);
            const scale = Sort.generateRangeNumber(lowerItemRange);
            const rangeLength = Sort.generateRangeLength(scale);
            return {
                ...lowerItemInit,
                range: lowerItemRange.toFixed(14),
                rangeLength,
                dragDecisive: 'moveDown'
            };
        }
        
        // Check upper item
        const upperItemInit = Sort.init(aNumberOrder, duplicateOrder);                
        const upperItemRange = upperItemInit.baseB.minus(upperItemInit.baseA);
        // Check lower item
        const lowerItemInit = Sort.init(duplicateOrder, bNumberOrder);        
        const lowerItemRange = lowerItemInit.baseB.minus(lowerItemInit.baseA);
        // 
        if (upperItemRange.gt(lowerItemRange) === true) {
            const scale = Sort.generateRangeNumber(upperItemRange);
            const rangeLength = Sort.generateRangeLength(scale);
            return {
                ...upperItemInit,
                range: upperItemRange.toFixed(14),
                rangeLength,
                dragDecisive: 'moveUp'
            };
        }

        const scale = Sort.generateRangeNumber(lowerItemRange);
        const rangeLength = Sort.generateRangeLength(scale);
        return {
            ...lowerItemInit,
            range: lowerItemRange.toFixed(14),
            rangeLength,
            dragDecisive: 'moveDown'
        };
    } catch (error) {
        throw error;
    }
};

const MinConflictHandle = (localData, conflictItemInfo) => {
    const items = _.clone(localData);
    const conflictItem = _.clone(conflictItemInfo);
    const conflictOrderNumber = new Decimal(conflictItem.order_number);
    
    if (conflictOrderNumber.lt(MIN_ORDER_NUMBER) === true) {
        conflictItem.order_number = new Decimal(MIN_ORDER_NUMBER);
        return conflictItem;
    }
    // 
    let duplicateOrderIndex = -1;
    _.forEach(items, (item, index) => {
        if (item.order_number.eq(conflictItem.order_number) === true && duplicateOrderIndex === -1) {
            duplicateOrderIndex = index;
        }
    });
    
    if (duplicateOrderIndex === -1) {
        conflictItem.order_number = conflictItemInfo.order_number;
        return conflictItem;
    }

    const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();
    const bIndex = duplicateOrderIndex + 2;
    const bNumberOrder = _.get(localData, `[${bIndex}].order_number`, conflictOrderNumber.plus(1));
    
    const init = Sort.init(duplicateOrder, bNumberOrder);
    const range = init.baseB.minus(init.baseA);
    const scale = Sort.generateRangeNumber(range);
    const rangeLength = Sort.generateRangeLength(scale);
    const order = Sort.generateNewOrderNumber('moveDown', init.baseA, init.baseB, range, rangeLength);
    conflictItem.order_number = order.order;
    conflictItem.type = 'change';
    return conflictItem;
};

const MaxConflictHandle = (localData, conflictItemInfo) => {
    const items = _.clone(localData);
    const conflictItem = _.clone(conflictItemInfo);
    const conflictOrderNumber = new Decimal(conflictItem.order_number);
    if (conflictOrderNumber.gt(MAX_ORDER_NUMBER) === true) {
        conflictItem.order_number = new Decimal(MAX_ORDER_NUMBER);
        return conflictItem;
    }
    //
    let duplicateOrderIndex = -1;
    _.forEach(items, (item, index) => {
        if (item.order_number.eq(conflictItem.order_number) === true && duplicateOrderIndex === -1) {
            duplicateOrderIndex = index;
        }
    });
    if (duplicateOrderIndex === -1) {
        conflictItem.order_number = conflictItemInfo.order_number;
        return conflictItem;
    }
    const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();
    const bIndex = duplicateOrderIndex - 1;
    const bNumberOrder = _.get(localData, `[${bIndex}].order_number`, conflictOrderNumber.minus(1));
    const init = Sort.init(bNumberOrder, duplicateOrder);
    const range = init.baseB.minus(init.baseA);
    const scale = Sort.generateRangeNumber(range);
    const rangeLength = Sort.generateRangeLength(scale);
    const order = Sort.generateNewOrderNumber('moveUp', init.baseA, init.baseB, range, rangeLength);
    
    conflictItem.order_number = order.order;
    conflictItem.type = 'change';
    
    return conflictItem;
};

const ResolveConflictItem = (localData, conflictItemInfo, type = 'new', count = 0) => {
    try {
        const items = _.clone(localData);
        if (count >= 10) {
            return items;
        }
    
        const duplicateindex = _.findIndex(items, { obj_id: conflictItemInfo.obj_id });
        const conflictItem = _.clone(conflictItemInfo);
        const conflictOrderNumber = new Decimal(conflictItem.order_number);
        if (conflictOrderNumber.lt(MIN_ORDER_NUMBER) === true) {
            // console.log('---lt---');
            const conflictItemHandle = MinConflictHandle(localData, conflictItemInfo);
            conflictItem.order_number = conflictItemHandle.order_number;
            conflictItem.type = conflictItemHandle.type;
            items[duplicateindex] = conflictItem;
        } else if (conflictOrderNumber.gt(MAX_ORDER_NUMBER) === true) {
            // console.log('---gt---');
            const conflictItemHandle = MaxConflictHandle(localData, conflictItemInfo);
            conflictItem.order_number = conflictItemHandle.order_number;
            conflictItem.type = conflictItemHandle.type;
            items[duplicateindex] = conflictItem;
        } else {
            const init = RangeHandle(items, conflictItemInfo, count);
            // console.log('---init---');
            if (init.dragDecisive === 'moveTop') {
                conflictItem.order_number = conflictOrderNumber.minus(1).floor();
                conflictItem.type = type;
                items[duplicateindex] = conflictItem;
            } if (init.dragDecisive === 'moveBottom') {
                conflictItem.order_number = conflictOrderNumber.plus(1).ceil();
                conflictItem.type = type;
                items[duplicateindex] = conflictItem;
            } if (init.rangeLength <= 15) {
                const order = Sort.generateNewOrderNumber(init.dragDecisive, init.baseA, init.baseB, init.range, init.rangeLength);
                conflictItem.order_number = order.order;
                conflictItem.type = type;
                items[duplicateindex] = conflictItem;
            } 
            if (init === false) {
                items.splice(duplicateindex, 1);
                return SortList(items);
            }
        }
        
        const newConflictItem = SetConflictItemOrderNumber(items, conflictItem);   
        if (_.isEmpty(newConflictItem) === false) {
            const countResolveConflict = count + 1;            
            return ResolveConflictItem(SortList(items), {
                ...newConflictItem
            }, 'change', countResolveConflict);
        }
        return SortList(items);
    } catch (error) {
        throw error;
    }
};

const GenerateLocalList = async (email, userInfo, Model) => {
    try {
        if (_.isEmpty(email) === true) return false;
        const result = [];
        const objOrders = await Model.sort_objects.findAll({
            where: {
                user_id: userInfo.id
            },
            raw: true
        });
        
        if (_.isEmpty(objOrders) === true) return result;
        _.forEach(objOrders, (objOrder) => {
            result.push({
                id: objOrder.id,
                obj_id: objOrder.obj_id,
                obj_type: objOrder.obj_type,
                content: objOrder.obj_id,
                order_number: new Decimal(objOrder.order_number),
                updated_date: objOrder.updated_date
            });
        });
        return result;
    } catch (error) {
        throw error;
    }
};

const MergeSimpleHandle = (localData, requestData, mergeConflict = false) => {
    try {
        const result = _.clone(localData);
        _.forEach(requestData, (requestItem) => {
            const existItem = _.find(localData, { obj_id: requestItem.obj_id });
            const requestItemOrder = new Decimal(requestItem.order_number);
            if (_.isEmpty(existItem) === true) {
                result.push({
                    ...requestItem,
                    order_number: requestItemOrder,
                    type: 'new'
                });
            } else {
                const existItemOrder = new Decimal(existItem.order_number);
                const diff = moment(requestItem.updated_date).diff(existItem.updated_date, 'milliseconds');
                if (requestItemOrder.eq(existItemOrder) === false && diff > 0) {
                    if (mergeConflict === true) {
                        const tempIndex = _.findIndex(result, { id: existItem.id });
                        result.splice(tempIndex, 1);
                    }
                    result.push({
                        ...requestItem,
                        order_number: requestItemOrder,
                        objOrder: existItem,
                        type: 'change'
                    });
                } else if (diff > 0) {
                    result.push({
                        ...requestItem,
                        order_number: requestItemOrder,
                        objOrder: existItem,
                        type: 'change'
                    });
                } else {
                    const existItemIndex = _.findIndex(localData, { obj_id: requestItem.obj_id });
                    result[existItemIndex].type = 'nochange';
                }
            }
        });
                
        return SortList(result);
    } catch (error) {
        throw error;
    }
};

const MergeConflictHandle = (localData, requestData, conflictItems) => {
    try {
        let mergeList = MergeSimpleHandle(localData, requestData, true);        
        _.forEach(conflictItems, (conflictItem) => {
            const temp = _.find(mergeList, { obj_id: conflictItem.obj_id });
            const localItem = _.find(localData, { obj_id: temp.obj_id });
            
            if (
                _.isEmpty(localItem) === false 
                && _.isEmpty(temp) === false 
                && temp.type === 'change') {
                mergeList = ResolveConflictItem(mergeList, {
                    ...conflictItem,
                    objOrder: localItem
                }, 'change');
            } else if (temp.type !== 'nochange') {
                mergeList = ResolveConflictItem(mergeList, conflictItem, 'new');
            } 
        });

        return SortList(mergeList);
    } catch (error) {
        throw error;
    }
};

const MergeHandle = (localData, requestData) => {
    try {
        if (_.isEmpty(localData) === true) {
            const result = [];
            _.forEach(requestData, (item) => {
                let updatedDate = _.clone(item.updated_date);
                if (item.updated_date > Timestamp()) {
                    updatedDate = Timestamp();
                }
                result.push({
                    ...item,
                    updated_date: updatedDate,
                    order_number: new Decimal(item.order_number),
                    type: 'new'
                });
            });
            return result;
        }
        
        if (_.isEmpty(requestData) === true) {
            return [];
        }
        const duplicateItems = DuplicateItems(localData, requestData);
        if (_.isEmpty(duplicateItems) === true) {
            return MergeSimpleHandle(localData, requestData);
        }
        return MergeConflictHandle(localData, requestData, duplicateItems);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    GenerateLocalList,
    MergeHandle,
    ConflictItem
};
