/* eslint-disable max-len */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-var */
/* eslint-disable import/newline-after-import */
import mongoose from 'mongoose';
// import printLogWithTime from '../../utils/log';
const _ = require('lodash');
var DAO = require('../DAO');
class awsDAO extends DAO {
  constructor() {
    super();
  }

  async getDoc(docId) {
    var result = '';
    var status = true;
    var docType = this.getCollectionNameById(docId);
    if (docType && !_.isEmpty(docType)) {
      if (mongoose.connection.readyState === 1) {
        result = await mongoose.connection.collection(docType).findOne({ id: docId }).catch((error) => {
          if (error) {
            status = false;
            result = error.message;
          }
        });
      } else {
        result = 'Database connection error!!!';
        status = false;
      }
    }
    result = this.replaceDot(result, true);
    return { success: status, result };
  }

  async updateDoc(docId, data) {
    var result = '';
    var status = true;
    var docType = this.getCollectionNameById(docId);
    if (_.get(data, '_id')) {
      delete data._id;
    }
    if (!_.get(data, 'rev')) {
      _.set(data, 'rev', '1');
    }
    data = this.replaceDot(data);
    if (docType && !_.isEmpty(docType) && data && !_.isEmpty(data)) {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.collection(docType).updateOne({ id: docId }, { $set: data }, { upsert: true }).then((r) => {
          result = r.result;
        }).catch((error) => {
          if (error) {
            status = false;
            result = error.message;
          }
        });
      } else {
        result = 'Database connection error!!!';
        status = false;
      }
    }
    return { success: status, result };
  }

  async deleteDoc(docId) {
    var result = '';
    var status = true;
    var docType = this.getCollectionNameById(docId);
    if (docType && !_.isEmpty(docType)) {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.collection(docType).deleteOne({ id: docId }).then((r) => {
          result = r.result;
        }).catch((error) => {
          if (error) {
            status = false;
            result = error.message;
          }
        });
      } else {
        result = 'Database connection error!!!';
        status = false;
      }
    }
    return { success: status, result };
  }
}
module.exports = awsDAO;
