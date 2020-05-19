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
      res.json(result.result);
    } else {
      res.json({ error: 'not_found', reason: 'missing' });
    }
  },
  async insertDoc(req, res, next) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const data = _.get(req.body, 'data', _.get(req.query, 'data'));
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.insertDoc(docId, data);
    if (_.get(result, 'success')) {
      res.json({ ok: true });
    } else {
      res.json({ status: 400, result: result.result });
    }
  },
  async updateDoc(req, res, next) {
    // const docType = _.get(req.params,"docType",_.get(req.query,"docType"));
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const data = req.body;
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.updateDoc(docId, data);
    if (_.get(result, 'success')) {
      res.json({ id: docId, ok: true });
    } else {
      res.json({ status: 400, result: result.result });
    }
  },
  async deleteDoc(req, res, next) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.deleteDoc(docId);
    // console.log("result = ",result);
    if (_.get(result, 'success')) {
      res.json({ id: docId, ok: true });
    } else {
      res.json({ status: 400, result: result.result });
    }
  },
  async getAttachtment(req, res, next) {
    const docType = _.get(req.params, 'docType', _.get(req.query, 'docType'));
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    log4jUtil.log('docType = ', docType);
    log4jUtil.log('docId = ', docId);
    const result = await mongoose.connection.collection(docType).findOne({ _id: mongoose.Types.ObjectId(docId) });
    console.log('result = ', result);
    res.json({ success: true, result });
  },
  async uploadAttachmentByBase64(req, res, next) {
    var errMessage = ""
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    const fileName = _.join([docId,attachmentId],"-");
    const attachment = req.body.data;
    const mime = req.body.mime;
    const fileUtil = new fileUtils("AWS-S3");
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    if(initSuccess){
      log4jUtil.log('log', "uploading ...");
      await fileInstance.uploadBase64(fileName,attachment,mime).catch(error=>
        {
          if(error){
            log4jUtil.log('log', "error=",error.message);
            errMessage = error.message}
        });
       if(!errMessage || _.isEmpty(errMessage)) {
        const dao = new DAO('AWS');
        const awsDao = dao.getInstance();
        var pushData = {attachments:{name:attachmentId,key:fileName,contentType:mime,fileSize:22222}};
        let pushResult = await awsDao.updateDocPushData(docId,pushData);
        if(!_.get(pushResult,"success")){
          errMessage = pushResult.result;
        }

       }
    }else{
      errMessage = "initial S3 failed"
    }

    // log4jUtil.log('attachment = ', `attachment = ${attachment}`);
    // log4jUtil.log('rsHeader = ', `docId = ${docId}`);
    // log4jUtil.log('reqHeader = ', `attachmentId = ${attachmentId}`);
    if(errMessage){
      log4jUtil.log('log', "--------upload failed---------");
      res.json({ ok: false,message:errMessage });
    }else{
      log4jUtil.log('log', "--------upload success---------");
      res.json({ ok: true,message: "upload success!"});
    }
  },
  async uploadAttachment(req, res, next) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attchId = _.get(req.params, 'attchId', _.get(req.query, 'attchId'));
    fileUtils.uploadAttachment();
    console.log('result = ', result);
    res.json({ success: true, result });
  },
  async delAttachment(req, res, next) {
    const docType = _.get(req.params, 'docType', _.get(req.query, 'docType'));
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    log4jUtil.log('docType = ', docType);
    log4jUtil.log('docId = ', docId);
    const result = await mongoose.connection.collection(docType).findOne({ _id: mongoose.Types.ObjectId(docId) });
    console.log('result = ', result);
    res.json({ success: true, result });
  },
};
