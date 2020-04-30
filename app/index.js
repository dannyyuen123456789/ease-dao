/**
 * @module app/index
 */

import express from 'express';

import loadRouter from './preLoader/router.loader';
import loadSecurity from './preLoader/security.loader';
import loadCors from './preLoader/cors.loader';
import loadLogger from './preLoader/logger.loader';
import loadExpressBasic from './preLoader/express.loader';
import loadSshtunnelMiddleWare from './preLoader/sshtunnel.loader';


const app = express();
const init = async (_app) => {
  loadExpressBasic(_app);
  loadSecurity(_app);
  loadLogger(_app);
  loadCors(_app);
  loadRouter(_app);
  loadSshtunnelMiddleWare();
};
init(app);
export default app;
