/**
 * @module app/index
 */

import express from 'express';

import loadRouter from './preLoader/router.loader';
import loadSecurity from './preLoader/security.loader';
import loadCors from './preLoader/cors.loader';
import loadLogger from './preLoader/logger.loader';
import loadExpressBasic from './preLoader/express.loader';
// import loadSshtunnelMiddleWare from './preLoader/sshtunnel.loader';
import checkS3Connection from './preCheck/s3';
import documentDBCheck from './preCheck/documentDB';
import printLogWithTime from './utils/log';
import config from '../config/config';

const _ = require('lodash');

const app = express();
const init = async (_app) => {
  const s3Check = await checkS3Connection.checkS3Connection();
  const isConnectDocumentDB = await documentDBCheck.checkDocumentConnection();
  const dbInUse = _.get(config, 'dbInUse');

  if (isConnectDocumentDB && isConnectDocumentDB !== true) {
    printLogWithTime(`Connect to ${dbInUse} - Failed`);
  } else {
    printLogWithTime(`Connect to ${dbInUse} - OK`);
  }

  printLogWithTime('');
  printLogWithTime('========== 3 - Server Initializing==========');

  if (isConnectDocumentDB && s3Check) {
    printLogWithTime('Server Initializing...');
    loadExpressBasic(_app);
    loadSecurity(_app);
    loadLogger(_app);
    loadCors(_app);
    loadRouter(_app);
    // loadSshtunnelMiddleWare();
    printLogWithTime('Server Initializing - OK');
    printLogWithTime('');
    printLogWithTime('***************************************');
    printLogWithTime(`Server started and listening port ${config.apiPort}`);
    printLogWithTime('');
  } else {
    printLogWithTime('Server Initializing - Failed');
  }
};
init(app);
export default app;
