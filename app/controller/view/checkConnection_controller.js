import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';


exports.api = {
  check(req, res, next) {
    printLogWithTime('Get view');
    printLogWithTime(`Request - ${req.originalUrl}`);
    if (mongoose.connection.readyState === 1) {
      next();
    } else {
      printLogWithTime('!!!Database connection error!!!');
      res.json({ status: 400, message: '!!!Database connection error!!!' });
    }
  },
};
