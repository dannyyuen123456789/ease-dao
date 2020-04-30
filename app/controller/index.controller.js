/**
 * @module controller/index
 */
import log4jUtil from '../utils/log4j.util';
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
exports.api = {
  getDoc:async function(req,res,next){
    var errMessage = "";
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    var docType = getColNameById(docId);
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
    // console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  getDocById:async function(req,res,next){
    var errMessage = "";
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    var docType = getColNameById(docId);
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
    // console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  insertDoc:async function(req,res,next){
    var errMessage = "";
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    const data =  _.get(req.body,"data",_.get(req.query,"data"));
    var docType = getColNameById(docId);
    log4jUtil.log("getDoc --> docType = ",docType)
    log4jUtil.log("getDoc --> docId = ",docId)
    if(docType && !_.isEmpty(docType)){
      var result = await mongoose.connection.collection(docType).insertOne(data).catch(error=>
        {
          if(error){
            errMessage = error.message;
          }
        });
    }
    // console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  updateDoc:async function(req,res,next){
    var errMessage = "";
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    const data =  _.get(req.body,"data",_.get(req.query,"data"));
    var docType = getColNameById(docId);
    log4jUtil.log("getDoc --> docType = ",docType)
    log4jUtil.log("getDoc --> docId = ",docId)
    log4jUtil.log("getDoc --> data = ",data)
    if(docType && !_.isEmpty(docType)){
      var result = await mongoose.connection.collection(docType).updateOne({"_id":docId},true,data).catch(error=>
        {
          if(error){
            errMessage = error.message;
          }
        });
    }
    // console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
    }
  },
  deleteDoc:async function(req,res,next){
    var errMessage = "";
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params,"docId",_.get(req.query,"docId"));
    var docType = getColNameById(docId);
    log4jUtil.log("getDoc --> docType = ",docType)
    log4jUtil.log("getDoc --> docId = ",docId)
    if(docType && !_.isEmpty(docType)){
      var result = await mongoose.connection.collection(docType).deleteOne({"_id":docId}).catch(error=>
        {
          if(error){
            errMessage = error.message;
          }
        });
    }
    // console.log("result = ",result);
    if(errMessage){
      res.json({"status":400,message:errMessage});
    }else{
      res.json({"status":200,result:result});
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
