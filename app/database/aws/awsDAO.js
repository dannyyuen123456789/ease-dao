import mongoose from 'mongoose';
import collectionMapping from '../../config/collectionMapping';
const _ = require('lodash');
const getColNameById = (docId)=>{
  var colName = "";
  var idPrefix = docId.substr(0,2);
  colName = _.find(collectionMapping,{idPrefix:idPrefix});
  if(colName){
    colName = _.get(colName,"colName");
  }
  return colName;
};

module.exports.getDoc = async(docId)=>{
var docType = getColNameById(docId);
var errMessage = "";
log4jUtil.log("getDoc --> docType = ",docType)
log4jUtil.log("getDoc --> docId = ",docId)
if(docType && !_.isEmpty(docType)){
    var result = await mongoose.connection.collection(docType).findOne({"_id":docId}).catch(error=>
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