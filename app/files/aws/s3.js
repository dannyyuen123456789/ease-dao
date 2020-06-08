/* eslint-disable no-console */
/* eslint-disable security/detect-new-buffer */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable no-buffer-constructor */
/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* eslint-disable class-methods-use-this */
import AWS from 'aws-sdk';
import _ from 'lodash';
import s3Config from '../../../config/config';
import printLogWithTime from '../../utils/log';

const fileUtils = require('../fileUtils');

const logger = console;
const awsConf = s3Config.awsS3;

const s3Object = new AWS.S3({
  signatureVersion: awsConf.signatureVersion,
  region: awsConf.region,
  accessKeyId: awsConf.accessKeyId,
  secretAccessKey: awsConf.secretAccessKey,
});

class s3 extends fileUtils {
  constructor() {
    super();
  }

  async init() {
    this.setProxyEnv();
    return true;
  }

  // go through proxy
  setProxyEnv() {
    const isProxy = _.get(s3Config, 'awsS3.isProxy');
    const proxyLink = _.get(s3Config, 'awsS3.proxyLink');

    if (isProxy) {
      printLogWithTime('Proxy - Step 1');
      const HttpProxyAgent = require('https-proxy-agent');
      printLogWithTime('Proxy - Step 2');
      const proxyAgent = new HttpProxyAgent(proxyLink);
      printLogWithTime('Proxy - Step 3');
      AWS.config.httpOptions = { agent: proxyAgent };
      console.log(AWS.config.httpOptions);
    }
  }

  getCredentials() {
    return new Promise((resolve, reject) => {
      AWS.config.getCredentials((err) => {
        if (err) {
          reject(err);
        } else {
          logger.log('Access key:', AWS.config.credentials.accessKeyId);
          logger.log('Secret access key:', AWS.config.credentials.secretAccessKey);
          resolve();
        }
      });
    });
  }

  uploadBase64(docId, attachmentType, data, fileType) {
    return new Promise((resolve, reject) => {
      const buf = new Buffer(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const fileKey = this.getFileKeyById(docId, attachmentType);
      const bucketName = this.getBucketNameById(docId);
      const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: buf,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: awsConf.KmsID,
        ContentType: fileType, // "image/jpeg"
      };
      s3Object.upload(params, (error, dat) => {
        if (error) {
          reject(error);
        } else {
          resolve();
          logger.log(`Successfully uploaded data to ${bucketName}/${fileKey}`);
        }
      });
    });
  }

  deleteObject(docId, attachmentType) {
    return new Promise((resolve, reject) => {
      const fileKey = this.getFileKeyById(docId, attachmentType);
      const bucketName = this.getBucketNameById(docId);
      const params = {
        Bucket: bucketName,
        Key: fileKey,
      };
      s3Object.deleteObject(params, (error, dat) => {
        if (error) {
          reject(error);
        } else {
          resolve();
          logger.log(`Successfully delete ${bucketName}/${fileKey}`);
        }
      });
    });
  }

  async getAttachment(docId, attachmentType, cb) {
    return new Promise((resolve, reject) => {
      const bucketName = this.getBucketNameById(docId);
      const fileKey = this.getFileKeyById(docId, attachmentType);
      const executeParams = {
        Bucket: bucketName,
        Key: fileKey,
      };
      s3Object.getObject(executeParams, (err, data) => {
        if (err) {
          if (reject) {
            reject(err);
          }
        } else if (resolve) {
          if (typeof cb === 'function') {
            cb(data.Body);
          }
        }
      });
    });
  }

  async getAttachmentUrl(docId, attachmentType, cb) {
    return new Promise((resolve, reject) => {
      const bucketName = this.getBucketNameById(docId);
      const signedUrlExpireSeconds = 60 * 5;
      const fileKey = this.getFileKeyById(docId, attachmentType);
      const executeParams = {
        Bucket: bucketName,
        Key: fileKey,
        Expires: signedUrlExpireSeconds,
      };
      logger.log('getAttachmentUrl executeParams= ', executeParams);
      const url = s3Object.getSignedUrl('getObject', executeParams);
      if (url) {
        cb(url);
      }
    });
  }
}

module.exports = s3;
