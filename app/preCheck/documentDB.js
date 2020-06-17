/* eslint-disable no-console */
/* eslint-disable security/detect-non-literal-fs-filename */
import mongoose from 'mongoose';
import systemConfig from '../../config/config.json';
import printLogWithTime from '../utils/log';

const fs = require('fs');
const _ = require('lodash');
const tunnel = require('tunnel-ssh');

const checkDocumentConnection = () => new Promise((resolve, reject) => {
  const sshConfigs = _.get(systemConfig, 'sshConfig');
  const sshConnection = _.get(systemConfig, 'sshConnection');
  const dbInUse = _.get(systemConfig, 'dbInUse');

  printLogWithTime('');
  printLogWithTime(`========== 2 - Connect to ${dbInUse}==========`);

  const dbSetting = _.get(systemConfig, 'dbSetting');

  let userName = process.env.database_user_name;
  userName = escape(userName);

  let pwd = process.env.database_password;
  pwd = escape(pwd);

  const url = _.get(dbSetting, _.join([dbInUse, 'databaseURL'], '.'));
  const databaseName = _.get(dbSetting, _.join([dbInUse, 'databaseName'], '.'));
  const dbType = _.get(dbSetting, _.join([dbInUse, 'dbType'], '.'));
  const DB_URL = `mongodb://${userName}:${pwd}@${url}/${databaseName}`;

  // ==== db connection =====
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
        if (error) {
          printLogWithTime(`Connect to SSH - FAILED: ${error}`);
        }
        if (server) {
          printLogWithTime('Connect to SSH - OK ');
        }

        printLogWithTime(`Connecting to ${dbInUse}...`);

        mongoose.connect(DB_URL, {
          ssl: true,
          sslValidate: false,
          useNewUrlParser: true,
          sslCA: fs.readFileSync(systemConfig.sslConfig.caFile),
          useUnifiedTopology: true,
        });
      });
    }
  } else if (_.eq(dbType, 'mongo')) {
    printLogWithTime(`Connecting to ${dbInUse}...`);
    mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } else if (_.eq(dbType, 'aws')) {
    printLogWithTime(`Connecting to ${dbInUse}...`);
    mongoose.connect(DB_URL, {
      ssl: true,
      sslValidate: false,
      useNewUrlParser: true,
      sslCA: fs.readFileSync(systemConfig.sslConfig.caFile),
      useUnifiedTopology: true,
    });
  }

  mongoose.set('useFindAndModify', false);
  mongoose.connection.on('connected', () => {
    resolve(true);
  });

  mongoose.connection.on('disconnecting', () => {
    console.error('Disconnecting to Mongodb');
  });

  mongoose.connection.on('reconnected', () => {
    printLogWithTime('Mongodb reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('error', err);
    printLogWithTime('');
    reject();
  });
});

export default {
  checkDocumentConnection,
};
