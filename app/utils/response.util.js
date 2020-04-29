/**
 * @module utils/response
 * @author Kevin Liang <kevin.liang@eabsystems.com>
 */
const httpResponseStatus = {
  continue: 100,
  switchingProtocol: 101,
  processing: 102,
  ok: 200,
  created: 201,
  accepted: 202,
  nonAuthoritativeInformation: 203,
  noContent: 204,
  resetContent: 205,
  partialContent: 206,
  multiStatus: 207,
  imUsed: 226,
  multipleChoice: 300,
  movedPermanently: 301,
  found: 302,
  seeOther: 303,
  notModified: 304,
  useProxy: 305,
  unused: 306,
  temporaryRedirect: 307,
  permanentRedirect: 308,
  badRequest: 400,
  unauthorized: 401,
  paymentRequired: 402,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  notAcceptable: 406,
  proxyAuthenticationRequired: 407,
  requestTimeout: 408,
  conflict: 409,
  gone: 410,
  lengthRequired: 411,
  preconditionFailed: 412,
  payloadTooLarge: 413,
  uriTooLong: 414,
  unsupportedMediaType: 415,
  requestedRangeNotSatisfiable: 416,
  expectationFailed: 417,
  imATeapot: 418,
  misdirectedRequest: 421,
  unprocessableEntity: 422,
  locked: 423,
  failedDependency: 424,
  upgradeRequired: 426,
  preconditionRequired: 428,
  tooManyRequests: 429,
  requestHeaderFieldsTooLarge: 431,
  unavailableForLegalReasons: 451,
  internalServerError: 500,
  notImplemented: 501,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeout: 504,
  variantAlsoNegotiates: 506,
  insufficientStorage: 507,
  loopDetected: 508,
  notExtended: 510,
  networkAuthenticationRequired: 511,
};

/**
   * @function
   * @description Return success response status and info to client side
   * @param {object} res - express response param
   * @param {object|string} resObj - the info should return to client side
   */
const generalSuccessResponse = (res, resObj) => {
  res.status(httpResponseStatus.ok).send(resObj);
};

/**
   * @function
   * @description Return bad request response status and info to client side.
   * Usually due to lack of param or db record not exist.
   * @param {object} res - express response param
   * @param {object|string} resObj - the info should return to client side
   */
const generalBadRequestResponse = (res, resObj) => {
  res.status(httpResponseStatus.badRequest).send({ status: 'error', message: resObj });
};

/**
   * @function
   * @description Return internal server error response status and info to client side.
   * Usually due to error code, error logic or other unexpected errors.
   * @param {object} res - express response param
   * @param {object|string} resObj - the info should return to client side
   */
const generalInternalServerErrorResponse = (res, err) => {
  res.status(httpResponseStatus.internalServerError).send({ status: 'error', exception: err });
};

/**
   * @function
   * @description Return not found error response status and info to client side.
   * Usually due to not exist end point.
   * @param {object} res - express response param
   */
const generalNotFoundResponse = (res) => {
  res.status(httpResponseStatus.notFound).send({ status: 'error', message: 'Not found' });
};

/**
   * @function
   * @description Return other response status and info to client side.
   * @param {object} res - express response param
   * @param {string} statusCode - custom status code
   */
const customResponse = (res, statusCode, resObj) => {
  res.status(statusCode).send(resObj);
};

export {
  httpResponseStatus,
  generalSuccessResponse,
  generalBadRequestResponse,
  generalInternalServerErrorResponse,
  generalNotFoundResponse,
  customResponse,
};
