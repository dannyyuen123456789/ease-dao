/**
 * @module controller/index
 */
import log4jUtil from '../utils/log4j.util';
import mongoose from 'mongoose';
import DAO from '../database/DAO';
const _ = require('lodash');
exports.api = {
  getDoc:async function(req,res,next){
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    var dao = new DAO("AWS");
    var awsDao = dao.getInstance();
    var result = await awsDao.getDoc(docId);
    // console.log("result = ",result);
    if(_.get(result,"success")){
      res.json({status:200,result:result.result});
    }else{
      res.json({status:400,result:result.result});
    }
  },
  insertDoc:async function(req,res,next){
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    const data =  _.get(req.body,"data",_.get(req.query,"data"));
    var dao = new DAO("AWS");
    var awsDao = dao.getInstance();
    var result = await awsDao.insertDoc(docId,data);
    if(_.get(result,"success")){
      res.json({status:200,result:result.result});
    }else{
      res.json({status:400,result:result.result});
    }
  },
  updateDoc:async function(req,res,next){
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    const data =  _.get(req.body,"data",_.get(req.query,"data"));
    console.log("result = "+_.get(data,"role"));
    var dao = new DAO("AWS");
    var awsDao = dao.getInstance();
    var result = await awsDao.updateDoc(docId,data);
    // console.log("result = ",result);
    if(_.get(result,"success")){
      res.json({status:200,result:result.result});
    }else{
      res.json({status:400,result:result.result});
    }
  },
  deleteDoc:async function(req,res,next){
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    var dao = new DAO("AWS");
    var awsDao = dao.getInstance();
    var result = await awsDao.deleteDoc(docId);
    // console.log("result = ",result);
    if(_.get(result,"success")){
      res.json({status:200,result:result.result});
    }else{
      res.json({status:400,result:result.result});
    }
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
