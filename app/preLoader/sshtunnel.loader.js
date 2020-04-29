import systemConfig from '../../config/system';
// var MongoClient = require('mongodb').MongoClient;
var fs = require("fs");
const _ = require('lodash');
var mongoose = require('mongoose');
var tunnel = require('tunnel-ssh');

const initSshTunnel = async ()=>{
const sshConfigs = _.get(systemConfig,"sshConfig");
const sshConnection =  _.get(systemConfig,"sshConnection");
const dbInUse =  _.get(systemConfig,"dbInUse");
const dbSetting = _.get(systemConfig,"dbSetting");

var userName = _.get(dbSetting,_.join([dbInUse,"databaseUsername"],"."));
var pwd = _.get(dbSetting,_.join([dbInUse,"databasePassword"],"."));
var url = _.get(dbSetting,_.join([dbInUse,"databaseURL"],"."));
var databaseName = _.get(dbSetting,_.join([dbInUse,"databaseName"],"."));
// var ssh = _.get(dbSetting,_.join([dbInUse,"ssh"],"."));
var dbType = _.get(dbSetting,_.join([dbInUse,"dbType"],"."));
var DB_URL = `mongodb://${userName}:${pwd}@${url}/${databaseName}`;
//===== db connection =====
if(sshConnection){
    if(sshConfigs){
        var config = {
            keepAlive: true,
            username:_.get(sshConfigs,"sshUserName"),
            host:_.get(sshConfigs,"sshHost"),
            agent : process.env.SSH_AUTH_SOCK,
            privateKey:fs.readFileSync(_.get(sshConfigs,"sshPrivateKeyFile")),
            port:_.get(sshConfigs,"sshPort"),
            dstHost:_.get(sshConfigs,"sshDstHost"),
            dstPort:_.get(sshConfigs,"sshDstPort"),
            localHost:_.get(sshConfigs,"sshLocalHost"),
            localPort:_.get(sshConfigs,"sshLocalPort"),
        };


        tunnel(config, async function (error, server) {
        console.log("SSH connecting ....... ");
            if(error){
                console.log("SSH connection error: " + error);
            }
            if(server){
                console.log("SSH connected ....... ");
            }            
            // console.log("Mongo Db loading ----",DB_URL);
            if(_.eq(dbType,"mongo")){
                mongoose.connect(DB_URL, {
                    ssl:true,
                    sslValidate: false,
                    useNewUrlParser: true,
                    sslCA:fs.readFileSync("D:\\amazon\\rds-combined-ca-bundle.pem"),
                    useUnifiedTopology: true
                }).then(result=>{
                    if(result)
                        console.log("Mongo Db init success ----",DB_URL);
                }).catch(error=>{
                    if(error)
                        console.log("Mongo Db init failed ----",DB_URL);
                        console.log("Mongo Db init failed ----",error.message);
                });
            }   
        });
    }
}else{
    if(_.eq(dbType,"mongo")){
        mongoose.connect(DB_URL, {
            // ssl:true,
            // sslValidate: false,
            useNewUrlParser: true,
            // sslCA:fs.readFileSync("D:\\amazon\\rds-combined-ca-bundle.pem"),
            useUnifiedTopology: true
        }).then(result=>{
            if(result)
                console.log("Mongo Db init success ----",DB_URL);
        }).catch(error=>{
            if(error)
                console.log("Mongo Db init failed ----",DB_URL);
                console.log("Mongo Db init failed ----",error.message);
        });
    }
}
};
const loadSshtunnelMiddleWare = async() => {
    await initSshTunnel();
    // await test();
  };

//   const  loadSshtunnelMiddleWare =() => new Promise((resolve,reject) =>{
//     resolve(initSshTunnel());
//   });
export default loadSshtunnelMiddleWare;