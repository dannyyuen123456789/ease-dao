import mongoose from 'mongoose';

const _ = require('lodash');

exports.api = {
  approvalDetails(req, res, next) {
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
          'managerName ': '$managerName',
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

    const startkey = req.query.startkey || '';
    const endkey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';


    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    if (startkey !== '' && endkey !== '') {
      const startkeys = JSON.parse(startkey);
      const endkeys = JSON.parse(endkey);
      if (startkeys && startkeys.length > 1) {
        const where = {};
        if (startkeys.length > 1 && endkeys.length > 1 && _.isEqual(startkeys[1], endkeys[1])) {
          _.set(where, 'approvalStatus', startkeys[1]);
        } else {
          if (startkeys.length > 1) {
            _.set(where, 'approvalStatus.$gte', startkeys[1]);
          }
          if (endkeys.length > 1) {
            _.set(where, 'approvalStatus.$lte', endkeys[1]);
          }
        }
        if (startkeys.length > 2 && endkeys.length > 2 && _.isEqual(startkeys[2], endkeys[2])) {
          _.set(where, 'approvalCaseId', startkeys[2]);
        } else {
          if (startkeys.length > 2) {
            _.set(where, 'approvalCaseId.$gte', startkeys[2]);
          }
          if (endkeys.length > 2) {
            _.set(where, 'approvalCaseId.$lte', endkeys[2]);
          }
        }
        if (!_.isEmpty(where)) {
          matchStr.$match = where;
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      // [["01","113097"],["01","333333"],["01","987654"],["01","010010"],
      //  ["01","022222"],["01","007007"],["01","006006"]
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
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
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
        res.json(resultTemp);
      }
    });
  },
};
