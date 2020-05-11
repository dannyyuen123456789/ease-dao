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
    };
    async insertDoc(docId,data){
      var result = "";
      var status = true;
      var docType = this.getColNameById(docId);
      if(docType && !_.isEmpty(docType)){
        if(mongoose.connection.readyState===1){
          _.set(data,docId);
          await mongoose.connection.collection(docType).insertOne(data).then(r=>{
            result = r.result;
          }).catch(error=>
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
    };
    async updateDoc(docId,data){
      var result = "";
      var status = true;
      var docType = this.getColNameById(docId);
      if(docType && !_.isEmpty(docType)){
        // log4jUtil.log("111111",mongoose.connection.readyState)
        if(mongoose.connection.readyState===1){
          // _.set(data,docId);
          await mongoose.connection.collection(docType).updateOne({"_id":docId},{"$push":{"role" : "BBB",}},{ "upsert":true}).then(r=>{
            result = r.result;
          }).catch(error=>
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
    };
    async deleteDoc(docId){
      var result = "";
      var status = true;
      var docType = this.getColNameById(docId);
      if(docType && !_.isEmpty(docType)){
        // log4jUtil.log("111111",mongoose.connection.readyState)
        if(mongoose.connection.readyState===1){
          await mongoose.connection.collection(docType).deleteOne({"_id":docId}).then(r=>{
            result = r.result;
          }).catch(error=>
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
    };
    async getAttachtment(req,res,next){
      const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
      const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
      log4jUtil.log("docType = ",docType)
      log4jUtil.log("docId = ",docId)
      let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
      console.log("result = ",result);
      res.json({"success":true,result:result});
    };
    async insertAttachtment(req,res,next){
      const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
      const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
      log4jUtil.log("docType = ",docType)
      log4jUtil.log("docId = ",docId)
      let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
      console.log("result = ",result);
      res.json({"success":true,result:result});
    };
    async updateAttachtment(req,res,next){
      const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
      const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
      log4jUtil.log("docType = ",docType)
      log4jUtil.log("docId = ",docId)
      let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
      console.log("result = ",result);
      res.json({"success":true,result:result});
    };
    async deleteAttachtment(req,res,next){
      const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
      const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
      log4jUtil.log("docType = ",docType)
      log4jUtil.log("docId = ",docId)
      let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
      console.log("result = ",result);
      res.json({"success":true,result:result});
    }

};
module.exports = awsDAO;