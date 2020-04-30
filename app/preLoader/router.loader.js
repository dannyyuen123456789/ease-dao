import { generalNotFoundResponse } from '../utils/response.util';
// import apiTestRouter from '../routes/test.route';
import indexRouter from '../routes/index.route';
import viewRouter from '../routes/view.route';

const loadRouterMiddleware = (app) => {
  // app.use('/', indexRouter);
  app.use('/ease-dao', indexRouter);
  app.use('/ease-dao/_design', viewRouter);
  // 404 handler
  app.use((req, res) => {
    generalNotFoundResponse(res);
  });
};

export default loadRouterMiddleware;
