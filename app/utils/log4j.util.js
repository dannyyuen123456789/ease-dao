/**
 * @module utils/log4j
 */
const log4js = require('log4js');

const log4j = log4js.getLogger();

/**
 * @author Kevin Liang <kevin.liang@eabsystems.com>
 * @function
 * @description Write log into terminal or [ELK]{@link https://www.elastic.co/elk-stack} (not now, do it when ELK is ready) with [log4js]{@link https://log4js-node.github.io/log4js-node/} lib
 * @param {string=} level - Log level
 * Log level: ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
 * @param {string=} info - log info
 * @param {string=} requestUUID - request id
 * (every http request has unique id in order to debugger conveniently)
 */
const log = (level, info, requestUUID) => {
  switch (level.toLocaleLowerCase()) {
    case 'all':
      log4j.all(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'trace':
      log4j.trace(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'debug':
      log4j.debug(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'info':
      log4j.info(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'warn':
      log4j.warn(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'error':
      log4j.error(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'fatal':
      log4j.fatal(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'mark':
      log4j.mark(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    case 'off':
      log4j.off(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
      break;
    default:
      log4j.info(`${info} ${requestUUID ? '[uuid: ' : ''} ${requestUUID || ''} ${requestUUID ? ']' : ''} `);
  }
};

export default {
  log,
};
