import { generalNotFoundResponse } from '../utils/response.util';
// import apiTestRouter from '../routes/test.route';
import indexRouter from '../routes/index.route';

const loadRouterMiddleware = (app) => {
  // app.use('/', indexRouter);
  app.use('/ease-dao', indexRouter);
  // 404 handler
  app.use((req, res) => {
    generalNotFoundResponse(res);
  });
};

export default loadRouterMiddleware;
