/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
import cookieParser from 'cookie-parser';

import express from 'express';

const loadExpressBasicMiddleware = (app) => {
  // app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  // app.use(express.json({limit: '50mb'}));
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
};

export default loadExpressBasicMiddleware;
