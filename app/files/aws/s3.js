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
  async init() {
    await this.setProxyEnv();
    return true;
  }

  // go through proxy
  setProxyEnv() {
    const isProxy = _.get(s3Config, 'awsS3.isProxy');
    const proxyLink = _.get(s3Config, 'awsS3.proxyLink');

    if (isProxy) {
      const HttpProxyAgent = require('https-proxy-agent');
      const proxyAgent = new HttpProxyAgent(proxyLink);
      AWS.config.httpOptions = { agent: proxyAgent };
    }
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
          console.log(`1 - ${err}`);
          if (reject) {
            console.log(`2 - ${reject}`);
            reject(err);
          }
          console.log('2.1');
        } else if (resolve) {
          console.log(`3 - ${resolve}`);
          if (typeof cb === 'function') {
            console.log('4 - success');
            cb(data.Body);
            console.log('4.1');
          }
          console.log('4.2');
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
      const url = s3Object.getSignedUrl('getObject', executeParams);

      if (url) {
        cb(url);
      }
    });
  }
}

module.exports = s3;
