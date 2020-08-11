import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';

const _ = require('lodash');

const CAN_ORDER = false;
const printlnEndLog = (cnt, now, req) => {
  printLogWithTime('Get view');
  printLogWithTime(`Request - ${req.originalUrl}`);
  printLogWithTime(`Result - Success - result count: ${cnt} - ${Date.now() - now}ms`);
  printLogWithTime('----------------------------------------------------------------------');
};
exports.api = {
  approvalDetails(req, res) {
    var now = Date.now();
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$approvalStatus', '$approvalCaseId'],
        value: {
          compCode: '$compCode',
          displayCaseNo: '$policyId',
          caseNo: '$policyId',
          product: '$productName',
          agentId: '$agentId',
          agentName: '$agentName',
          managerName: '$managerName',
          managerId: '$managerId',
          directorId: '$directorId',
          directorName: '$directorName',
          approveManagerId: '$approveRejectManagerId',
          approveManagerName: '$approveRejectManagerName',
          approveRejectManagerId: '$approveRejectManagerId',
          approveRejectManagerName: '$approveRejectManagerName',
          submittedDate: '$submittedDate',
          approvalStatus: '$approvalStatus',
          onHoldReason: '$onHoldReason',
          approvalCaseId: '$approvalCaseId',
          applicationId: '$applicationId',
          quotationId: '$quotationId',
          customerId: '$customerId',
          customerName: '$customerName',
          lastEditedBy: '$lastEditedBy',
          lastEditedDate: '$lastEditedDate',
          approveRejectDate: '$approveRejectDate',
          caseLockedManagerCodebyStatus: '$caseLockedManagerCodebyStatus',
          customerICNo: '$customerICNo',
          agentProfileId: '$agentProfileId',
          expiredDate: '$expiredDate',
          masterApprovalId: { $cond: { if: '$masterApprovalId', then: '$masterApprovalId', else: '' } },
          isShield: '$isShield',
          proposalNumber: { $cond: { if: '$proposalNumber', then: '$proposalNumber', else: '$policyId' } },
          //  "proposalNumber": {$cond:{}"$proposalNumber"||"$policyId"},
          accept: '$accept',
          reject: '$reject',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';

    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys && startKeys.length > 1) {
        const where = {};
        if (startKeys.length > 1 && endKeys.length > 1 && _.isEqual(startKeys[1], endKeys[1])) {
          _.set(where, 'approvalStatus', startKeys[1]);
        } else {
          if (startKeys.length > 1) {
            _.set(where, 'approvalStatus.$gte', startKeys[1]);
          }
          if (endKeys.length > 1) {
            _.set(where, 'approvalStatus.$lte', endKeys[1]);
          }
        }
        if (startKeys.length > 2 && endKeys.length > 2 && _.isEqual(startKeys[2], endKeys[2])) {
          _.set(where, 'approvalCaseId', startKeys[2]);
        } else {
          if (startKeys.length > 2) {
            _.set(where, 'approvalCaseId.$gte', startKeys[2]);
          }
          if (endKeys.length > 2) {
            _.set(where, 'approvalCaseId.$lte', endKeys[2]);
          }
        }
        if (!_.isEmpty(where)) {
          matchStr.$match = where;
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          const temp = {};
          if (keyItem && keyItem.length > 1) {
            _.set(temp, 'approvalStatus', keyItem[1]);
          }
          if (keyItem && keyItem.length > 2) {
            _.set(temp, 'approvalCaseId', keyItem[2]);
          }
          if (!_.isEmpty(temp)) {
            inArray.push(temp);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { $or: inArray };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      const where = {};
      if (keyJson && keyJson.length > 1) {
        _.set(where, 'approvalStatus', keyJson[1]);
        if (keyJson.length > 2) {
          _.set(where, 'approvalCaseId', keyJson[2]);
        }
      }
      if (!_.isEmpty(where)) {
        matchStr.$match = where;
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { approvalStatus: 1, approvalCaseId: 1 } });
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('approval').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        resultTemp.total_rows = docs.length;
        resultTemp.rows = docs;
        printlnEndLog(docs.length, now, req);
        res.json(resultTemp);
      }
    });
  },
};
