import helmet from 'helmet';

const loadSecurityMiddleware = (app) => {
  // Init Helmet security lib
  // Included features by default:
  // 1. dnsPrefetchControl(controls browser DNS prefetching),
  // 2. frameguard(prevent clickjacking),
  // 3. hidePoweredBy (remove the X-Powered-By header),
  // 4. hsts (HTTP Strict Transport Security),
  // 5. ieNoOpen (sets X-Download-Options for IE8+)
  // 6. noSniff (keep clients from sniffing the MIME type)
  // 7. xssFilter(adds some small XSS protections)
  // ref to: https://helmetjs.github.io/docs/
  app.use(helmet());
  app.use(helmet.noCache());
};

export default loadSecurityMiddleware;
