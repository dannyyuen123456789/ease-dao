/**
 * @module controller/index
 */
import mongoose from 'mongoose';
import log4jUtil from '../utils/log4j.util';
import DAO from '../database/DAO';
import fileUtils from '../files/fileUtils';

const _ = require('lodash');

exports.api = {
  async getDoc(req, res, next) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.getDoc(docId);
    // console.log("result = ",result.result);
    if (_.get(result, 'success')) {
      var resResult = result.result;
      res.json(result.result);
    } else {
      res.json({ error: 'not_found', reason: 'missing' });
    }
  },
  // async insertDoc(req, res, next) {
  //   const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
  //   const data = _.get(req.body, 'data', _.get(req.query, 'data'));
  //   const dao = new DAO('AWS');
  //   const awsDao = dao.getInstance();
  //   const result = await awsDao.insertDoc(docId, data);
  //   if (_.get(result, 'success')) {
  //     res.json({ ok: true });
  //   } else {
  //     res.json({ status: 400, result: result.result });
  //   }
  // },
  async updateDoc(req, res, next) {
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const data = req.body;
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();    
    const result = await awsDao.updateDoc(docId, data);
    if (_.get(result, 'success')) {
      res.json({id:docId,ok:true,"rev":1});
    } else {
      res.json({ error: 400, reason: result.result });
    }
  },
  async deleteDoc(req, res, next) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.deleteDoc(docId);
    // console.log("result = ",result);
    if (_.get(result, 'success')) {
      res.json({ id: docId, ok: true ,"rev":1});
    } else {
      res.json({ status: 400, result: result.result });
    }
  },
  async getAttachtment(req, res, next) {
    var errMessage = ""
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    
    
    const fileUtil = new fileUtils("AWS-S3");
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    if(initSuccess){
      await fileInstance.getAttachment(docId,attachmentId,(attachment)=>{
        // console.log("attachment|||",attachment);
        if(attachment)
          res.send(attachment);
      }).catch(error=>
        {
          if(error){
            log4jUtil.log('log', "error=",error.message);
            errMessage = error.message}
        });
       if(!errMessage || _.isEmpty(errMessage)) {
          
       }
    }else{
      errMessage = "initial S3 failed"
    }
    if(errMessage){
      log4jUtil.log('log', "--------getAttachtment failed---------");
      res.json({ ok: false,message:errMessage });
    }
  },
  async getAttachtmentUrl(req, res, next) {
    var errMessage = ""
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    
    
    const fileUtil = new fileUtils("AWS-S3");
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    if(initSuccess){
      await fileInstance.getAttachmentUrl(docId,attachmentId,(attachment)=>{
        res.json(attachment);
      }).catch(error=>
        {
          if(error){
            log4jUtil.log('log', "error=",error.message);
            errMessage = error.message}
        });
       if(!errMessage || _.isEmpty(errMessage)) {
          
       }
    }else{
      errMessage = "initial S3 failed"
    }
    if(errMessage){
      log4jUtil.log('log', "--------getAttachtment failed---------");
      res.json({ ok: false,message:errMessage });
    }
  },
  async uploadAttachmentByBase64(req, res, next) {
    var errMessage = ""
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    
    const attachment = req.body.data;
    const mime = req.body.mime;
    const fileUtil = new fileUtils("AWS-S3");
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    const fileName = fileInstance.getFileKeyById(docId,attachmentId);
    if(initSuccess){
      log4jUtil.log('log', "uploading ...");
      await fileInstance.uploadBase64(docId,attachmentId,attachment,mime).catch(error=>
        {
          if(error){
            log4jUtil.log('log', "error=",error.message);
            errMessage = error.message}
        });
       if(!errMessage || _.isEmpty(errMessage)) {
        const dao = new DAO('AWS');
        const awsDao = dao.getInstance();
        const fileSize = fileInstance.calBase64FileSize(attachment);
        // var pushData = _.set({},_.join(["attachments",attachmentId],"."),{key:fileName,contentType:mime,fileSize:fileSize})
        const docResult = await awsDao.getDoc(docId);
        // console.log("docResult = ",docResult);
        if(_.get(docResult,"success")){
          var doc = _.get(docResult,"result");
          var docAttachment = _.get(doc,"attachments",{});
          _.set(docAttachment,attachmentId,{key:fileName,content_type:mime,fileSize:fileSize});
          const updResult = await awsDao.updateDoc(docId,{attachments:docAttachment});
          if(!_.get(updResult,"success")){
            errMessage = _.get(updResult,"result");
          }          
        }else{
          errMessage = _.get(docResult,"result");
        }
       }
    }else{
      errMessage = "initial S3 failed"
    }
    if(errMessage){
      log4jUtil.log('log', "--------upload failed---------");
      // res.json({ ok: false,message:errMessage });
      res.json({ error: false,reason:errMessage });
    }else{
      log4jUtil.log('log', "--------upload success---------");
      // res.setHeader('Content-Type','application/json')
      res.json({
        "id": `${docId}`,
        "ok": true,
        "rev": "1"
      });
    }
  },
  // async uploadAttachment(req, res, next) {
  //   const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
  //   const attchId = _.get(req.params, 'attchId', _.get(req.query, 'attchId'));
  //   fileUtils.uploadAttachment();
  //   console.log('result = ', result);
  //   res.json({ success: true, result });
  // },
  async delAttachment(req, res, next) {
    var errMessage = ""
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    
    const attachment = req.body.data;
    const mime = req.body.mime;
    const fileUtil = new fileUtils("AWS-S3");
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    const fileName = fileInstance.getFileKeyById(docId,attachmentId);
    if(initSuccess){
      log4jUtil.log('log', "deleting ...");
      await fileInstance.deleteObject(docId,attachmentId).catch(error=>
        {
          if(error){
            log4jUtil.log('log', "error=",error.message);
            errMessage = error.message}
        });
       if(!errMessage || _.isEmpty(errMessage)) {
        const dao = new DAO('AWS');
        const awsDao = dao.getInstance();
        const docResult = await awsDao.getDoc(docId);
        // console.log("docResult = ",docResult);
        if(_.get(docResult,"success")){
          var doc = _.get(docResult,"result");
          var docAttachment = _.get(doc,"attachments",{});
          _.unset(docAttachment,attachmentId);
          const updResult = await awsDao.updateDoc(docId,{attachments:docAttachment});
          if(!_.get(updResult,"success")){
            errMessage = _.get(updResult,"result");
          }          
        }else{
          errMessage = _.get(docResult,"result");
        }

       }
    }else{
      errMessage = "initial S3 failed"
    }
    if(errMessage){
      log4jUtil.log('log', "--------delete failed---------");
      res.json({ ok: false,message:errMessage });
    }else{
      log4jUtil.log('log', "--------delete success---------");
      res.json({id:docId, ok: true});
    }
  },
};
