import mongoose from 'mongoose';
import log4jUtil from '../../utils/log4j.util';
const _ = require('lodash');
var DAO = require("../DAO");
class awsDAO extends DAO{
  constructor(){
    super();
  };
  async getDoc(docId){
    var result = "";
    var status = true;
    var docType = this.getColNameById(docId);
    if(docType && !_.isEmpty(docType)){
      // log4jUtil.log("111111",mongoose.connection.readyState)
      if(mongoose.connection.readyState===1){
        result = await mongoose.connection.collection(docType).findOne({"id":docId}).catch(error=>
        {
            if(error){
              status = false;
              result = error.message;
            }
        });
      }else{
        result = "No DB connection";
        status = false;
      }
    }
    // log4jUtil.log("result = ",result)
    return {success:status,result:result};
    }

};
module.exports = awsDAO;