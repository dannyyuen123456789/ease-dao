/* eslint-disable no-console */

const moment = require('moment');

const printLogWithTime = (log) => {
  console.log(`${moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS')} -> ${log}`);
};

export { printLogWithTime as default };
