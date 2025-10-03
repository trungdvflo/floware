const _ = require('lodash');
const Md5 = require('md5');
const Jsonwebtoken = require('jsonwebtoken');
const { v1: uuidv1 } = require('uuid');
const NodeRSA = require('node-rsa');
const Fse = require('fs-extra');

const AsyncForEach = require('await-async-foreach');
const { Base64 } = require('js-base64');
const Moment = require('moment');
const Striptags = require('striptags');

const {
    AuthenticationConfig,
    OAuth2Constant,
    AppsConstant
} = require('../SignUpConstant');
const Utils = require('../../../projects/default/utilities/Utils');
const Otp = require('../../../projects/default/utilities/OTP');

const Accounts = {
    CreateAccessToken: (data) => {
        const accessTokenData = {
            appId: data.appId,
            ip: data.ip,
            email: data.email,
            expiredIn: data.expiredIn
        };
        const accessToken = Jsonwebtoken.sign(accessTokenData, AuthenticationConfig.jwtSecretKey, {
            algorithm: 'HS256'
        });
        return accessToken;
    },

    handleEmail: (email) => {
        let str = email;
        str = str.trim(str);
        str = str.toLowerCase();
        return str;
    },

    generatePass: (digesta1, appId) => {
        const signature = Md5(`${digesta1}${appId}`);
        return signature;
    },

    ValidatePassword: (password) => {
        try {
            if (_.isEmpty(password) === true) {
                return false;
            }
            const passwordLenght = password.length;
            const passwordLengthAllow = [6, 32];
            if (passwordLenght < passwordLengthAllow[0] || passwordLenght > passwordLengthAllow[1]) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    },

    // Validate email 
    ValidateEmailFormat: (email) => {
        try {
            if (_.isEmpty(email) === true) {
                return false;
            }

            const arrEmail = email.split('@');
            const username = _.get(arrEmail, '0', '');
            const usernameLenght = username.length;

            const numberOfLodashAllow = 0;
            const numberOfDotAllow = 2;
            const usernameLengthAllow = [3, 32];
            const allowLettersRegex = new RegExp(/^[a-z0-9A-Z_.]+$/);

            if ((username.match(/_/g) || []).length > numberOfDotAllow && numberOfLodashAllow > 0) {
                return false;
            }

            if ((username.match(/\./g) || []).length > numberOfDotAllow && numberOfDotAllow > 0) {
                return false;
            }

            if (usernameLenght < usernameLengthAllow[0] || usernameLenght > usernameLengthAllow[1]) {
                return false;
            }

            if (allowLettersRegex.test(username) === false) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    },
    CreateNewAccessToken: async (payload, previousRefreshToken = null, Model) => {
        try {
            const expired = (Utils.Timestamp() + AppsConstant.ACCESS_TOKEN_EXPIRE_TIME) * 1000;
            const expiredRefreshToken = (Utils.Timestamp() + AppsConstant.REFRESH_TOKEN_EXPIRE_TIME) * 1000;

            const accessTokenParams = {
                appId: payload.app_id,
                ip: payload.ip ? payload.ip : '',
                email: payload.username,
                expiredIn: expired
            };
            const accessToken = Accounts.CreateAccessToken(accessTokenParams, AuthenticationConfig.jwtSecretKey);
            const refreshToken = Otp.generateSecretKey(32);

            const encryptAccessToken = Utils.encryptAccessToken(accessToken, refreshToken);
            const insertAccessToken = {
                user_id: payload.userId,
                app_id: payload.app_id,
                email: payload.username,
                sub_key: encryptAccessToken.subKeyEncrypt,
                access_token: encryptAccessToken.accessToken,
                refresh_token: encryptAccessToken.refreshToken,
                token_type: 'Bearer',
                expires_in: expired,
                expires_in_refresh_token: expiredRefreshToken,
                user_agent: payload.user_agent,
                ip: payload.ip,
                previous_refresh_token: _.isNull(previousRefreshToken) ? '' : previousRefreshToken,
                created_date: Utils.Timestamp()
            };
            await Model.access_tokens.create(insertAccessToken);
            return {
                accessToken,
                refreshToken,
                expiresIn: expired
            };
        } catch (error) {
            return false;
        }
    },

    CreatePrincipal: async (user, Model, t) => {
        try {
            const checkExistPrincipal = await Model.principals.findOne({
                where: { email: user.email },
                raw: true
            });
            if (_.isEmpty(checkExistPrincipal) === false) {
                return { code: 1 };
            }
            const args = {
                uri: `${OAuth2Constant.API_PRINCIPAL}${user.email}`,
                displayname: user.email,
                email: user.email
            };
            const createPrincipal = await Model.principals.create(args, { transaction: t, raw: true, returning: true });
            const principal = createPrincipal.get({ plain: true });
            if (_.isEmpty(principal) === true) {
                return {
                    code: 0,
                    message: 'Generate principal fail'
                };
            }
            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    CreateUserCalendar: async (user, opts, Model, t) => {
        try {
            const options = _.clone(opts);
            const cals = OAuth2Constant.ARR_CALS_DEFAULT;
            const principal = `principals/${user.email}`;
            const components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM';
            let omniCalUri = '';

            const projectArgs = [];
            const calendarArgs = [];
            _.forEach(cals, (cal) => {
                const uri = uuidv1();
                calendarArgs.push({
                    principaluri: principal,
                    displayname: cal.displayname,
                    uri: uri.toString(),
                    synctoken: '1',
                    description: cal.description,
                    calendarorder: '0',
                    calendarcolor: cal.calendarcolor,
                    timezone: options.calendar_tz,
                    components
                });
                if (cal.displayname !== OAuth2Constant.DEF_OMNI_CALENDAR_NAME) {
                    projectArgs.push({
                        user_id: user.id,
                        proj_name: cal.displayname,
                        proj_color: cal.calendarcolor,
                        calendar_id: uri.toString(),
                        proj_type: cal.proj_type,
                        alerts: '',
                        order_storyboard: '',
                        order_kanban: '',
                        view_mode: 1,
                        updated_date: Utils.Timestamp(),
                        created_date: Utils.Timestamp()
                    });
                }
                omniCalUri = cal.displayname === OAuth2Constant.DEF_OMNI_CALENDAR_NAME ? uri : '';
            });

            const calendars = await Model.calendars.bulkCreate(calendarArgs, { transaction: t, raw: true, returning: true });
            if (_.isEmpty(calendars) === true) {
                return {
                    code: 0,
                    message: 'Generate calendars false'
                };
            }

            const projects = await Model.projects.bulkCreate(projectArgs, { transaction: t, raw: true, returning: true });
            if (_.isEmpty(projects) === true) {
                return {
                    code: 0,
                    message: 'Generate projects false'
                };
            }

            let result = { code: 1 };
            let systemKanbanArgs = [];
            await AsyncForEach(projects, async (item) => {
                const project = item.get({ plain: true });
                const calendarRaw = _.find(calendars, {
                    uri: project.calendar_id
                });
                options.cal_id = 0;
                if (_.isEmpty(calendarRaw) === false) {
                    const calendar = calendarRaw.get({ plain: true });
                    options.cal_id = calendar.id;
                }

                if (project.proj_name === OAuth2Constant.DEF_CALENDAR_NAME) {
                    options.omni_cal_uri = omniCalUri;
                    options.cols = project;

                    const defaultSetting = await Accounts.GenerateSettingDefault(user, project, options, t);
                    if (defaultSetting.code === 0) {
                        result = {
                            code: 0,
                            message: 'Generate default setting false'
                        };
                    }
                }

                systemKanbanArgs = Accounts.GenerateSystemKanban(systemKanbanArgs, user, project);
            });
            if (_.isEmpty(systemKanbanArgs) === false) {
                const kanbans = await Model.kanbans.bulkCreate(systemKanbanArgs, { transaction: t, raw: true, returning: true });
                if (_.isEmpty(kanbans) === true) {
                    return {
                        code: 0,
                        message: 'Generate system kanban false'
                    };
                }
            }
            return result;
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateSettingDefault: async (user, project, opts, Model, t) => {
        try {
            const settingArgs = {
                user_id: user.id,
                default_cal: project.calendar_id,
                timezone: _.get(opts, 'timezone', 'America/Chicago'),
                event_duration: 3600, // default is 1 hour
                alert_default: 1, // pop up alert
                alert_before: 0, // Time of Start #600 #60 mins before
                default_ade_alert: 0, // Date of Start
                snooze_default: 900, // 15 mins
                timezone_support: 1, // true or false
                task_duration: 1800, // mins = 30 mins = 1800 seconds
                deadline: -1, // None option
                due_task: 0,
                number_stask: 5,
                total_duration: 21600,
                buffer_time: 900,
                hide_stask: 0,
                default_folder: project.id,
                calendar_color: OAuth2Constant.DEF_COLOR,
                folder_color: OAuth2Constant.DEF_COLOR,
                working_time: JSON.stringify(OAuth2Constant.WKHOURS), // json string
                m_show: 23, // month show
                dw_show: 17, // day week show
                default_todo_alert: 0, // date of due option
                mail_moving_check: 3, // check for bear track
                noti_bear_track: 3, // show notification for bear trackon alert box
                filing_email: false,
                contact_display_name: 1,
                contact_display_inlist: 0,
                omni_cal_id: opts.omni_cal_uri, // set omni calendar default
                // defaults
                navbar_system: '',
                navbar_custom: '',
                infobox: '',
                avatar: '',
                signature: '',
                updated_date: Utils.Timestamp(),
                created_date: Utils.Timestamp()

            };            
            const createSetting = await Model.settings.create(settingArgs, { transaction: t });
            const setting = createSetting.get({ plain: true });
            
            if (_.isEmpty(setting) === true) {
                return {
                    code: 0,
                    message: 'Generate setting false'
                };
            }
            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateNoteData: async (user, project, opts, Model, t) => {
        try {
            const notes = OAuth2Constant.ARR_NOTE_DEFAULT_iOS;
            if (_.isEmpty(notes) === true) {
                return { code: 1 };
            }

            const calId = _.clone(opts.cal_id);
            const calendarObjectArgs = [];
            const calendarChangeArgs = [];
            const linkArgs = [];

            _.forEach(notes, (note) => {
                const noteId = uuidv1();
                const noteTT = note.summary;
                const noteBody = _.get(note, 'description', '').replace('@colnm@', project.proj_name);
                const noteObj = Accounts.NoteDefault(project.id, noteTT, noteId, noteBody);
                const noteCstring = Utils.NewNoteString(noteObj);
                const etag = Md5(noteCstring);
                const uri = `${noteObj.uuid}.ics`;

                // Calendar Object
                calendarObjectArgs.push({
                    calendardata: noteCstring,
                    uri,
                    calendarid: calId,
                    etag,
                    componenttype: 'VJOURNAL',
                    size: Buffer.byteLength(noteCstring, 'utf8'),
                    uid: noteObj.uuid,
                    lastmodified: Utils.Timestamp()
                });

                // Calendar Change
                calendarChangeArgs.push({
                    uri,
                    synctoken: 1,
                    calendarid: calId,
                    operation: 1
                });

                // Link
                _.forEach(note.collections, () => {
                    const projName = _.get(opts, 'cols.proj_name', '');
                    if (projName === OAuth2Constant.DEF_SAMPLE) {
                        linkArgs.push({
                            source_type: OAuth2Constant.API_VJOURNAL,
                            destination_type: OAuth2Constant.API_FOLDER,
                            user_id: user.id,
                            source_id: noteId,
                            source_account: '0',
                            destination_account: '0',
                            destination_id: opts.cols.id,
                            updated_date: Utils.Timestamp(),
                            created_date: Utils.Timestamp()
                        });
                    }
                });
            });

            if (_.isEmpty(calendarObjectArgs) === false) {
                const calendarObject = await Model.calendarobjects.bulkCreate(calendarObjectArgs, { transaction: t, raw: true, returning: true });
                if (_.isEmpty(calendarObject) === true) {
                    return {
                        code: 0,
                        message: 'Generate calendar object false'
                    };
                }
            }
            if (_.isEmpty(calendarChangeArgs) === false) {
                const calendarChange = await Model.calendarchanges.bulkCreate(calendarChangeArgs, { transaction: t, raw: true, returning: true });
                if (_.isEmpty(calendarChange) === true) {
                    return {
                        code: 0,
                        message: 'Generate calendar change false'
                    };
                }
            }

            if (_.isEmpty(linkArgs) === false) {
                const link = await Model.links.bulkCreate(linkArgs, { transaction: t, raw: true, returning: true });
                if (_.isEmpty(link) === true) {
                    return {
                        code: 0,
                        message: 'Generate link false'
                    };
                }
            }
            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateSystemKanban: (kanbans, user, project) => {
        try {
            if (_.isEmpty(OAuth2Constant.SYSTEM_KANBANS) === true) {
                return kanbans;
            }
            _.forEach(OAuth2Constant.SYSTEM_KANBANS, (kanban) => {
                kanbans.push({
                    user_id: user.id,
                    project_id: project.id,
                    kanban_type: 1,
                    name: kanban.name,
                    color: kanban.color,
                    order_kbitem: '',
                    updated_date: Utils.Timestamp(),
                    created_date: Utils.Timestamp()
                });
            });

            return kanbans;
        } catch (error) {
            return kanbans;
        }
    },

    NoteDefault(projectId, noteTitle, noteId, noteBody) {
        try {
            return {
                uuid: noteId,
                summary: noteTitle || 'Note default',
                dtstart: Moment().format(OAuth2Constant.DATE_RFC2822),
                folderid: projectId,
                description: noteBody ? Striptags(noteBody) : 'This is note description',
                x_lcl_notecontent: Base64.encode(noteBody || 'This is note content'),
                floware_only: 1
            };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateUrlBookmarkData: async (user, Model, t) => {
        try {
            if (_.isEmpty(OAuth2Constant.ARR_BOOKMARKS_URL) === true) {
                return { code: 1 };
            }
            const urlArgs = [];
            _.forEach(OAuth2Constant.ARR_BOOKMARKS_URL, (item) => {
                urlArgs.push({
                    user_id: user.id,
                    url: item.url,
                    title: item.title,
                    created_date: Utils.Timestamp(),
                    updated_date: Utils.Timestamp()
                });
            });

            const urls = await Model.urls.bulkCreate(urlArgs, { transaction: t, raw: true, returning: true });
            if (_.isEmpty(urls) === true) {
                return {
                    code: 0,
                    message: 'Generate url fail'
                };
            }

            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateAddressbookData: async (user, Model, t) => {
        try {
            if (_.isEmpty(OAuth2Constant.API_PRINCIPAL) === true) {
                return { code: 1 };
            }

            const createAddressBook = await Model.addressbooks.create({
                principaluri: `${OAuth2Constant.API_PRINCIPAL}${user.email}`,
                displayname: OAuth2Constant.DEF_CALENDAR_NAME,
                uri: user.email,
                description: OAuth2Constant.DEF_CALENDAR_NAME
            }, { transaction: t, raw: true, returning: true });

            const addressBook = createAddressBook.get({ plain: true });
            if (_.isEmpty(addressBook) === true) {
                return {
                    code: 0,
                    message: 'Generate address-book fail'
                };
            }

            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    GenerateVirtualAlias: async (user, opts, Model, t) => {
        try {
            if (_.isEmpty(OAuth2Constant.VMAIL_PUSH_NOTI) === true) {
                return { code: 1 };
            }

            const createVirtualAlias = await Model.virtual_aliases.create({
                domain_id: opts.domain_id,
                source: user.email,
                destination: `${user.email},${OAuth2Constant.VMAIL_PUSH_NOTI}`
            }, { transaction: t, raw: true, returning: true });

            const virtualAlias = createVirtualAlias.get({ plain: true });
            if (_.isEmpty(virtualAlias) === true) {
                return {
                    code: 0,
                    message: 'Generate virtual alias fail'
                };
            }

            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    //   #auto upgrade Premium yearly for beta user
    //   #https://www.pivotaltracker.com/story/show/145493363
    AutoUpgradePreYearly: async (user, Model, t) => {
        try {
            // 
            const adminPromotion = await Model.admin_promotions.findOne({ raw: true });
            if (_.isEmpty(adminPromotion) === true || adminPromotion.allow_pre_signup !== 1) {
                return { code: 1 };
            }

            const premiumSubscription = await Model.subscriptions.findOne({
                where: { order_number: 3 },
                raw: true
            });

            if (_.isEmpty(premiumSubscription) === true) {
                return { code: 1 };
            }

            const createSubscriptionPurchase = await Model.subscription_purchase.create({
                user_id: user.id,
                purchase_status: 1,
                subID: premiumSubscription.id,
                is_current: 1,
                receipt_data: ''
            }, { transaction: t, raw: true, returning: true });

            const subscriptionPurchase = createSubscriptionPurchase.get({ plain: true });
            if (_.isEmpty(subscriptionPurchase) === true) {
                return {
                    code: 0,
                    message: 'Generate subscription purchase fail'
                };
            }

            return { code: 1 };
        } catch (error) {
            return { code: 0, message: 'System error' };
        }
    },

    // RestrictedUser
    RestrictedUsername: async (username, Model) => {
        try {
            let isRestricted = false;
            const restrictedRules = await Model.restricted_users.findAll({
                attributes: ['name', 'type_matcher'],
                raw: true
            });

            if (_.isEmpty(restrictedRules) === true) {
                return isRestricted;
            }

            _.forEach(restrictedRules, (restrictedRule) => {
                if (restrictedRule.type_matcher === 0 && username === restrictedRule.name) {
                    isRestricted = true;
                }

                if (restrictedRule.type_matcher === 1 && username.includes(restrictedRule.name)) {
                    isRestricted = true;
                }
            });

            if (_.isEmpty(isRestricted) === false) {
                isRestricted = true;
            }
            return isRestricted;
        } catch (error) {
            return true;
        }
    },

    RevokeToken: async (userId, Model) => {
        try {
            // Revoke all Access Token
            const args = {
                is_revoked: '1',
                updated_date: Utils.Timestamp()
            };
            await Model.access_tokens.update(args, {
                where: {
                    user_id: userId
                },
                silent: true
            });

            // Delete all apiKey of User
            await Model.app_token.destroy({
                where: {
                    user_id: userId
                }
            });

            return true;
        } catch (error) {
            return false;
        }
    },
    DecryptStringWithRsaPrivateKey: (encrypted) => {
        try {
            if (_.isEmpty(encrypted) === true) {
                return false;
            }
            const RSA = new NodeRSA();
            const privateKey = Fse.readFileSync(process.env.RSA_PRIVATE_KEY_PATH, 'utf8');
            RSA.importKey(privateKey);
            RSA.setOptions({ encryptionScheme: 'pkcs1' });
            return RSA.decrypt(encrypted, 'utf8');
        } catch (error) {
            return false;
        }
    }
};
module.exports = Accounts;
