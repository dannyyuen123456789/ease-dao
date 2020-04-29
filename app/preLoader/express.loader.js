import cookieParser from 'cookie-parser';

import express from 'express';

const loadExpressBasicMiddleware = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};

export default loadExpressBasicMiddleware;
