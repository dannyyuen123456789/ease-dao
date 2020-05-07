import mongoose from 'mongoose';
import collectionMapping from '../../config/collectionMapping';
const _ = require('lodash');
// const getColNameById = (docId)=>{
//   var colName = "";
//   var idPrefix = docId.substr(0,2);
//   colName = _.find(collectionMapping,{idPrefix:idPrefix});
//   if(colName){
//     colName = _.get(colName,"colName");
//   }
//   return colName;
// };

const getColNameById = (docId) => {
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

module.exports.getDoc = async(docId)=>{
var docType = getColNameById(docId);
var errMessage = "";
log4jUtil.log("getDoc --> docType = ",docType)
log4jUtil.log("getDoc --> docId = ",docId)
if(docType && !_.isEmpty(docType)){
    var result = await mongoose.connection.collection(docType).findOne({"id":docId}).catch(error=>
    {
        if(error){
        errMessage = error.message;
        }
    });
}
if(errMessage && _.isEmpty(errMessage)){
    return {"success":false,message:errMessage}
}else{
    return {"success":true,message:result}
}
}