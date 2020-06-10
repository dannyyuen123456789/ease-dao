/* eslint-disable new-cap */
/**
 * @module controller/index
 */
import printLogWithTime from '../utils/log';
import DAO from '../database/DAO';
import fileUtils from '../files/fileUtils';

const _ = require('lodash');

exports.api = {

  // Get Json Document
  async getDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    printLogWithTime('');
    printLogWithTime(`getDoc/${docId}`);
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.getDoc(docId);

    if (_.get(result, 'success')) {
      const resResult = result.result;

      if (resResult) {
        printLogWithTime(`Result - Success - ${docId}`);
        res.json(result.result);
      } else {
        printLogWithTime(`Result - Missing - ${docId}`);
        res.json({ error: 'not_found', reason: 'missing' });
      }
    } else {
      printLogWithTime(`Error - ${result.result}`);
      res.json({ error: 'error', reason: result.result });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Insert or update Json Document
  async updateDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    printLogWithTime('');
    printLogWithTime(`updateDoc/${docId}`);
    const data = req.body;
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.updateDoc(docId, data);

    if (_.get(result, 'success')) {
      printLogWithTime(`Result - Success - ${docId}`);
      res.json({ id: docId, ok: true, rev: 1 });
    } else {
      printLogWithTime(`Error - ${docId} - ${result.result}`);
      res.json({ error: 400, reason: result.result });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Delete Json Document
  async deleteDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    printLogWithTime('');
    printLogWithTime(`deleteDoc/${docId}`);
    const dao = new DAO('AWS');
    const awsDao = dao.getInstance();
    const result = await awsDao.deleteDoc(docId);

    if (_.get(result, 'success')) {
      printLogWithTime(`Result - Success - ${docId}`);
      res.json({ id: docId, ok: true, rev: 1 });
    } else {
      printLogWithTime(`Error - ${docId} - ${result.result}`);
      res.json({ status: 400, result: result.result });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Get Attachment
  async getAttachment(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    printLogWithTime('');
    printLogWithTime(`getAttachment/${docId}/${attachmentId}`);
    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();

    if (initSuccess) {
      await fileInstance.getAttachment(docId, attachmentId, (attachment) => {
        if (attachment) {
          printLogWithTime(`Result - Success - ${docId}`);
          res.send(attachment);

          printLogWithTime('----------------------------------------------------------------------');
        }
      }).catch((error) => {
        if (error) {
          printLogWithTime(`Error 1 - ${docId} - ${error.message}`);
          errMessage = error.message;
        }
      });

      if (!errMessage || _.isEmpty(errMessage)) {
        // TODO
      }
    } else {
      errMessage = 'initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Error 2 - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Get Attachment URL
  async getAttachmentUrl(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    printLogWithTime('');
    printLogWithTime(`getAttachmentUrl/${docId}/${attachmentId}`);
    // eslint-disable-next-line new-cap
    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    if (initSuccess) {
      await fileInstance.getAttachmentUrl(docId, attachmentId, (attachment) => {
        printLogWithTime('----------------------------------------------------------------------');
        res.json(attachment);
      }).catch((error) => {
        if (error) {
          printLogWithTime(`Error 1 - ${error.message}`);
          errMessage = error.message;
        }
      });

      if (!errMessage || _.isEmpty(errMessage)) {
        // TODO
      }
    } else {
      errMessage = 'initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Error 2 - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    }

    
  },
  async uploadAttachmentByBase64(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    printLogWithTime('');
    printLogWithTime(`uploadAttachmentByBase64/${docId}/${attachmentId}`);
    const attachment = req.body.data;
    const { mime } = req.body;
    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();
    const fileName = fileInstance.getFileKeyById(docId, attachmentId);

    if (initSuccess) {
      printLogWithTime('Uploading...');

      await fileInstance.uploadBase64(docId, attachmentId, attachment, mime).catch((error) => {
        if (error) {
          printLogWithTime(`Error 1 - ${error.message}`);
          errMessage = error.message;
        }
      });

      if (!errMessage || _.isEmpty(errMessage)) {
        const dao = new DAO('AWS');
        const awsDao = dao.getInstance();
        const fileSize = fileInstance.calBase64FileSize(attachment);
        const docResult = await awsDao.getDoc(docId);
        if (_.get(docResult, 'success')) {
          const doc = _.get(docResult, 'result');
          const docAttachment = _.get(doc, 'attachments', {});
          _.set(docAttachment, attachmentId, { key: fileName, content_type: mime, fileSize });
          const updResult = await awsDao.updateDoc(docId, { attachments: docAttachment });
          if (!_.get(updResult, 'success')) {
            errMessage = _.get(updResult, 'result');
          }
        } else {
          errMessage = _.get(docResult, 'result');
        }
      }
    } else {
      errMessage = 'initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Error 2 - ${docId} - ${errMessage}`);
      res.json({ error: false, reason: errMessage });
    } else {
      printLogWithTime(`Result - Success - ${docId}`);

      res.json({
        id: `${docId}`,
        ok: true,
        rev: '1',
      });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Delete Attachment
  async delAttachment(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));
    printLogWithTime('');
    printLogWithTime(`delAttachment/${docId}/${attachmentId}`);
    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();

    if (initSuccess) {
      await fileInstance.deleteObject(docId, attachmentId).catch((error) => {
        if (error) {
          printLogWithTime(`Error 1 - ${error.message}`);
          errMessage = error.message;
        }
      });

      if (!errMessage || _.isEmpty(errMessage)) {
        const dao = new DAO('AWS');
        const awsDao = dao.getInstance();
        const docResult = await awsDao.getDoc(docId);

        if (_.get(docResult, 'success')) {
          const doc = _.get(docResult, 'result');
          const docAttachment = _.get(doc, 'attachments', {});
          _.unset(docAttachment, attachmentId);
          const updResult = await awsDao.updateDoc(docId, { attachments: docAttachment });

          if (!_.get(updResult, 'success')) {
            errMessage = _.get(updResult, 'result');
          }
        } else {
          errMessage = _.get(docResult, 'result');
        }
      }
    } else {
      errMessage = 'initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Error 2 - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    } else {
      printLogWithTime(`Attachment delete success - ${docId}/${attachmentId}`);
      res.json({ id: docId, ok: true, rev: 1 });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },
};
