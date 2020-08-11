import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';


exports.api = {
  check(req, res, next) {
    printLogWithTime(`Request view received - ${req.originalUrl}`);
    printLogWithTime('----------------------------------------------------------------------');
    if (mongoose.connection.readyState === 1) {
      next();
    } else {
      printLogWithTime('!!!Database connection error!!!');
      printLogWithTime('----------------------------------------------------------------------');
      res.json({ status: 400, message: '!!!Database connection error!!!' });
    }
  },
};
