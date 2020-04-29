/**
 * @module controller/index
 */
import log4jUtil from '../utils/log4j.util';
import mongoose from 'mongoose';
const _ = require('lodash');
exports.api = {
  getDoc:async function(req,res,next){
    var errMessage = "";
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":docId}).catch(error=>
      {
        if(error){
          errMessage = error.message;
        }
      });
    console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  getDocById:async function(req,res,next){
    var errMessage = "";
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)}).catch(error=>
      {
        if(error){
          errMessage = error.message;
        }
      });
    console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  insertDoc:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  updateDoc:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  deleteDoc:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  getAttachtment:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  insertAttachtment:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  updateAttachtment:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  },
  deleteAttachtment:async function(req,res,next){
    const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    log4jUtil.log("docType = ",docType)
    log4jUtil.log("docId = ",docId)
    let result = await mongoose.connection.collection(docType).findOne({"_id":mongoose.Types.ObjectId(docId)});
    console.log("result = ",result);
    res.json({"success":true,result:result});
  }
};
