import log4jUtil from '../utils/log4j.util';
const util = require('util');
const _ = require('lodash');
const DAO = require('../database/DAO');
const config = require('../../config/config');
import printLogWithTime from '../utils/log';
class fileUtils {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    };
    getInstance(){
        var dao = "";
        if(_.eq(this.fileSystem,"AWS-S3")){
            var aws = require("./aws/s3") ;
            dao = new aws();
        }
        return dao;
    };
    // gothrough proxy
    setProxyEnv(){
    const HttpProxyAgent = require('https-proxy-agent');
    const proxyAgent = new HttpProxyAgent(config.awsS3.proxyLink);
    return proxyAgent;
    // AWS.config.httpOptions = { agent: proxyAgent };
  };
  calBase64FileSize(inBase64){
    var base64 = _.replace(inBase64,"=","");
    base64 = _.replace(base64,/^data:image\/\w+;base64,/, "")
    var strLength = _.size(base64);
    var fileSize = strLength-(strLength/8)*2;
    return fileSize;
  };
  getBucketNameById(docId) {
    let bucket = config.awsS3.transBucket;
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
  }else if (_.endsWith(docId,"-seq") || _.eq(docId,"agentNumberMap")) {
  }
  else {
    bucket = config.awsS3.masterBucket;
  }
  const dao1 = new DAO();
  const awsDao = dao1.getInstance();
  const subFolder = awsDao.getCollectionNameById(docId);
  if(_.eq(subFolder,"masterData")){
    if(!_.eq(process.env.NODE_ENV,"production")){
      bucket = bucket + "-" + process.env.NODE_ENV;
    }
  }
  else{
    bucket = bucket + "/" + awsDao.getCollectionNameById(docId);
  }
  // log4jUtil.log("info",`docId = ${docId} || bucket = ${bucket}`);
  printLogWithTime(`docId = ${docId} || bucket = ${bucket}`);
   return bucket;
};
getFileKeyById(docId,attachent) {
    const fileKey = _.join([docId,attachent],"-");
    return fileKey;
}
  
};


module.exports = fileUtils;