/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty */
// eslint-disable-next-line no-empty
import printLogWithTime from '../utils/log';

const _ = require('lodash');
const DAO = require('../database/DAO');
const config = require('../../config/config');

class fileUtils {
  constructor(fileSystem) {
    this.fileSystem = fileSystem;
  }

  getInstance() {
    let dao = '';
    if (_.eq(this.fileSystem, 'AWS-S3')) {
      // eslint-disable-next-line global-require
      const aws = require('./aws/s3');
      // eslint-disable-next-line new-cap
      dao = new aws();
    }
    return dao;
  }

  calBase64FileSize(inBase64) {
    let base64 = _.replace(inBase64, '=', '');
    base64 = _.replace(base64, /^data:image\/\w+;base64,/, '');
    const strLength = _.size(base64);
    const fileSize = strLength - (strLength / 8) * 2;
    return fileSize;
  }

  getBucketNameById(docId) {
    const fileServerSetting = _.get(config, 'fileServerSetting');
    const fileServerInUse = _.get(config, 'fileServerInUse');

    let bucket = _.get(fileServerSetting, _.join([fileServerInUse, 'transBucket'], '.'));

    if (docId.substring(0, 2) === '10' || docId.substring(0, 2) === '30') {
    } else if (docId.substring(0, 2) === 'CP') {
    } else if (docId.substring(0, 2) === 'FN') {
    } else if (docId.substring(0, 2) === 'NB') {
    } else if (docId.substring(0, 2) === 'QU') {
    } else if (docId.substring(0, 2) === 'SA') {
    } else if (docId.substring(0, 2) === 'SP') {
    } else if (docId.substring(0, 2) === 'U_') {
    } else if (docId.substring(0, 3) === 'UX_') {
    } else if (docId.substring(0, 6) === 'appid-') {
    } else if (docId.substring(0, 4) === 'AUD-') {
    } else if (docId.length === 52 || docId.length === 50) {
    } else if (_.endsWith(docId, '-seq') || _.eq(docId, 'agentNumberMap')) {
    } else {
      bucket = _.get(fileServerSetting, _.join([fileServerInUse, 'masterBucket'], '.'));;
    }
    const dao1 = new DAO();
    const awsDao = dao1.getInstance();
    const subFolder = awsDao.getCollectionNameById(docId);
    if (!_.eq(subFolder, 'masterData')) {
      bucket = `${bucket}/${awsDao.getCollectionNameById(docId)}`;
    }
    // printLogWithTime(`docId = ${docId}`);
    // printLogWithTime(`bucket = ${bucket}`);

    return bucket;
  }

  getFileKeyById(docId, attachment) {
    const fileKey = _.join([docId, attachment], '-');
    return fileKey;
  }
}

module.exports = fileUtils;
