/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';

const _ = require('lodash');

const printlnEndLog = (cnt, req, now) => {
  printLogWithTime(`Request - Get View ${req.originalUrl}`);
  printLogWithTime(`Result  - Success - result count: ${cnt} - ${Date.now() - now}ms`);
  printLogWithTime('----------------------------------------------------------------------');
};

exports.api = {
  summaryAppsByID(req, res) {
    const now = Date.now();
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        value: {
          type: '$type',
          isValid: '$isValid',
          agentCode: '$agentCode',
          bundleId: '$bundleId',
          quotationDocId: '$quotationDocId',
          appStep: '$appStep',
          applicationStartedDate: '$applicationStartedDate',
          isApplicationSigned: '$isApplicationSigned',
          isFullySigned: '$isFullySigned',
          isProposalSigned: '$isProposalSigned',
          isStartSignature: '$isStartSignature',
          isSubmittedStatus: '$isSubmittedStatus',
          lastUpdateDate: '$lastUpdateDate',
          iCid: '$iCid',
          pCid: '$pCid',
          policyNumber: '$policyNumber',
          agentName: '$quotation.agent.name',
          iName: '$quotation.iFullName',
          iSmoke: '$quotation.iSmoke',
          insured: '$applicationForm.values.insured',
          iDob: '$quotation.iDob',
          pName: '$quotation.pFullName',
          pSmoke: '$quotation.pSmoke',
          pIdCardNo: { $cond: { if: '$applicationForm.values.proposer.personalInfo.idCardNo', then: '$applicationForm.values.proposer.personalInfo.idCardNo', else: '' } },
          pDob: '$quotation.pDob',
          baseProductCode: '$quotation.baseProductCode',
          baseProductName: '$quotation.baseProductName',
          ccy: '$quotation.ccy',
          plans: '$quotation.plans',
          sameAs: '$quotation.sameAs',
          totPremium: '$quotation.premium',
          paymentMode: '$quotation.paymentMode',
        },
      },
    };

    const matchStr = {};
    const keys = req.query.keys || '';

    if (keys !== '' && keys !== '[null]') {
      const keyJson = JSON.parse(keys);
      if (keyJson && keyJson.length > 0) {
        matchStr.$match = { 'applicationForm.values.proposer.personalInfo.idCardNo': keyJson[2] };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        printlnEndLog(docs.length, req, now);
        const newRows = [];
        const newRows2 = [];
        let iIdCardNo = null;
        _.forEach(docs, (obj) => {
          if (obj.value.insured.length > 0 && obj.value.insured[0].personalInfo.idCardNo) {
            iIdCardNo = obj.value.insured[0].personalInfo.idCardNo;
          } else {
            iIdCardNo = obj.value.pIdCardNo;
          }
          if (obj.value.pIdCardNo !== null) {
            obj.key = ['01', 'PH', obj.value.pIdCardNo];
            obj.value.iIdCardNo = iIdCardNo;
            delete obj.value.insured;
            newRows.push(obj);
          }
          if (iIdCardNo !== null || obj.value.sameAs === 'Y') {
            obj.key = ['01', 'LA', iIdCardNo];
            obj.value.iIdCardNo = iIdCardNo;
            delete obj.value.insured;
            newRows2.push(obj);
          }
        });
        if (JSON.parse(keys)[1] === 'PH') {
          const newRows3 = [];
          _.forEach(newRows, (obj) => {
            obj.key[1] = 'PH';
            obj.key[2] = obj.value.pIdCardNo;
            if (JSON.parse(keys)[2] === obj.key[2]) {
              newRows3.push(obj);
            }
          });
          resultTemp.total_rows = newRows3.length;
          resultTemp.rows = newRows3;
        } else if (JSON.parse(keys)[1] === 'LA') {
          const newRows3 = [];
          _.forEach(newRows2, (obj) => {
            if (JSON.parse(keys)[2] === obj.key[2]) {
              newRows3.push(obj);
            }
          });
          resultTemp.total_rows = newRows3.length;
          resultTemp.rows = newRows3;
        }
        res.json(resultTemp);
      }
    });
  },
  summaryAppsByNameDob(req, res) {
    const now = Date.now();
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        value: {
          type: '$type',
          isValid: '$isValid',
          agentCode: '$agentCode',
          bundleId: '$bundleId',
          quotationDocId: '$quotationDocId',
          appStep: '$appStep',
          applicationStartedDate: '$applicationStartedDate',
          isApplicationSigned: '$isApplicationSigned',
          isFullySigned: '$isFullySigned',
          isProposalSigned: '$isProposalSigned',
          isStartSignature: '$isStartSignature',
          isSubmittedStatus: '$isSubmittedStatus',
          lastUpdateDate: '$lastUpdateDate',
          iCid: '$iCid',
          pCid: '$pCid',
          policyNumber: '$policyNumber',
          agentName: '$quotation.agent.name',
          iName: '$quotation.iFullName',
          iSmoke: '$quotation.iSmoke',
          insured: '$applicationForm.values.insured',
          iDob: '$quotation.iDob',
          pName: '$quotation.pFullName',
          pSmoke: '$quotation.pSmoke',
          pIdCardNo: { $cond: { if: '$applicationForm.values.proposer.personalInfo.idCardNo', then: '$applicationForm.values.proposer.personalInfo.idCardNo', else: '' } },
          pDob: '$quotation.pDob',
          baseProductCode: '$quotation.baseProductCode',
          baseProductName: '$quotation.baseProductName',
          ccy: '$quotation.ccy',
          plans: '$quotation.plans',
          sameAs: '$quotation.sameAs',
          totPremium: '$quotation.premium',
          paymentMode: '$quotation.paymentMode',
        },
      },
    };

    const matchStr = {};
    const keys = req.query.keys || '';

    if (keys !== '' && keys !== '[null]') {
      const keyJson = JSON.parse(keys);
      if (keyJson && keyJson.length > 0) {
        matchStr.$match = { 'quotation.iFullName': keyJson[2], 'quotation.iDob': keyJson[3] };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        printlnEndLog(docs.length, req, now);
        const newRows = [];
        const newRows2 = [];
        let iIdCardNo = null;
        _.forEach(docs, (obj) => {
          if (obj.value.insured.length > 0 && obj.value.insured[0].personalInfo.idCardNo) {
            iIdCardNo = _.get(obj.value.insured, obj.value.insured[0].personalInfo.idCardNo);
          } else {
            iIdCardNo = obj.value.pIdCardNo;
          }
          if (obj.value.pName !== null && obj.value.pDob !== null) {
            obj.key = ['01', 'PH', obj.value.pName, obj.value.pDob];
            obj.value.iIdCardNo = iIdCardNo;
            delete obj.value.insured;
            newRows.push(obj);
          }
          if ((obj.value.iName !== null && obj.value.iDob !== null) || obj.value.sameAs === 'Y') {
            obj.key = ['01', 'LA', obj.value.iName, obj.value.iDob];
            obj.value.iIdCardNo = iIdCardNo;
            delete obj.value.insured;
            newRows2.push(obj);
          }
        });
        if (JSON.parse(keys)[1] === 'PH') {
          const newRows3 = [];
          _.forEach(newRows, (obj) => {
            obj.key[1] = 'PH';
            obj.key[2] = obj.value.pName;
            obj.key[3] = obj.value.pDob;
            if (JSON.parse(keys)[2] === obj.key[2] && JSON.parse(keys)[3] === obj.key[3]) {
              newRows3.push(obj);
            }
          });
          resultTemp.total_rows = newRows3.length;
          resultTemp.rows = newRows3;
        } else if (JSON.parse(keys)[1] === 'LA') {
          const newRows3 = [];
          _.forEach(newRows2, (obj) => {
            if (JSON.parse(keys)[2] === obj.key[2] && JSON.parse(keys)[3] === obj.key[3]) {
              newRows3.push(obj);
            }
          });
          resultTemp.total_rows = newRows3.length;
          resultTemp.rows = newRows3;
        }
        res.json(resultTemp);
      }
    });
  },
};
