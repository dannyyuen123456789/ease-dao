/* eslint-disable consistent-return */
/* eslint-disable security/detect-non-literal-fs-filename */
import systemConfig from '../../config/config';
import log4jUtil from '../utils/log4j.util';
import printLogWithTime from '../utils/log';
// var MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');
const tunnel = require('tunnel-ssh');

const initSshTunnel = async () => {
  const sshConfigs = _.get(systemConfig, 'sshConfig');
  const sshConnection = _.get(systemConfig, 'sshConnection');
  const dbInUse = _.get(systemConfig, 'dbInUse');
  const dbSetting = _.get(systemConfig, 'dbSetting');
  const caFile = _.get(systemConfig, 'sslConfig.caFile');
  //let userName = _.get(dbSetting, _.join([dbInUse, 'databaseUsername'], '.'));
  let userName = process.env.databaseUsername;
  userName = escape(userName);
  //let pwd = _.get(dbSetting, _.join([dbInUse, 'databasePassword'], '.'));
  let pwd = process.env.databasePassword;
  pwd = escape(pwd);
  const url = _.get(dbSetting, _.join([dbInUse, 'databaseURL'], '.'));
  const databaseName = _.get(dbSetting, _.join([dbInUse, 'databaseName'], '.'));
  // var ssh = _.get(dbSetting,_.join([dbInUse,"ssh"],"."));
  const dbType = _.get(dbSetting, _.join([dbInUse, 'dbType'], '.'));
  const DB_URL = `mongodb://${userName}:${pwd}@${url}/${databaseName}`;
  //= ==== db connection =====
  if (sshConnection) {
    if (sshConfigs) {
      const config = {
        keepAlive: true,
        username: _.get(sshConfigs, 'sshUserName'),
        host: _.get(sshConfigs, 'sshHost'),
        agent: process.env.SSH_AUTH_SOCK,
        privateKey: fs.readFileSync(_.get(sshConfigs, 'sshPrivateKeyFile')),
        port: _.get(sshConfigs, 'sshPort'),
        dstHost: _.get(sshConfigs, 'sshDstHost'),
        dstPort: _.get(sshConfigs, 'sshDstPort'),
        localHost: _.get(sshConfigs, 'sshLocalHost'),
        localPort: _.get(sshConfigs, 'sshLocalPort'),
      };


      tunnel(config, async (error, server) => {
        log4jUtil.log('info', 'SSH connecting ....... ');
        printLogWithTime('Proxy enabled = true');
        if (error) {
          log4jUtil.log('error', `SSH connection error: ${error}`);
        }
        if (server) {
          log4jUtil.log('info', 'SSH connected ....... ');
        }
        log4jUtil.log('info', '---- Mongo Db loading ----');
        if (_.eq(dbType, 'mongo')) {
          mongoose.connect(DB_URL, {
            ssl: true,
            sslValidate: false,
            useNewUrlParser: true,
            sslCA: fs.readFileSync(caFile),
            useUnifiedTopology: true,
          }).then((result) => {
            if (result) { log4jUtil.log('info', '----- Mongo Db init success ----'); }
          // eslint-disable-next-line no-unused-vars
          }).catch((err) => {
            if (error) { log4jUtil.log('info', 'Mongo Db:', ' init failed->', error.message); }
          });
        }
      });
    }
  } else if (_.eq(dbType, 'mongo')) {
    log4jUtil.log('info', '---- Mongo Db loading ----');
    mongoose.connect(DB_URL, {
      // ssl:true,
      // sslValidate: false,
      useNewUrlParser: true,
      // sslCA:fs.readFileSync("D:\\amazon\\rds-combined-ca-bundle.pem"),
      useUnifiedTopology: true,
    }).then((result) => {
      if (result) { log4jUtil.log('info', '---- Mongo Db init success ----'); return true; }
    }).catch((error) => {
      if (error) { log4jUtil.log('info', 'Mongo Db:', ' init failed->', error.message); }
    });
  }
};
const loadSshtunnelMiddleWare = async () => {
  await initSshTunnel();
  // await test();
};

//   const  loadSshtunnelMiddleWare =() => new Promise((resolve,reject) =>{
//     resolve(initSshTunnel());
//   });
export default loadSshtunnelMiddleWare;
