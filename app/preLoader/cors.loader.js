import cors from 'cors';

const loadCorsMiddleware = (app) => {
  app.use(cors());
};

export default loadCorsMiddleware;
