import log4jUtil from '../utils/log4j.util';
const util = require('util');
const _ = require('lodash');
class DAO {
    constructor(dbType) {
        this.dbType = dbType;       
    };
    getInstance(){
        var dao = "";
        if(_.eq(this.dbType,"AWS")){
            var aws = require("./aws/awsDAO") ;
            dao = new aws();
        }
        return dao;
    }
    getColNameById(docId) {
        let type = '';
      if (docId.substring(0, 2) === '10' || docId.substring(0, 2) === '30') {
        type = 'policy';
      } else if (docId.substring(0, 2) === 'CP') {
        type = 'client';
      } else if (docId.substring(0, 2) === 'FN') {
        type = 'FN';
      } else if (docId.substring(0, 2) === 'NB') {
        type = 'application';
      } else if (docId.substring(0, 2) === 'QU') {
        type = 'quotation';
      } else if (docId.substring(0, 2) === 'SA') {
        type = 'masterApplication';
      } else if (docId.substring(0, 2) === 'SP') {
        type = 'masterApproval';
      } else if (docId.substring(0, 2) === 'U_') {
        type = 'agent';
      } else if (docId.substring(0, 3) === 'UX_') {
        type = 'agentUX';
      } else if (docId.substring(0, 6) === 'appid-') {
        type = 'appid';
      } else if (docId.substring(0, 4) === 'AUD-') {
        type = 'aud';
      } else if (docId.length === 52 || docId.length === 50) {
        type = 'dataSyncTransactionLog';
      } else {
        type = 'masterData';
      }
      return type;
    };
};


module.exports = DAO;