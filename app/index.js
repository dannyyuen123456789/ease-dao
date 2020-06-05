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
import printLogWithTime from '../app/utils/log';
import config from '../config/config';
const app = express();
const init = async (_app) => {
  const s3Check = await checkS3Connection.checkS3Connection();
  const isConnectDocumentDB = await documentDBCheck.checkDocumentConnection();
  if(isConnectDocumentDB && s3Check){
    printLogWithTime('>>>>>>Initializing server<<<<<<');
    loadExpressBasic(_app);
    loadSecurity(_app);
    loadLogger(_app);
    loadCors(_app);
    loadRouter(_app);
    // loadSshtunnelMiddleWare();
    printLogWithTime(`>>>>>>Listening on port ${config.apiPort}<<<<<<`);
  }else{
    printLogWithTime(`>>>>>>Initialize failed<<<<<<`);
  }
  
};
init(app);
export default app;
