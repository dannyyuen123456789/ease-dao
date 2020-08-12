/* eslint-disable new-cap */
/**
 * @module controller/index
 */
import printLogWithTime from '../utils/log';
import DAO from '../database/DAO';
import fileUtils from '../files/fileUtils';
import systemConfig from '../../config/config.json';

const request = require('request');

const _ = require('lodash');

exports.api = {

  // Get Json Document
  async getDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
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
        printLogWithTime(`Result - FAILED - ${docId} - Document Not Found`);
        res.json({ error: 'not_found', reason: 'missing' });
      }
    } else {
      printLogWithTime(`Result - FAILED - ${result.result}`);
      res.json({ error: 'error', reason: result.result });
    }
    printLogWithTime('----------------------------------------------------------------------');
  },

  // Insert or update Json Document
  async updateDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    printLogWithTime(`updateDoc/${docId}`);
    const options = {
      url: `${systemConfig.writeData.path}:${systemConfig.writeData.port}/${systemConfig.writeData.name}/updateDoc/${docId}`, // ,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify(req.body),
    };
    request.put(options, (error, response, body) => {
      if (error) {
        printLogWithTime(error);
        res.json({ status: 400, error });
      } else {
        res.json(JSON.parse(body));
      }
    });
    printLogWithTime('----------------------------------------------------------------------');
  },

  // Delete Json Document
  async deleteDoc(req, res) {
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    printLogWithTime(`deleteDoc/${docId}`);

    const url = `${systemConfig.writeData.path}:${systemConfig.writeData.port}/${systemConfig.writeData.name}/deleteDoc/${docId}`;

    request.delete(url, (error, response, body) => {
      if (error) {
        printLogWithTime(error);
        res.json({ status: 400, error });
      } else {
        res.json(JSON.parse(body));
      }
    });

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Get Attachment
  async getAttachment(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));

    printLogWithTime(`getAttachment/${docId}/${attachmentId}`);

    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();

    if (initSuccess) {
      await fileInstance.getAttachment(docId, attachmentId, (attachment) => {
        printLogWithTime(`Result - Success - ${docId}`);
        res.send(attachment);
      }).catch((error) => {
        if (error) {
          errMessage = error;
        }
      });
    } else {
      errMessage = 'Initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Result - Failed - ${docId} - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Get Attachment URL
  async getAttachmentUrl(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));

    printLogWithTime(`getAttachmentUrl/${docId}/${attachmentId}`);

    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();

    if (initSuccess) {
      await fileInstance.getAttachmentUrl(docId, attachmentId, (attachment) => {
        printLogWithTime(`Result - Success - ${docId}`);
        res.json(attachment);
        printLogWithTime('----------------------------------------------------------------------');
      }).catch((error) => {
        if (error) {
          errMessage = error;
        }
      });
    } else {
      errMessage = 'Initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Result Failed -  ${docId} - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },

  // Upload Attachment by base64
  async uploadAttachmentByBase64(req, res) {
    let errMessage = '';
    const docId = _.get(req.params, 'docId', _.get(req.query, 'docId'));
    const attachmentId = _.get(req.params, 'attachment', _.get(req.query, 'attachment'));

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
          errMessage = error;
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
          // const updResult = await awsDao.updateDoc(docId, { attachments: docAttachment });
          printLogWithTime(`updateDoc/${docId}`);
          const options = {
            url: `${systemConfig.writeData.path}:${systemConfig.writeData.port}/${systemConfig.writeData.name}/updateDoc/${docId}`, // ,
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify({ attachments: docAttachment }),
          };
          await new Promise((resolve) => {
            request.put(options, (error, response, body) => {
              if (error) {
                printLogWithTime(error);
                resolve(error);
                errMessage = error;
              } else {
                printLogWithTime(`updateDoc Result - ${body} `);
              }
            });
          });
        } else {
          errMessage = _.get(docResult, 'result');
        }
      }
    } else {
      errMessage = 'Initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Result - Failed - ${docId} - ${errMessage}`);
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

    printLogWithTime(`delAttachment/${docId}/${attachmentId}`);

    const fileUtil = new fileUtils('AWS-S3');
    const fileInstance = await fileUtil.getInstance();
    const initSuccess = await fileInstance.init();

    if (initSuccess) {
      await fileInstance.deleteObject(docId, attachmentId).catch((error) => {
        if (error) {
          errMessage = error;
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
          printLogWithTime(`updateDoc/${docId}`);
          const options = {
            url: `${systemConfig.writeData.path}:${systemConfig.writeData.port}/${systemConfig.writeData.name}/updateDoc/${docId}`, // ,
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify({ attachments: docAttachment }),
          };
          await new Promise((resolve) => {
            request.put(options, (error, response, body) => {
              if (error) {
                printLogWithTime(error);
                resolve(error);
                errMessage = error;
              } else {
                printLogWithTime(`updateDoc Result - ${body} `);
              }
            });
          });
        } else {
          errMessage = _.get(docResult, 'result');
        }
      }
    } else {
      errMessage = 'Initial S3 failed';
    }

    if (errMessage) {
      printLogWithTime(`Result - Failed - ${errMessage}`);
      res.json({ ok: false, message: errMessage });
    } else {
      printLogWithTime(`Result - success - ${docId}/${attachmentId}`);
      res.json({ id: docId, ok: true, rev: 1 });
    }

    printLogWithTime('----------------------------------------------------------------------');
  },
  async addTest(req, res) {
    printLogWithTime('addTest');

    res.json({ ok: false });
    printLogWithTime('----------------------------------------------------------------------');
  },


};
