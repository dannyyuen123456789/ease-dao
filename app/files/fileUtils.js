import log4jUtil from '../utils/log4j.util';
const util = require('util');
const _ = require('lodash');
const config = require("../../config/config")
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
    console.log("fileUtils setProxyEnv");
    const HttpProxyAgent = require('https-proxy-agent');
    const proxyAgent = new HttpProxyAgent(process.env.aws_https_proxy || process.env.AWS_HTTPS_PROXY);
    return proxyAgent;
    // AWS.config.httpOptions = { agent: proxyAgent };
  };
  calBase64FileSize(inBase64){
    var base64 = _.replace(inBase64,"=","");
    base64 = _.replace(base64,/^data:image\/\w+;base64,/, "")
    var strLength = _.size(base64);
    var fileSize = strLength-(strLength/8)*2;
    return fileSize;
  }
  
};


module.exports = fileUtils;