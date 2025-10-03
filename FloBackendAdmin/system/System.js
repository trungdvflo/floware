/* eslint-disable no-unused-vars */
/* eslint-disable prefer-promise-reject-errors */
const _ = require('lodash');
const Hapi = require('@hapi/hapi');
const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs-extra');
const Async = require('async');
const Good = require('@hapi/good');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Lcfirst = require('lcfirst');
const I18n = require('hapi-i18n');
const HapiSwagger = require('hapi-swagger');
const Sequelize = require('./Sequelize');
const Cache = require('./Cache');
const Queue = require('./Queue');
const Config = require('./Config');
const AwsSQS = require('./AWS/SQS');
const AwsS3 = require('./AWS/S3');

const PROJECTS_PATH = `${__dirname}/../projects/`.replace('/system/../', '/');

const System = {
  projects: {},
  connections: {},
  awsS3: {},
  awsSQS: [],
  RequireWithCheckExist: (path) => {
    if (Fs.pathExistsSync(path)) {
      return require(path.replace('.js', ''));
    }
    return false;
  },

  Load: async (projectStart = []) => {
    return new Promise((resolve, reject) => {
      let pathProjectList = [];

      if (_.isEmpty(projectStart) === true) {
        pathProjectList = Filehound.create()
          .path(PROJECTS_PATH)
          .directory()
          .depth(0)
          .findSync();
      } else {
        _.forEach(projectStart, (v) => {
          pathProjectList.push(
            PROJECTS_PATH + v
          );
        });
      }

      Async.forEachOf(pathProjectList, (v, k, callback) => {
        const project = {};
        project.config = {};
        project.basePath = Path.basename(v);
        project.fullPath = v;
        System.projects[project.basePath] = project;
        callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyConfig: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const pathConfigList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/configs`)
          .ext('.js')
          .depth(0)
          .findSync();
        Async.forEachOf(pathConfigList, (pathConfig, key, cb) => {
          Config(System.RequireWithCheckExist(pathConfig), pathConfig);
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  GetInfo: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const generalConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/General.js`);
        if (generalConfig) {
          System.projects[k].title = generalConfig.title;
          System.projects[k].active = generalConfig.active;
        }
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  CreateHapiServer: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const pathApp = Path.resolve(`${PROJECTS_PATH}${project.basePath}/app.js`);
        const app = System.RequireWithCheckExist(pathApp);
        if (app) {
          System.projects[project.basePath].app = app;
          require.cache[pathApp].exports = project;
        } else {
          return reject('Missing app.js');
        }
        let server = [];
        const httpConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Http.js`);

        if (!httpConfig) {
          return reject(`No HTTP setup found at project ${project.title}`);
        }
        if (httpConfig.active === true) {
          const configConnection = {
            port: httpConfig.port,
            host: httpConfig.host
          };
          if (httpConfig.cors) {
            configConnection.routes = {
              cors: httpConfig.cors
            };
          }
          server = new Hapi.Server(configConnection);
          System.projects[project.basePath].isActiveHttp = true;
        } else {
          System.projects[project.basePath].isActiveHttp = false;
        }

        System.projects[project.basePath].server = server;
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyPluginGood: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const logConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Log.js`);
        if (!logConfig) {
          return reject(`No HTTP setup found at project ${project.title}`);
        }
        server.register({
          plugin: Good,
          options: logConfig
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyPluginI18n: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const languageConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Language.js`);
        if (!languageConfig) {
          return reject(`Can't found language config at project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (languageConfig.active === true) {
            server.log('warn', `Can't active language when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (languageConfig.active === false) {
          return callback();
        }
        const languageConfigOptions = languageConfig.options;
        languageConfigOptions.directory = `${PROJECTS_PATH}${project.basePath}/locales`;
        server.register({
          plugin: I18n,
          options: languageConfigOptions
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyPluginSwagger: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const docConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Documentation.js`);
        if (!docConfig) {
          return reject(`No HTTP setup found at project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (docConfig.active === true) {
            server.log('warn', `Can't active document when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (docConfig.active === false) {
          return callback();
        }

        server.register([
          Inert,
          Vision,
          {
            plugin: HapiSwagger,
            options: docConfig.options
          }
        ]);
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyPlugin: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const pluginConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Plugin.js`);
        if (!pluginConfig) {
          return reject(`No HTTP setup found at project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (pluginConfig.active === true) {
            server.log('warn', `Can't active plugin when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (pluginConfig.active === false) {
          return callback();
        }
        server.register(pluginConfig.register);
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyAuthentication: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const authenticationConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Authentication.js`);

        if (!authenticationConfig) {
          return reject(`No Authentication Config setting found at project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (authenticationConfig.active === true) {
            server.log('warn', `Can't active authentication when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (authenticationConfig.active === false) {
          return callback();
        }
        const pathAuthenticationList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/authentications`)
          .ext('.js')
          .glob('*Authentication.js')
          .findSync();
        Async.forEachOf(pathAuthenticationList, (pathAuthentication, key, cb) => {
          const authentication = System.RequireWithCheckExist(pathAuthentication);

          if (_.isFunction(authentication.Apply) === true) {
            authentication.Apply(server, Path.basename(pathAuthentication, 'Authentication.js'));
          }
          return cb();
        }, (err) => {
          if (err) return reject(err);
          if (_.isUndefined(authenticationConfig.default) === false) {
            try {
              server.auth.default(authenticationConfig.default);
            } catch (error) {
              reject(error.message);
            }
          }
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyRouter: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const routerConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Router.js`);
        if (!routerConfig) {
          return reject(`The Router Config setting was not found at the project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (routerConfig.active === true) {
            server.log('Warn', `Can't active router when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (routerConfig.active === false) {
          return callback();
        }
        const pathRouterList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/routers`)
          .ext('.js')
          .glob('*Router.js')
          .findSync();
        Async.forEachOf(pathRouterList, (pathRouter, key, cb) => {
          const routers = System.RequireWithCheckExist(pathRouter);
          _.forEach(routers, (router) => {
            try {
              const tmpRouter = router;
              const currentResponseStatus = _.get(tmpRouter, 'options.response.status', false);
              const appendResponseStatus = _.get(routerConfig, 'appendResponseStatus', false);
              const isAppendStatus = _.get(tmpRouter, 'options.response.isAppendStatus', true);

              if (currentResponseStatus && appendResponseStatus) {
                if (isAppendStatus) {
                  tmpRouter.options.response.status = _.merge(currentResponseStatus, appendResponseStatus);
                }
              }
              delete tmpRouter.options.response.isAppendStatus;
              if (tmpRouter.options.validate) {
                tmpRouter.options.validate.failAction = (request, h, err) => {
                  return err;
                };
              }

              server.route(tmpRouter);
            } catch (errRouter) {
              reject(errRouter.message);
            }
          });
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyHook: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const { server } = project;
        const hookConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Hook.js`);
        if (!hookConfig) {
          return reject(`Can't found hook config at project ${project.title}`);
        }
        if (project.isActiveHttp === false) {
          if (hookConfig.active === true) {
            server.log('warn', `Can't active hook when not active http at project ${project.title}`);
          }
          return callback();
        }
        if (hookConfig.active === false) {
          return callback();
        }
        const pathHookList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/hooks`)
          .ext('.js')
          .glob('*Hook.js')
          .findSync();
        Async.forEachOf(pathHookList, (pathHook, key, cb) => {
          const hook = System.RequireWithCheckExist(pathHook);
          const hookName = Lcfirst(Path.basename(pathHook, 'Hook.js'));
          if (_.indexOf(hookConfig.allows, hookName) > -1) {
            try {
              server.ext(hookName, hook);
            } catch (error) {
              reject(error.message);
            }
          }
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyAwsS3: async () => {
    return new Promise((resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const AwsConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Aws.js`);
        if (!AwsConfig) {
          console.log('Backend admin AWS S3');
          return reject(`Không tìm thấy thiết lập AWS S3 tại dự án ${project.title}`);
        }
        const AwsS3Config = AwsConfig.S3;
        if (!AwsS3Config) {
          console.log('Backend admin AWS S3');
          return reject(`Không tìm thấy thiết lập AWS S3 tại dự án ${project.title}`);
        }

        if (AwsS3Config.active === false) {
          return callback();
        }

        /**
             * Set config
             */
        _.forEach(AwsS3Config, (AwsS3ConfigValue, AwsS3ConfigKey) => {
          System.awsS3[`${AwsS3ConfigKey}`] = AwsS3ConfigValue;
        });

        const pathAwsS3 = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/utilities/aws/`)
          .ext('.js')
          .glob('*S3.js')
          .findSync();

        Async.forEachOf(pathAwsS3, (pathS3, key, cb) => {
          const cache = System.RequireWithCheckExist(pathS3);
          AwsS3.ApplyAwsS3(cache, pathS3, project.basePath, System.awsS3);
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyAwsSQS: async () => {
    return new Promise((resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const AwsConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Aws.js`);
        if (!AwsConfig) {
          console.log('Backend admin AWS S3');
          return reject(`Không tìm thấy thiết lập AWS S3 tại dự án ${project.title}`);
        }
        const AwsSQSConfig = AwsConfig.SQS;
        if (!AwsSQSConfig) {
          console.log('Backend admin AWS S3');
          return reject(`Không tìm thấy thiết lập AWS S3 tại dự án ${project.title}`);
        }

        if (AwsSQSConfig.active === false) {
          return callback();
        }

        /**
             * Set config
             */
        _.forEach(AwsSQSConfig, (AwsSQSConfigValue, AwsSQSConfigKey) => {
          System.awsSQS[`${AwsSQSConfigKey}`] = AwsSQSConfigValue;
        });

        const pathAwsSQS = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/utilities/aws/`)
          .ext('.js')
          .glob('*SQS.js')
          .findSync();

        Async.forEachOf(pathAwsSQS, (pathSQS, key, cb) => {
          const cache = System.RequireWithCheckExist(pathSQS);
          AwsSQS.ApplyAwsSQS(cache, pathSQS, project.basePath, System.awsSQS);
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  StartHapiServer: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, async (project, k, callback) => {
        const { server } = project;
        if (project.isActiveHttp === true) {
          await server.start();
          if (_.isFunction(project.app.Start)) {
            await project.app.Start();
          }
          console.log('Info', `[${project.title}] Server running at: ${server.info.uri}`);
        } else {
          console.log('Info', `[${project.title}] loaded !`);
        }
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyConnection: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, key, callback) => {
        const connectionConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Connection.js`);
        _.forEach(connectionConfig, (v, k) => {
          System.connections[`${k}`] = v;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyModel: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const pathModelList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/models`)
          .ext('.js')
          .glob('*Model.js')
          .findSync();
        const pathModelList32 = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/models32`)
          .ext('.js')
          .glob('*Model.js')
          .findSync();

        Async.forEachOf([...pathModelList, ...pathModelList32], (pathModel, key, cb) => {
          const model = System.RequireWithCheckExist(pathModel);
          const engine = _.get(System.connections[`${model.datastore}`], 'engine', false);
          if (engine === 'sequelize') {
            Sequelize.ApplyModel(model, pathModel, project.basePath);
          }
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyCache: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, k, callback) => {
        const pathCacheList = Filehound.create()
          .path(`${PROJECTS_PATH}${project.basePath}/caches`)
          .ext('.js')
          .glob('*Cache.js')
          .findSync();

        Async.forEachOf(pathCacheList, (pathCache, key, cb) => {
          const cache = System.RequireWithCheckExist(pathCache);
          const engine = _.get(System.connections[`${cache.connection}`], 'engine', false);
          if (engine === 'cache') {
            Cache.ApplyCache(cache, pathCache, project.basePath);
          }
          return cb();
        }, (err) => {
          if (err) return reject(err);
          return true;
        });
        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  ApplyWorkers: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, key, callback) => {
        const workersConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Workers.js`);

        if (workersConfig.active === true) {
          System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/services/Workers/index.js`);
        }

        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },
  ApplyCrons: async () => {
    return new Promise(async (resolve, reject) => {
      Async.forEachOf(System.projects, (project, key, callback) => {
        const cronsConfig = System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/configs/Crons.js`);

        if (cronsConfig.active === true) {
          System.RequireWithCheckExist(`${PROJECTS_PATH}${project.basePath}/services/Crons/index.js`);
        }

        return callback();
      }, (err) => {
        if (err) return reject(err);
        return resolve(System.projects);
      });
    });
  },

  StartEngineDb: async () => {
    return new Promise(async (resolve, reject) => {
      await Sequelize.Start(System.connections);
      resolve(true);
    });
  },

  StartEngineCache: async () => {
    return new Promise(async (resolve, reject) => {
      await Cache.Start(System.connections);
      resolve(true);
    });
  },

  StartQueue: async () => {
    return new Promise(async (resolve, reject) => {
      await Queue.Start(System.connections);
      resolve(true);
    });
  },

  StartAwsS3: async () => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      await AwsS3.Start(System.awsS3);
      resolve(true);
    });
  },

  StartAwsSQS: async () => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      await AwsSQS.Start(System.awsSQS);
      resolve(true);
    });
  }

};

module.exports = {

  Start: (projectStarted = []) => {
    return new Promise(async (resolve, reject) => {
      Async.waterfall([
        // region Load project list 
        (callback) => {
          System.Load(projectStarted)
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply config
        (callback) => {
          System.ApplyConfig()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Get info project
        (callback) => {
          System.GetInfo(projectStarted)
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Connection
        (callback) => {
          System.ApplyConnection()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Model
        (callback) => {
          System.ApplyModel()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Cache
        (callback) => {
          System.ApplyCache()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Queue
        (callback) => {
          System.StartQueue()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Start Engine Db
        (callback) => {
          System.StartEngineDb()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Start Engine Cache
        (callback) => {
          System.StartEngineCache()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Start AwsS3
        (callback) => {
          System.ApplyAwsS3()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        (callback) => {
          System.StartAwsS3()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Start AwsSQS
        (callback) => {
          System.ApplyAwsSQS()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        (callback) => {
          System.StartAwsSQS()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              console.log(error);
              callback(error);
            });
        },
        // endregion

        // region Khởi tạo Hapi Server 
        (callback) => {
          System.CreateHapiServer()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply plugin Good 
        (callback) => {
          System.ApplyPluginGood()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply plugin Swagger 
        (callback) => {
          System.ApplyPluginSwagger()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply plugin
        (callback) => {
          System.ApplyPlugin()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Authentication
        (callback) => {
          System.ApplyAuthentication()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Router
        (callback) => {
          System.ApplyRouter()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Apply Hook
        (callback) => {
          System.ApplyHook()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Workers
        (callback) => {
          System.ApplyWorkers()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion
        // region Crons
        (callback) => {
          System.ApplyCrons()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        },
        // endregion

        // region Start Hapi server
        (callback) => {
          System.StartHapiServer()
            .then(() => {
              callback(null);
            })
            .catch((error) => {
              callback(error);
            });
        }
        // endregion

      ], (err) => {
        if (err) { return reject(err); }
        return resolve(System.projects);
      });
    });
  }
};
