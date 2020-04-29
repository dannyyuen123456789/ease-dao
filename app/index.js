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
import dbLoader from './preLoader/DBconnection.loader';

const app = express();
const init = async (app) => {
loadExpressBasic(app);
loadSecurity(app);
loadLogger(app);
loadCors(app);
loadRouter(app);
loadSshtunnelMiddleWare()

};
init(app);
export default app;
