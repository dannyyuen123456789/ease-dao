import AWS from 'aws-sdk';
import _ from 'lodash';
import config from '../../../config/config';
const fileUtils = require("../fileUtils");
const logger = console;
const awsConf = config.awsConfig;
const bucketBaseName = awsConf.bucketBaseName ? awsConf.bucketBaseName : 'bucket-base';
// Create an S3 client
// const s3 = new AWS.S3();
// Add KMS, need region
const s3 = new AWS.S3({region: process.env.kmsregion,'signatureVersion':'v4'});

// Create a bucket and upload something into it
const bucketName = `${bucketBaseName}`;

class s3 extends fileUtils{
constructor(){
    super();
    };
getCredentials = () => {
  logger.log('awsUtil getCredentials');
  return new Promise((resolve, reject) => {
    if(this.proxyAgent){
        AWS.config.httpOptions = { agent: this.proxyAgent };
    }
    AWS.config.loadFromPath('./credentials');
    AWS.config.getCredentials((err) => {
      logger.log('get getCredentials');
      if (err) {
        logger.log('credentials error');
        reject(err);
      } else {
        logger.log('Access key:', AWS.config.credentials.accessKeyId);
        logger.log('Secret access key:', AWS.config.credentials.secretAccessKey);
        resolve();
      }
    });
  });
};

uploadDoc = (fileName, data) => {
  // logger.log('awsUtil uploadDoc bucketName', bucketName);
  // logger.log('awsUtil uploadDoc fileName', fileName);
  // dt_folder = "dt=" + moment().subtract(1, 'days');
  // logger.log('dt folder',  dt_folder);
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: data,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.kmsid,   
    };
    // s3.putObject(params, (error, dat) => {
    s3.upload(params, function (error, dat) {
      if (error) {
        logger.log('awsUtil uploadDoc error', error);
        reject(error);
      } else {
        resolve();
        logger.log(`Successfully uploaded data to ${bucketName}/${fileName}`);
        // logger.log('dat', dat);
      }
    });
  });
};

 downloadDoc = (param) => {
  const executeParams = _.clone(param);
  executeParams.Bucket = bucketName;
  logger.log('downloadDoc');
  return new Promise((resolve, reject) => {
    s3.getObject(executeParams, (err, data) => {
      if (err) {
        if (reject) {
          reject();
        }
      } else if (resolve) {
        resolve(data);
      }
    });
  });
};
};

module.exports = s3;
