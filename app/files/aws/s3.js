import AWS from 'aws-sdk';
import _ from 'lodash';
import config from '../../../config/config';
import s3Config from '../../../config/system.json';
const fileUtils = require("../fileUtils");
const logger = console;
const awsConf = s3Config.awsS3;
const masterBucket = awsConf.masterBucket ? awsConf.masterBucket : 'bucket-base';
const transBucket = awsConf.transBucket ? awsConf.transBucket : 'bucket-base';
// Create an S3 client
// const s3 = new AWS.S3();
// Add KMS, need region
// AWS.config.loadFromPath('app/files/aws/credentials');

const s3Object = new AWS.S3({signatureVersion:'v4',region:'ap-southeast-1'});
AWS.config.update({
  accessKeyId: awsConf.accessKeyId,
  secretAccessKey: awsConf.secretAccessKey,
  // host:"https://ease-master-data.s3-ap-southeast-1.amazonaws.com",
});

logger.log('awsConf.accessKeyId = ',awsConf.accessKeyId);
logger.log('awsConf.secretAccessKey = ',awsConf.secretAccessKey);
logger.log('awsConf.KmsID = ',awsConf.KmsID);
// Create a bucket and upload something into it
const bucketName = `${masterBucket}`;

class s3 extends fileUtils{
constructor(){
    super();
    };
async init(){
  this.setProxyEnv();
  await this.getCredentials().catch(error=>{logger.log("error",error);return false});
  return true;
}
getCredentials(){
  logger.log('awsUtil getCredentials');
  return new Promise((resolve, reject) => {

    AWS.config.getCredentials((err) => {
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

uploadBase64(fileName,data,fileType){
  logger.log('awsUtil uploadDoc bucketName', bucketName);
  logger.log('awsUtil uploadDoc fileName', fileName);
  // dt_folder = "dt=" + moment().subtract(1, 'days');
  // logger.log('dt folder',  dt_folder);
  const buf = new Buffer(data.replace(/^data:image\/\w+;base64,/, ""),'base64');

  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: buf,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: awsConf.KmsID,
      // ACL: "public-read-write", 
      ContentType: fileType //"image/jpeg"
    };
    // s3.putObject(params, (error, dat) => {
      s3Object.upload(params, function (error, dat) {
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
  // gothrough proxy
  setProxyEnv(){
    console.log("s3 setProxyEnv");
    const isProxy = _.get(s3Config,"awsS3.isProxy");
    console.log("isProxy =",isProxy);
    if(isProxy){
      const HttpProxyAgent = require('https-proxy-agent');
      const proxyAgent = new HttpProxyAgent(process.env.aws_https_proxy || process.env.AWS_HTTPS_PROXY);
      AWS.config.httpOptions = { agent: proxyAgent };
    }
  };

 downloadDoc(param){
  const executeParams = _.clone(param);
  executeParams.Bucket = bucketName;
  logger.log('downloadDoc');
  return new Promise((resolve, reject) => {
    s3Object.getObject(executeParams, (err, data) => {
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
