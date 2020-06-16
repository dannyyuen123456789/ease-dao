/* eslint-disable new-cap */
/* eslint-disable global-require */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/newline-after-import */
/* eslint-disable no-unused-vars */
import printLogWithTime from '../utils/log';

const util = require('util');
const _ = require('lodash');
class DAO {
  constructor(dbType) {
    this.dbType = dbType;
  }

  getInstance() {
    let dao = '';
    if (_.eq(this.dbType, 'AWS')) {
      const aws = require('./aws/awsDAO');
      dao = new aws();
    }
    if (_.isEmpty(this.dbType)) {
      dao = this;
    }
    return dao;
  }

  getCollectionNameById(docId) {
    let type = '';
    if (_.endsWith(docId, '_RLSSTATUS')) {
      type = 'apiResponse';
    } else if (docId.substring(0, 2) === '10' || docId.substring(0, 2) === '30') {
      type = 'approval';
    } else if (docId.substring(0, 2) === 'CP') {
      type = 'customer';
    } else if (docId.substring(0, 2) === 'FN') {
      if (_.endsWith(docId, '-FE')) type = 'fnaFe';
      else if (_.endsWith(docId, '-NA')) type = 'fnaNa';
      else if (_.endsWith(docId, '-PDA')) type = 'fnaPda';
      else type = 'fna';
    } else if (docId.substring(0, 2) === 'NB') {
      type = 'application';
    } else if (docId.substring(0, 2) === 'QU') {
      type = 'quotation';
    } else if (docId.substring(0, 2) === 'SA') {
      type = 'shieldApplication';
    } else if (docId.substring(0, 2) === 'SP') {
      type = 'shieldApproval';
    } else if (docId.substring(0, 2) === 'U_') {
      type = 'agent';
    } else if (docId.substring(0, 3) === 'UX_') {
      type = 'agentExtraInfo';
    // } else if (docId.substring(0, 6) === 'appid-') {
    //   type = 'appid';
    } else if (docId.substring(0, 4) === 'AUD-') {
      type = 'aud';
    } else if (docId.length === 52 || docId.length === 50) {
      type = 'dataSyncTransactionLog';
    } else if (_.endsWith(docId, '-seq') || _.eq(docId, 'agentNumberMap')) {
      type = 'seqMaster';
    } else {
      type = 'masterData';
    }
    printLogWithTime(`Collection name - ${type}`);
    return type;
  }

  replaceDot(obj, rev) {
    _.forOwn(obj, (value, key) => {
      // if key has a period, replace all occurences with an underscore
      let replaceKey = '.';
      let replaceValue = '<|>';
      if (rev) {
        replaceValue = '.';
        replaceKey = '<|>';
      }
      if (_.includes(key, replaceKey)) {
        const cleanKey = _.replace(key, replaceKey, replaceValue);
        // eslint-disable-next-line no-param-reassign
        obj[`${cleanKey}`] = value;
        // eslint-disable-next-line no-param-reassign
        delete obj[`${key}`];
      }

      // continue recursively looping through if we have an object or array
      if (_.isObject(value)) {
        return this.replaceDot(value);
      }
      return null;
    });
    return obj;
  }
}


module.exports = DAO;
