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
        key: ['01', '$applicationForm.values.proposer.personalInfo.idCardNo'],
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
          iIdCardNo: { $cond: { if: '$applicationForm.values.insured[0].personalInfo', then: '$applicationForm.values.insured.personalInfo.idCardNo', else: '$applicationForm.values.proposer.personalInfo.idCardNo' } },
          iDob: '$quotation.iDob',
          pName: '$quotation.pFullName',
          pSmoke: '$quotation.pSmoke',
          pIdCardNo: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.idCardNo', else: '' } },
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
    const key = req.query.key || '';

    if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 0) {
        matchStr.$match = { 'applicationForm.values.proposer.personalInfo.idCardNo': keyJson[1] };
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
        resultTemp.total_rows = docs.length;
        resultTemp.rows = docs;
        printlnEndLog(docs.length, req, now);
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
        key: ['01', '$quotation.iFullName', '$quotation.iDob'],
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
          iIdCardNo: { $cond: { if: '$applicationForm.values.insured[0].personalInfo', then: '$applicationForm.values.insured.personalInfo.idCardNo', else: '$applicationForm.values.proposer.personalInfo.idCardNo' } },
          iDob: '$quotation.iDob',
          pName: '$quotation.pFullName',
          pSmoke: '$quotation.pSmoke',
          pIdCardNo: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.idCardNo', else: '' } },
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
    const key = req.query.key || '';

    if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      const wheres = {};
      if (keyJson && keyJson.length > 0) {
        _.set(wheres, 'quotation.iFullName', keyJson[1]);
        if (keyJson.length > 1) {
          _.set(wheres, 'quotation.iDob', keyJson[2]);
        }
      }
      if (!_.isEmpty(wheres)) {
        matchStr.$match = { 'quotation.iFullName': keyJson[1], 'quotation.iDob': keyJson[2] };
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
        resultTemp.total_rows = docs.length;
        resultTemp.rows = docs;
        printlnEndLog(docs.length, req, now);
        res.json(resultTemp);
      }
    });
  },
};
