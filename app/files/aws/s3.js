import AWS from 'aws-sdk';
import _ from 'lodash';
import s3Config from '../../../config/config';
const fileUtils = require("../fileUtils");
const logger = console;
const awsConf = s3Config.awsS3;
const masterBucket = awsConf.masterBucket ? awsConf.masterBucket : 'bucket-base';
const transBucket = awsConf.transBucket ? awsConf.transBucket : 'bucket-base';
// Create an S3 client
// const s3 = new AWS.S3();
// Add KMS, need region
// AWS.config.loadFromPath('app/files/aws/credentials');

const s3Object = new AWS.S3({
signatureVersion:awsConf.signatureVersion,
region:awsConf.region,
accessKeyId: awsConf.accessKeyId,
secretAccessKey: awsConf.secretAccessKey,
});
// AWS.config.update({
//   accessKeyId: awsConf.accessKeyId,
//   secretAccessKey: awsConf.secretAccessKey,
// });

// logger.log('awsConf.accessKeyId = ',awsConf.accessKeyId);
// logger.log('awsConf.secretAccessKey = ',awsConf.secretAccessKey);
// logger.log('awsConf.KmsID = ',awsConf.KmsID);
// Create a bucket and upload something into it


class s3 extends fileUtils{
constructor(){
    super();
    };
async init(){
  this.setProxyEnv();
  // await this.getCredentials().catch(error=>{logger.log("error",error);return false});
  return true;
}
// gothrough proxy
  setProxyEnv(){
    const isProxy = _.get(s3Config,"awsS3.isProxy");
    console.log("isProxy =",isProxy);
    if(isProxy){
      const HttpProxyAgent = require('https-proxy-agent');
      const proxyAgent = new HttpProxyAgent(process.env.aws_https_proxy || process.env.AWS_HTTPS_PROXY);
      AWS.config.httpOptions = { agent: proxyAgent };
    }
  };
getCredentials(){
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
};

uploadBase64(docId,attachmentType,data,fileType){

  return new Promise((resolve, reject) => {
    const buf = new Buffer(data.replace(/^data:image\/\w+;base64,/, ""),'base64');
    const fileKey = this.getFileKeyById(docId,attachmentType);
    const bucketName = this.getBucketNameById(docId);  
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: buf,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: awsConf.KmsID,
      ContentType: fileType //"image/jpeg"
    };
      s3Object.upload(params, function (error, dat) {
      if (error) {
        reject(error);
      } else {
        resolve();
        logger.log(`Successfully uploaded data to ${bucketName}/${fileKey}`);
      }
    });
  });
};
deleteObject(docId,attachmentType){

  return new Promise((resolve, reject) => {
    // const buf = new Buffer(data.replace(/^data:image\/\w+;base64,/, ""),'base64');
    const fileKey = this.getFileKeyById(docId,attachmentType);
    const bucketName = this.getBucketNameById(docId);
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      // ServerSideEncryption: 'aws:kms',
      // SSEKMSKeyId: awsConf.KmsID
    };
      s3Object.deleteObject(params, function (error, dat) {
      if (error) {
        reject(error);
      } else {
        resolve();
        logger.log(`Successfully delete ${bucketName}/${fileKey}`);
      }
    });
  });
};
async getAttachment(docId,attachmentType,cb){  
  return new Promise((resolve, reject) => {
  const bucketName = this.getBucketNameById(docId);
  const signedUrlExpireSeconds = 60 * 5
  const fileKey = this.getFileKeyById(docId,attachmentType);
  const executeParams = {
    Bucket:bucketName,
    Key:fileKey,
  };
  // const s3 = new AWS.S3({
  //   signatureVersion:'v4',
  //   region:'ap-southeast-1',
  //   accessKeyId: awsConf.accessKeyId,
  //   secretAccessKey: awsConf.secretAccessKey,
  //   });
  logger.log('getAttachment executeParams= ',executeParams);
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
};
async getAttachmentUrl(docId,attachmentType,cb){  
  return new Promise((resolve, reject) => {
  const bucketName = this.getBucketNameById(docId);
  const signedUrlExpireSeconds = 60 * 5
  const fileKey = this.getFileKeyById(docId,attachmentType);
  // fileKey = fileKey + ".jpg";
  const executeParams = {
    Bucket:bucketName,
    Key:fileKey,    
    Expires: signedUrlExpireSeconds,    
  };
  // const s3 = new AWS.S3({
  //   signatureVersion:awsConf.signatureVersion,
  //   region:awsConf.region,
  //   accessKeyId: awsConf.accessKeyId,
  //   secretAccessKey: awsConf.secretAccessKey,
  //   });
  logger.log('getAttachmentUrl executeParams= ',executeParams);
  const url = s3Object.getSignedUrl('getObject', executeParams);
  if(url){
    cb(url);
  }
  });
};
};


module.exports = s3;
