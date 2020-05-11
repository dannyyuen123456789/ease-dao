import mongoose from 'mongoose';

const _ = require('lodash');

exports.api = {
  agentDetails(req, res) {
    const aggregateStr = [];
    const projectStr = {
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    let caseUser = false;
    let caseAgent = false;
    let caseFafirmCode = false;
    let caseProxy = false;
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'userId')) {
            caseUser = true;
            matchStr.$match = { 'rawData.agentCode': startKeys[2] };
          }
          if (_.isEqual(startKeys[1], 'agentCode')) {
            caseAgent = true;
            matchStr.$match = { agentCode: startKeys[2] };
          }
          if (_.isEqual(startKeys[1], 'fafirmCode')) {
            caseFafirmCode = true;
            matchStr.$match = { 'rawData.upline2Code': startKeys[2] };
          }
          if (_.isEqual(startKeys[1], 'proxy')) {
            caseProxy = true;
            matchStr.$match = {
              $or: [{ 'rawData.proxy1UserId': startKeys[2] }, { 'rawData.proxy2UserId': startKeys[2] }],
            };
          }
        } else {
          if (_.isEqual(startKeys[1], 'userId')) {
            caseUser = true;
            matchStr.$match = { 'rawData.agentCode': { $gte: startKeys[2], $lte: endKeys[2] } };
          }
          if (_.isEqual(startKeys[1], 'agentCode')) {
            caseAgent = true;
            matchStr.$match = { agentCode: { $gte: startKeys[2], $lte: endKeys[2] } };
          }
          if (_.isEqual(startKeys[1], 'fafirmCode')) {
            caseFafirmCode = true;
            matchStr.$match = { 'rawData.upline2Code': { $gte: startKeys[2], $lte: endKeys[2] } };
          }
          if (_.isEqual(startKeys[1], 'proxy')) {
            caseProxy = true;
            matchStr.$match = {
              $or: [
                { 'rawData.proxy1UserId': { $gte: startKeys[2], $lte: endKeys[2] } },
                { 'rawData.proxy2UserId': { $gte: startKeys[2], $lte: endKeys[2] } },
              ],
            };
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            if (_.isEqual(keyItem[1], 'userId')) {
              caseUser = true;
              inArray.push({
                'rawData.agentCode': keyItem[2],
              });
            }
            if (_.isEqual(keyItem[1], 'agentCode')) {
              caseAgent = true;
              inArray.push({
                agentCode: keyItem[2],
              });
            }
            if (_.isEqual(keyItem[1], 'fafirmCode')) {
              caseFafirmCode = true;
              inArray.push({
                'rawData.upline2Code': keyItem[2],
              });
            }
            if (_.isEqual(keyItem[1], 'proxy')) {
              caseProxy = true;
              inArray.push({
                'rawData.proxy1UserId': keyItem[2],
              });
              inArray.push({
                'rawData.proxy2UserId': keyItem[2],
              });
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.$or', inArray);
        // matchStr.$match = { $or: inArray };
      }
    } else {
      caseUser = true;
      caseAgent = true;
      caseFafirmCode = true;
      caseProxy = true;
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (caseAgent) {
      aggregateStr.push({ $sort: { agentCode: 1 } });
    } else if (caseUser) {
      aggregateStr.push({ $sort: { 'rawData.agentCode': 1 } });
    } else if (caseFafirmCode) {
      aggregateStr.push({ $sort: { 'rawData.upline2Code': 1 } });
    } else if (caseProxy) {
      aggregateStr.push({ $sort: { 'rawData.proxy1UserId': 1, 'rawData.proxy2UserId': 1 } });
    }
    if (caseUser || caseAgent || caseFafirmCode) {
      projectStr.$project = {
        _id: 0, // 0 is not selected
      };
    } else if (caseProxy) {
      projectStr.$project = {
        _id: 0, // 0 is not selected
        id: '$id',
        agentCode: '$agentCode',
        rawData: '$rawData',
      };
    }
    aggregateStr.push(projectStr);
    // console.log(' >>>>> matchStr=', JSON.stringify(aggregateStr));
    mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        // console.log(' >>>>> docs=', docs);
        const resultTemp = {};
        const userResult = [];
        const agentResult = [];
        const fafirmCodeResult = [];
        const proxy1Result = [];
        const proxy2Result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            if (caseUser) {
              const doc = _.cloneDeep(item);
              if (doc.rawData) {
                userResult.push({
                  id: doc.id,
                  key: ['01', 'userId', doc.rawData.agentCode],
                  value: Object.assign({}, doc),
                });
              }
            }
            if (caseAgent) {
              const doc = _.cloneDeep(item);
              agentResult.push({
                id: doc.id,
                key: ['01', 'agentCode', doc.agentCode],
                value: Object.assign({}, doc),
              });
            }
            if (caseFafirmCode) {
              if ((item.channel === 'BROKER' || item.channel === 'SYNERGY') && item.rawData && item.rawData.upline2Code) {
                const doc = _.cloneDeep(item);
                fafirmCodeResult.push({
                  id: doc.id,
                  key: ['01', 'fafirmCode', doc.rawData.upline2Code],
                  value: Object.assign({}, doc),
                });
              }
            }
            if (caseProxy) {
              if (item.rawData && item.rawData.proxy1UserId) {
                proxy1Result.push({
                  id: item.id,
                  key: ['01', 'proxy', item.rawData.proxy1UserId],
                  value: {
                    agentCode: item.agentCode,
                  },
                });
              }
              if (item.rawData && item.rawData.proxy2UserId) {
                proxy2Result.push({
                  id: item.id,
                  key: ['01', 'proxy', item.rawData.proxy2UserId],
                  value: {
                    agentCode: item.agentCode,
                  },
                });
              }
            }
          });
        }
        const result = _.concat(agentResult, userResult,
          fafirmCodeResult, proxy1Result, proxy2Result);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  contacts(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$agentId'],
        value: {
          id: '$cid',
          idCardNo: '$idCardNo',
          idDocType: '$idDocType',
          idDocTypeOther: '$idDocTypeOther',
          firstName: '$firstName',
          lastName: '$lastName',
          fullName: '$fullName',
          nameOrder: '$nameOrder',
          mobileNo: '$mobileNo',
          email: '$email',
          photo: '$photo',
          applicationCount: { $cond: { if: '$applicationCount', then: '$applicationCount', else: 0 } },
          //  "applicationCount": {"$max": ["$applicationCount", 0]}}
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { agentId: startKeys[1] };
        } else {
          matchStr.$match = { agentId: { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { agentId: { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { agentId: 1 } });
    //  console.log(" >>>>> aggregateStr=", JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('customer').aggregate(aggregateStr).toArray((err, docs) => {
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
  async applicationsByAgent(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        policyNumber: '$policyNumber',
        caseNo: '$policyNumber',
        displayCaseNo: '$policyNumber',
        // product: productName,
        // productName: productName,
        agentId: '$quotation.agent.agentCode',
        agentName: '$quotation.agent.name',
        submittedDate: '$applicationStartedDate',
        proposerName: '$quotation.pFullName',
        customerICNo: '$applicationForm.values.proposer.personalInfo.idCardNo',
        applicationId: '$id',
        policyId: '$policyNumber',
        lifeAssuredName: '$quotation.iFullName',
        quotType: '$quotation.quotType',
        plans: '$quotation.plans',
        baseProductName: '$quotation.baseProductName',

        // isShield: isShield
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { 'quotation.agent.agentCode': startKeys[1] };
        } else {
          matchStr.$match = { 'quotation.agent.agentCode': { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { 'quotation.agent.agentCode': { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { 'quotation.agent.agentCode': 1 } });
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    const result = [];
    const createResult = (doc) => {
      const { agentId } = doc;
      const temp = {};
      temp.id = doc.id;
      temp.key = ['01', agentId];
      let productName;
      const isShield = _.get(doc, 'quotType', '') === 'SHIELD';
      if (doc && doc.plans && doc.plans[0]
        && doc.plans[0].covName && !isShield) {
        productName = doc.plans[0].covName;
      } else if (doc.baseProductName && isShield) {
        const { baseProductName } = doc;
        _.set(baseProductName, 'en', `${doc.baseProductName.en} Plan`);
        productName = baseProductName;
      }
      const customerICNo = _.get(doc, 'customerICNo');
      temp.value = {
        caseNo: doc.policyNumber || doc.id,
        displayCaseNo: doc.policyNumber || doc.id,
        product: productName,
        productName,
        agentId,
        agentName: _.get(doc, 'agentName', ''),
        submittedDate: _.get(doc, 'submittedDate'),
        proposerName: _.get(doc, 'proposerName'),
        customerICNo,
        applicationId: doc.id,
        policyId: doc.policyNumber || doc.id,
        lifeAssuredName: _.get(doc, 'lifeAssuredName'),
        isShield,
      };
      return temp;
    };
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(applicationResult)) {
      _.forEach(applicationResult, (_application) => {
        result.push(createResult(_application));
      });
    }
    const masterApplicationResult = await mongoose.connection.collection('shieldApplication').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(masterApplicationResult)) {
      _.forEach(masterApplicationResult, (_masterApplication) => {
        result.push(createResult(_masterApplication));
      });
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  async approvalDetails(req, res) {
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
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';


    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    const matchStrAgent = {};
    let addCase1 = false;
    let addCaseAgent = false;
    let fullCase = false;
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        const where = {};
        const whereAgent = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length === 2) {
            _.set(whereAgent, 'agentId', startKeys[1]);
            addCaseAgent = true;
          }
          if (startKeys.length === 3) {
            addCase1 = true;
            _.set(where, 'approvalStatus', startKeys[1]);
            _.set(where, 'approvalCaseId', startKeys[2]);
          }
        } else {
          if (startKeys && startKeys.length === 2) {
            _.set(whereAgent, 'agentId.$gte', startKeys[1]);
            addCaseAgent = true;
          }
          if (startKeys && startKeys.length === 3) {
            _.set(where, 'approvalStatus.$gte', startKeys[1]);
            _.set(where, 'approvalCaseId.$gte', startKeys[2]);
            addCase1 = true;
          }
          if (endKeys && endKeys.length === 2) {
            _.set(whereAgent, 'agentId.$lte', endKeys[1]);
            addCaseAgent = true;
          }
          if (endKeys && endKeys.length === 3) {
            _.set(where, 'approvalStatus.$lte', endKeys[1]);
            _.set(where, 'approvalCaseId.$lte', endKeys[2]);
            addCase1 = true;
          }
        }
        if (!_.isEmpty(where)) {
          matchStr.$match = where;
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      const inAgentArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          const temp = {};
          if (keyItem && keyItem.length === 2) {
            addCaseAgent = true;
            _.set(temp, 'agentId', keyItem[1]);
            inAgentArray.push(temp);
          }
          if (keyItem && keyItem.length === 3) {
            addCase1 = true;
            _.set(temp, 'approvalStatus', keyItem[1]);
            _.set(temp, 'approvalCaseId', keyItem[2]);
            inArray.push(temp);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { $or: inArray };
      }
      if (!_.isEmpty(inAgentArray)) {
        matchStrAgent.$match = { $or: inAgentArray };
      }
    } else {
      addCase1 = true;
      fullCase = true;
      addCaseAgent = false;
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    let result = [];
    const projectStrAgent = _.cloneDeep(projectStr);
    aggregateStr.push({ $sort: { approvalStatus: 1, approvalCaseId: 1 } });
    aggregateStr.push(projectStr);
    if (addCase1) {
      const emitResult = await mongoose.connection.collection('approval').aggregate(aggregateStr).toArray();
      if (!_.isEmpty(emitResult)) {
        result = _.concat(result, emitResult);
        if (fullCase) {
          const emitAgentResult = [];
          _.forEach(emitResult, (rs) => {
            const agentResult = _.cloneDeep(rs);
            _.set(agentResult, 'key', ['01', _.get(agentResult, 'value.agentId', null)]);
            emitAgentResult.push(agentResult);
          });
          result = _.concat(result, emitAgentResult);
        }
      }
    }
    if (addCaseAgent) {
      const aggregateStrAgent = [];
      if (!_.isEmpty(matchStrAgent)) {
        aggregateStrAgent.push(matchStrAgent);
      }
      _.set(projectStrAgent, '$project.key', ['01', '$agentId']);
      aggregateStrAgent.push({ $sort: { agentId: 1 } });
      aggregateStrAgent.push(projectStrAgent);
      // console.log(' >>>>> aggregateStrAgent=', JSON.stringify(aggregateStrAgent));
      const emitAgentResult = await mongoose.connection.collection('approval').aggregate(aggregateStrAgent).toArray();
      if (!_.isEmpty(emitAgentResult)) {
        result = _.concat(result, emitAgentResult);
      }
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  directorDownline(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$rawData.upline2Code'],
        value: {
          agentCode: '$agentCode',
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {
      $match: {
        'rawData.upline2Code': { $exists: true },
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = {
            'rawData.upline2Code': startKeys[1],
          };
        } else {
          matchStr.$match = { 'rawData.upline2Code': { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { 'rawData.upline2Code': { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { 'rawData.upline2Code': 1 } });
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
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
  async inProgressQuotFunds(req, res) { // 这个视图如果START-KEY和 END-KEY如果不同，将拿全部（查询代码这个视图是没有条件全部拿出来的）
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        // key: ['01', '$quotationDocId', null],
        applications: '$applications',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStrBundle = {
      $match: {
        applications: { $exists: true },
        isValid: true,
      },
    };
    const matchStrQuotation = {
      $match: {
        'fund.funds': { $exists: true },
      },
    };
    let addCaseBundle = false;
    let addCaseQuotation = false;
    const quotationDocIds = [];
    const keyFunds = [];
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        let whereBundle = {};
        let whereQuotation = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length === 2) {
            whereBundle = {
              applications: { $elemMatch: { quotationDocId: startKeys[1] } },
            };
            addCaseBundle = true;
            quotationDocIds.push(startKeys[1]);
          }
          if (startKeys.length === 3) {
            addCaseQuotation = true;
            whereQuotation = {
              id: startKeys[1],
              'fund.funds': { $elemMatch: { fundCode: startKeys[2] } },
            };
            keyFunds.push(startKeys[2]);
          }
        } else {
          // const elemStr = {};
          // const elemStrQuestion = {};
          // const idStr = {};
          // if (startKeys && startKeys.length === 2) {
          //   _.set(elemStr, '$elemMatch', { 'quotationDocId.$gte': startKeys[1] });
          //   addCaseBundle = true;
          // }
          // if (startKeys && startKeys.length === 3) {
          //   // _.set(whereQuotation, 'id.$gte', startKeys[1]);
          //   // _.set(whereQuotation, 'funds.fundCode.$gte', startKeys[2]);
          //   _.set(idStr, 'id.$gte', startKeys[1]);
          //   _.set(elemStrQuestion, '$elemMatch.fundCode.$gte', startKeys[2]);

          //   addCaseQuotation = true;
          // }
          // if (endKeys && endKeys.length === 2) {
          //   _.set(elemStr, '$elemMatch', { 'quotationDocId.$lte': endKeys[1] });
          //   addCaseBundle = true;
          // }
          // if (endKeys && endKeys.length === 3) {
          //   _.set(idStr, 'id.$lte', endKeys[1]);
          //   _.set(elemStrQuestion, '$elemMatch.fundCode.$lte', endKeys[2]);
          //   addCaseQuotation = true;
          // }
          // if (!_.isEmpty(elemStr)) {
          //   whereBundle = {
          //     applications: elemStr,
          //   };
          // }
          // if (!_.isEmpty(elemStrQuestion)) {
          //   whereQuotation = {
          //     'fund.funds': elemStrQuestion,
          //   };
          // }
        }
        if (!_.isEmpty(whereBundle)) {
          matchStrBundle.$match = {
            applications: { $exists: true },
            isValid: true,
            ...whereBundle,
          };
        }
        if (!_.isEmpty(whereQuotation)) {
          matchStrQuotation.$match = {
            'fund.funds': { $exists: true },
            ...whereQuotation,
          };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inQuotationArray = [];
      const inBundleArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length === 2) {
            addCaseBundle = true;
            quotationDocIds.push(keyItem[1]);
            inBundleArray.push({
              applications: { $elemMatch: { quotationDocId: keyItem[1] } },
            });
          }
          if (keyItem && keyItem.length === 3) {
            addCaseQuotation = true;
            keyFunds.push(keyItem[2]);
            inQuotationArray.push({
              id: keyItem[1],
              'fund.funds': { $elemMatch: { fundCode: keyItem[2] } },
            });
          }
        });
      }
      if (!_.isEmpty(inBundleArray)) {
        matchStrBundle.$match = {
          applications: { $exists: true },
          isValid: true,
          $or: inBundleArray,
        };
      }
      if (!_.isEmpty(inQuotationArray)) {
        matchStrQuotation.$match = {
          'fund.funds': { $exists: true },
          $or: inQuotationArray,
        };
      }
    } else {
      addCaseBundle = true;
      addCaseQuotation = true;
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStrBundle)) {
      aggregateStr.push(matchStrBundle);
    }
    const result = [];
    const projectStrQuotation = _.cloneDeep(projectStr);
    aggregateStr.push({ $sort: { id: 1, 'applications.quotationDocId': 1 } });
    aggregateStr.push(projectStr);
    if (addCaseBundle) {
      const emitResult = await mongoose.connection.collection('fna').aggregate(aggregateStr).toArray();
      if (!_.isEmpty(emitResult)) {
        _.forEach(emitResult, (doc) => {
          if (doc && doc.applications && doc.applications.length > 0) {
            _.forEach(doc.applications, (app) => {
              if (app.quotationDocId && (
                _.isEmpty(quotationDocIds)
                || (!_.isEmpty(quotationDocIds)
                && _.indexOf(quotationDocIds, app.quotationDocId) > -1)
              )) {
                // console.log('>>>>>> ', app);
                // console.log('>>>>>> ', app.appStatus);
                if (app.applicationDocId && app.appStatus === 'APPLYING') {
                  // console.log('>>>>>> add APPLYING');
                  result.push({
                    id: doc.id,
                    key: ['01', app.quotationDocId, null],
                    value: {
                      bundleId: doc.id,
                      quotationDocId: app.quotationDocId,
                      applicationDocId: app.applicationDocId,
                    },
                  });
                } else if (_.get(app, 'applicationDocId', '') === '' && _.get(app, 'appStatus', '') === '') {
                  // console.log('>>>>>> add null');
                  result.push({
                    id: doc.id,
                    key: ['01', app.quotationDocId, null],
                    value: {
                      bundleId: doc.id,
                      quotationDocId: app.quotationDocId,
                    },
                  });
                }
              }
            });
          }
        });
      }
    }
    if (addCaseQuotation) {
      const aggregateStrQuotation = [];
      if (!_.isEmpty(matchStrQuotation)) {
        aggregateStrQuotation.push(matchStrQuotation);
      }
      delete projectStrQuotation.$project.applications;
      _.set(projectStrQuotation, '$project.funds', '$fund.funds');
      aggregateStrQuotation.push({ $sort: { id: 1, 'fund.funds.fundCode': 1 } });
      aggregateStrQuotation.push(projectStrQuotation);
      // console.log(' >>>>> aggregateStrQuotation=', JSON.stringify(aggregateStrQuotation));
      const emitAgentResult = await mongoose.connection.collection('quotation').aggregate(aggregateStrQuotation).toArray();
      if (!_.isEmpty(emitAgentResult)) {
        _.forEach(emitAgentResult, (doc) => {
          if (doc && doc.funds && doc.funds.length > 0) {
            _.forEach(doc.funds, (fund) => {
              if (_.isEmpty(keyFunds)
              || (!_.isEmpty(keyFunds) && _.indexOf(keyFunds, fund.fundCode) > -1)) {
                result.push({
                  id: doc.id,
                  key: ['01', doc.id, fund.fundCode],
                  value: {
                    quotationId: doc.id,
                    fundCode: fund.fundCode,
                    fundName: fund.fundName,
                  },
                });
              }
            });
          }
        });
      }
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  managerDownline(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$managerCode'],
        value: {
          agentCode: '$agentCode',
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { managerCode: startKeys[1] };
        } else {
          matchStr.$match = { managerCode: { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { managerCode: { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    // order by managerCode (注意 显示字段（projectStr）要放到最后)
    aggregateStr.push({ $sort: { managerCode: 1 } });
    aggregateStr.push(projectStr);
    mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
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
  async masterApprovalDetails(req, res) {
    // doc.type === 'masterApproval') {
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
          displayCaseNo: '',
          policyId: '$policyId',
          caseNo: '$approvalCaseId',
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
          subApprovalList: '$subApprovalList',
          isShield: '$isShield',
          proposalNumber: { $cond: { if: '$proposalNumber', then: '$proposalNumber', else: '$policyId' } },
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    const matchStrAgent = {};
    let addCase1 = false;
    let addCaseAgent = false;
    let fullCase = false;
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        const where = {};
        const whereAgent = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length === 2) {
            _.set(whereAgent, 'agentId', startKeys[1]);
            addCaseAgent = true;
          }
          if (startKeys.length === 3) {
            addCase1 = true;
            _.set(where, 'approvalStatus', startKeys[1]);
            _.set(where, 'approvalCaseId', startKeys[2]);
          }
        } else {
          if (startKeys && startKeys.length === 2) {
            _.set(whereAgent, 'agentId.$gte', startKeys[1]);
            addCaseAgent = true;
          }
          if (startKeys && startKeys.length === 3) {
            _.set(where, 'approvalStatus.$gte', startKeys[1]);
            _.set(where, 'approvalCaseId.$gte', startKeys[2]);
            addCase1 = true;
          }
          if (endKeys && endKeys.length === 2) {
            _.set(whereAgent, 'agentId.$lte', endKeys[1]);
            addCaseAgent = true;
          }
          if (endKeys && endKeys.length === 3) {
            _.set(where, 'approvalStatus.$lte', endKeys[1]);
            _.set(where, 'approvalCaseId.$lte', endKeys[2]);
            addCase1 = true;
          }
        }
        if (!_.isEmpty(where)) {
          matchStr.$match = where;
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      const inAgentArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          const temp = {};
          if (keyItem && keyItem.length === 2) {
            addCaseAgent = true;
            _.set(temp, 'agentId', keyItem[1]);
            inAgentArray.push(temp);
          }
          if (keyItem && keyItem.length === 3) {
            addCase1 = true;
            _.set(temp, 'approvalStatus', keyItem[1]);
            _.set(temp, 'approvalCaseId', keyItem[2]);
            inArray.push(temp);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { $or: inArray };
      }
      if (!_.isEmpty(inAgentArray)) {
        matchStrAgent.$match = { $or: inAgentArray };
      }
    } else {
      addCase1 = true;
      fullCase = true;
      addCaseAgent = false;
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    let result = [];
    const projectStrAgent = _.cloneDeep(projectStr);
    aggregateStr.push({ $sort: { approvalStatus: 1, approvalCaseId: 1 } });
    aggregateStr.push(projectStr);
    const createRow = (inDoc) => {
      const doc = _.cloneDeep(inDoc);
      let multiplePolicyNumber;
      if (doc.value && doc.value.subApprovalList && doc.value.subApprovalList.length > 0) {
        _.forEach(doc.value.subApprovalList, (subApproval, index) => {
          if (index === 0) {
            multiplePolicyNumber = subApproval;
          } else {
            multiplePolicyNumber += `, ${subApproval}`;
          }
        });
      } else {
        _.set(doc, 'value.subApprovalList', []);
      }
      _.set(doc, 'value.displayCaseNo', multiplePolicyNumber || doc.policyId);
      delete doc.policyId;
      return doc;
    };

    if (addCase1) {
      // console.log(' >>>>> matchStr111=', JSON.stringify(aggregateStr));
      const emitResult = await mongoose.connection.collection('shieldApproval').aggregate(aggregateStr).toArray();
      if (!_.isEmpty(emitResult)) {
        const emitAgentResult = [];
        _.forEach(emitResult, (emitItem) => {
          result.push(createRow(emitItem));
          if (fullCase) {
            const tempRow = createRow(emitItem);
            _.set(tempRow, 'key', ['01', _.get(tempRow, 'value.agentId', null)]);
            emitAgentResult.push(tempRow);
          }
        });
        if (fullCase && !_.isEmpty(emitAgentResult)) {
          result = _.concat(result, emitAgentResult);
        }
      }
    }
    if (addCaseAgent) {
      const aggregateStrAgent = [];
      if (!_.isEmpty(matchStrAgent)) {
        aggregateStrAgent.push(matchStrAgent);
      }
      _.set(projectStrAgent, '$project.key', ['01', '$agentId']);
      aggregateStrAgent.push({ $sort: { agentId: 1 } });
      aggregateStrAgent.push(projectStrAgent);
      const emitAgentResult = await mongoose.connection.collection('shieldApproval').aggregate(aggregateStrAgent).toArray();
      if (!_.isEmpty(emitAgentResult)) {
        _.forEach(emitAgentResult, (emitItem) => {
          result.push(createRow(emitItem));
        });
      }
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  pdfTemplates(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', 'QUOT', '$pdfCode'],
        value: {
          compCode: '$compCode',
          pdfCode: '$pdfCode',
          effDate: { $cond: { if: { $gt: ['$effDate', ''] }, then: '$effDate', else: 100000 } },
          expDate: { $cond: { if: { $gt: ['$expDate', ''] }, then: '$expDate', else: 9999999900000 } },
          version: '$version',
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {
      $match: { type: 'pdfTemplate' },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          _.set(matchStr, '$match.pdfCode', startKeys[2]);
          // matchStr.$match = { pdfCode: startKeys[2] };
        } else {
          _.set(matchStr, '$match.pdfCode', { $gte: startKeys[2], $lte: endKeys[2] });
          // matchStr.$match = { pdfCode: { $gte: startKeys[2], $lte: endKeys[2] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            inArray.push(keyItem[2]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.pdfCode', { $in: inArray });
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { pdfCode: 1 } });
    aggregateStr.push(projectStr);
    mongoose.connection.collection('masterData').aggregate(aggregateStr).toArray((err, docs) => {
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
  quickQuotes(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$pCid'],
        value: {
          id: '$id',
          type: '$type',
          covName: '',
          pCid: '$pCid',
          pFullName: '$pFullName',
          iFullName: '$iFullName',
          lastUpdateDate: '$lastUpdateDate',
          createDate: '$createDate',
        },
        quotType: '$quotType',
        insureds: '$insureds',
        plans: '$plans',
        baseProductName: '$baseProductName',
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {
      $match: {
        quickQuote: true,
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          _.set(matchStr, '$match.pCid', startKeys[1]);
        } else {
          _.set(matchStr, '$match.pCid', { $gte: startKeys[1], $lte: endKeys[1] });
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.pCid', { $in: inArray });
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { pCid: 1 } });
    aggregateStr.push(projectStr);
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            let iFullName = _.get(doc, 'value.iFullName', '');
            if (doc.quotType === 'SHIELD' && doc.insureds && doc.insureds.length > 0) {
              const iNames = [];
              _.forEach(doc.insureds, (insured) => {
                iNames.push(insured.iFullName);
              });
              iFullName = iNames.join(', ');
            }
            const covName = _.get(doc, 'baseProductName', (doc.plans && doc.plans[0] && doc.plans[0].covName) || '');
            _.set(doc, 'value.covName', covName);
            _.set(doc, 'value.iFullName', iFullName);
            delete doc.quotType;
            delete doc.insureds;
            delete doc.plans;
            delete doc.baseProductName;
            result.push(doc);
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  quotationByAgent(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$agent.agentCode'],
        value: {
          caseNo: '$id',
          displayCaseNo: '$id',
          product: '',
          agentId: '$agent.agentCode',
          agentName: '$agent.name',
          submittedDate: '$lastUpdateDate',
          proposerName: '$pFullName',
        },
        quotType: '$quotType',
        plans: '$plans',
        baseProductName: '$baseProductName',
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { 'agent.agentCode': startKeys[1] };
        } else {
          matchStr.$match = { 'agent.agentCode': { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { 'agent.agentCode': { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { 'agent.agentCode': 1 } });
    aggregateStr.push(projectStr);
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            let productName = '';
            const isShield = doc.quotType === 'SHIELD';
            if (doc && doc.plans && doc.plans[0] && doc.plans[0].covName && !isShield) {
              productName = doc.plans[0].covName;
            } else if (doc && doc.baseProductName && isShield) {
              doc.baseProductName.en = `${doc.baseProductName.en} Plan`;
              productName = doc.baseProductName;
            }
            _.set(doc, 'value.product', productName);
            delete doc.quotType;
            delete doc.plans;
            delete doc.baseProductName;
            result.push(doc);
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  quotationCampaign(req, res) {
    const aggregateStr = [];
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {
      $match: { type: 'campaign' },
    };
    let caseEndTime = false;
    let caseCampaignId = false;
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'endTime')) {
            caseEndTime = true;
            _.set(matchStr, '$match.endTime', new Date(startKeys[2]).toISOString());
          }
          if (_.isEqual(startKeys[1], 'campaignId')) {
            caseCampaignId = true;
            _.set(matchStr, '$match.campaignId', startKeys[2]);
          }
        } else {
          if (_.isEqual(startKeys[1], 'endTime')) {
            caseEndTime = true;
            //  _.set(matchStr, '$match.endTime', new Date(startKeys[2]));
            _.set(matchStr, '$match.endTime', { $gte: new Date(startKeys[2]).toISOString(), $lte: new Date(endKeys[2]).toISOString() });
            // matchStr.$match = { endTime: { $gte: startKeys[2], $lte: endKeys[2] } };
          }
          if (_.isEqual(startKeys[1], 'campaignId')) {
            caseCampaignId = true;
            _.set(matchStr, '$match.campaignId', { $gte: startKeys[2], $lte: endKeys[2] });
            // matchStr.$match = { campaignId: { $gte: startKeys[2], $lte: endKeys[2] } };
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            const temp = {};
            if (_.isEqual(keyItem[1], 'endTime')) {
              caseEndTime = true;
              _.set(temp, 'endTime', new Date(keyItem[2]));
              inArray.push(temp);
            }
            if (_.isEqual(keyItem[1], 'campaignId')) {
              caseCampaignId = true;
              _.set(temp, 'campaignId', keyItem[2]);
              inArray.push(temp);
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.$or', inArray);
        // matchStr.$match = { $or: inArray };
      }
    } else {
      caseEndTime = true;
      caseCampaignId = true;
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (caseEndTime) {
      aggregateStr.push({ $sort: { endTime: 1 } });
    } else {
      aggregateStr.push({ $sort: { campaignId: 1 } });
    }

    // aggregateStr.push(projectStr);
    // console.log(' >>>>> matchStr=', JSON.stringify(aggregateStr));
    mongoose.connection.collection('masterData').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        // console.log(' >>>>> docs=', docs);
        const resultTemp = {};
        const endTimeResult = [];
        const campaignIdResult = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            if (caseEndTime) {
              const doc = _.cloneDeep(item);
              endTimeResult.push({
                id: doc.id,
                key: ['01', 'endTime', Date.parse(doc.endTime)],
                value: _.omit(doc, ['_id']),
              });
            }
            if (caseCampaignId) {
              const doc = _.cloneDeep(item);
              campaignIdResult.push({
                id: doc.id,
                key: ['01', 'campaignId', doc.campaignId],
                value: _.omit(doc, ['_id']),
              });
            }
          });
        }
        const result = _.concat(endTimeResult, campaignIdResult);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  async summaryApps(req, res) {
    // doc.type === 'masterApproval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$pCid', '$id'],
        value: {
          id: '$id',
          policyNumber: '$policyNumber',
          type: '$type',
          isValid: '$isValid',
          bundleId: '$bundleId',
          quotationDocId: '$quotationDocId',
          baseProductCode: '$quotation.baseProductCode',
          baseProductName: '$quotation.baseProductName',
          iName: '$quotation.iFullName',
          pName: '$quotation.pFullName',
          ccy: '$quotation.ccy',
          totPremium: '$quotation.premium',
          paymentMode: '$quotation.paymentMode',
          productLine: '$quotation.productLine',
          quotType: { $cond: { if: '$quotation.quotType', then: '$quotation.quotType', else: '' } },
          lastUpdateDate: {
            $cond: {
              if: '$applicationSubmittedDate',
              then: '$applicationSubmittedDate',
              else: {
                $cond: {
                  if: '$applicationSignedDate',
                  then: '$applicationSignedDate',
                  else: { $cond: { if: '$applicationStartedDate', then: '$applicationStartedDate', else: '$lastUpdateDate' } },
                },
              },
            },
          },
          plans: '$quotation.plans',
          productQuotForm: '$quotation.productQuotForm',
          isSubQuotation: { $cond: { if: '$quotation.isSubQuotation', then: '$quotation.isSubQuotation', else: false } },
          isInitialPaymentCompleted: '$isInitialPaymentCompleted',
          isAgentReportSigned: '$isAgentReportSigned',
          iCid: '$iCid',
          pCid: '$pCid',
          isStartSignature: '$isStartSignature',
          isFullySigned: '$isFullySigned',
          quotation: '$quotation',
          isMandDocsAllUploaded: { $cond: { if: '$isMandDocsAllUploaded', then: '$isMandDocsAllUploaded', else: false } },
          iCids: { $cond: { if: '$iCids', then: '$iCids', else: [] } },
          iCidMapping: { $cond: { if: '$iCidMapping', then: '$iCidMapping', else: {} } },
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        const where = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(where, 'pCid', startKeys[1]);
          }
          if (startKeys.length > 2) {
            _.set(where, 'id', startKeys[2]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(where, 'pCid.$gte', startKeys[1]);
          }
          if (startKeys && startKeys.length > 2) {
            _.set(where, 'id.$gte', startKeys[2]);
          }
          if (endKeys && endKeys.length > 1) {
            _.set(where, 'pCid.$lte', endKeys[1]);
          }
          if (endKeys && endKeys.length > 2) {
            _.set(where, 'id.$lte', endKeys[2]);
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
          if (keyItem && keyItem.length === 2) {
            _.set(temp, 'pCid', keyItem[1]);
            inArray.push(temp);
          }
          if (keyItem && keyItem.length === 3) {
            _.set(temp, 'pCid', keyItem[1]);
            _.set(temp, 'id', keyItem[2]);
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
      aggregateStr.push({ $sort: { pCid: 1, id: 1 } });
    }
    let result = [];

    aggregateStr.push(projectStr);
    const mastAggregateStr = _.cloneDeep(aggregateStr);
    // console.log(' >>>>> matchStr111=', JSON.stringify(aggregateStr));
    const emitResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(emitResult)) {
      result = _.concat(result, emitResult);
    }
    const emitMasterResult = await mongoose.connection.collection('shieldApplication').aggregate(mastAggregateStr).toArray();
    if (!_.isEmpty(emitMasterResult)) {
      result = _.concat(result, emitMasterResult);
    }

    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  summaryQuots(req, res) {
    // doc.type === 'masterApproval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$pCid', '$id'],
        value: {
          id: '$id',
          type: '$type',
          isValid: '$isValid',
          bundleId: '$bundleId',
          baseProductCode: '$baseProductCode',
          baseProductName: '$baseProductName',
          iName: '$iFullName',
          pName: '$pFullName',
          ccy: '$ccy',
          totCpfPortion: '$totCpfPortion',
          totCashPortion: '$totCashPortion',
          totMedisave: '$totMedisave',
          totPremium: { $cond: { if: { quotType: 'SHIELD' }, then: '$totPremium', else: '$premium' } },
          paymentMode: { $cond: { if: '$paymentMode', then: '$paymentMode', else: '' } },
          lastUpdateDate: '$lastUpdateDate',
          statusChangeDate: { $cond: { if: '$proposedDate', then: '$proposedDate', else: '$lastUpdateDate' } },
          productLine: '$productLine',
          plans: '$plans',
          iCid: '$iCid',
          pCid: '$pCid',
          fnaAns: { $cond: { if: '$fnaAns', then: '$fnaAns', else: '' } },
          clientChoice: '$clientChoice',
          policyOptions: '$policyOptions',
          policyOptionsDesc: '$policyOptionsDesc',
          quotType: { $cond: { if: '$quotType', then: '$quotType', else: '' } },
          insureds: { $cond: { if: '$quotType', then: '$quotType', else: {} } },
          iCids: [],
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        const where = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(where, 'pCid', startKeys[1]);
          }
          if (startKeys.length > 2) {
            _.set(where, 'id', startKeys[2]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(where, 'pCid.$gte', startKeys[1]);
          }
          if (startKeys && startKeys.length > 2) {
            _.set(where, 'id.$gte', startKeys[2]);
          }
          if (endKeys && endKeys.length > 1) {
            _.set(where, 'pCid.$lte', endKeys[1]);
          }
          if (endKeys && endKeys.length > 2) {
            _.set(where, 'id.$lte', endKeys[2]);
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
          if (keyItem && keyItem.length === 2) {
            _.set(temp, 'pCid', keyItem[1]);
            inArray.push(temp);
          }
          if (keyItem && keyItem.length === 3) {
            _.set(temp, 'pCid', keyItem[1]);
            _.set(temp, 'id', keyItem[2]);
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
      aggregateStr.push({ $sort: { pCid: 1, id: 1 } });
    }

    aggregateStr.push(projectStr);
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const insureds = _.get(doc, 'value.insureds', []);
            if (!_.isEmpty(insureds)) {
              _.set(doc, 'value.iCids', Object.keys(insureds));
            }
            result.push(doc);
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  systemNotification(req, res) {
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', 'messageId', '$messageId'],
        value: {
          startTime: '$startTime',
          endTime: '$endTime',
          messageId: '$messageId',
          messagePriorityInAlertBox: '$messagePriorityInAlertBox',
          messageGroup: '$messageGroup',
          groupPriority: '$groupPriority',
          messageMapping: '$messageMapping',
          message: '$message',
          groupTitle: '$groupTitle',
          messageDealerGroups: '$messageDealerGroups',
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStr = {
      $match: { type: 'campaign' },
    };
    let caseEndTime = false;
    let caseMessageId = false;
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'endTime')) {
            caseEndTime = true;
            _.set(matchStr, '$match.endTime', new Date(startKeys[2]).toISOString());
          }
          if (_.isEqual(startKeys[1], 'messageId')) {
            caseMessageId = true;
            _.set(matchStr, '$match.messageId', startKeys[2]);
          }
        } else {
          if (_.isEqual(startKeys[1], 'endTime')) {
            caseEndTime = true;
            //  _.set(matchStr, '$match.endTime', new Date(startKeys[2]));
            _.set(matchStr, '$match.endTime', { $gte: new Date(startKeys[2]).toISOString(), $lte: new Date(endKeys[2]).toISOString() });
            // matchStr.$match = { endTime: { $gte: startKeys[2], $lte: endKeys[2] } };
          }
          if (_.isEqual(startKeys[1], 'messageId')) {
            caseMessageId = true;
            _.set(matchStr, '$match.messageId', { $gte: startKeys[2], $lte: endKeys[2] });
            // matchStr.$match = { campaignId: { $gte: startKeys[2], $lte: endKeys[2] } };
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            const temp = {};
            if (_.isEqual(keyItem[1], 'endTime')) {
              caseEndTime = true;
              _.set(temp, 'endTime', new Date(keyItem[2]));
              inArray.push(temp);
            }
            if (_.isEqual(keyItem[1], 'messageId')) {
              caseMessageId = true;
              _.set(temp, 'messageId', keyItem[2]);
              inArray.push(temp);
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.$or', inArray);
        // matchStr.$match = { $or: inArray };
      }
    } else {
      caseEndTime = true;
      caseMessageId = true;
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (caseEndTime) {
      aggregateStr.push({ $sort: { endTime: 1 } });
    } else {
      aggregateStr.push({ $sort: { messageId: 1 } });
    }

    aggregateStr.push(projectStr);
    // console.log(' >>>>> matchStr=', JSON.stringify(aggregateStr));
    mongoose.connection.collection('masterData').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        // console.log(' >>>>> docs=', docs);
        const resultTemp = {};
        let result = [];
        const endTimeResult = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            if (caseEndTime) {
              const doc = _.cloneDeep(item);
              const endTime = _.get(doc, 'value.endTime', '');
              _.set(doc, 'key', ['01', 'endTime', Date.parse(endTime)]);
              endTimeResult.push(doc);
            }
          });
          result = _.concat(result, endTimeResult);
          if (caseMessageId) {
            result = _.concat(result, docs);
          }
        }
        // const result = _.concat(endTimeResult, docs);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  validbundleApplicationsByAgent(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        agentId: '$agentId',
        pCid: '$pCid',
        applications: '$applications',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    // const key = req.query.key || '';
    const matchStrBundle = {
      $match: {
        applications: { $exists: true },
        isValid: true,
      },
    };

    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(matchStrBundle, '$match.agentId', startKeys[1]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(matchStrBundle, '$match.agentId.$gte', startKeys[1]);
          }

          if (endKeys && endKeys.length > 1) {
            _.set(matchStrBundle, '$match.agentId.$lte', endKeys[1]);
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStrBundle, '$match.agentId', { $in: inArray });
      }
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStrBundle)) {
      aggregateStr.push(matchStrBundle);
    }
    // console.log('>>>>>>  matchStrBundle', JSON.stringify(matchStrBundle));
    aggregateStr.push({ $sort: { agentId: 1 } });
    aggregateStr.push(projectStr);

    mongoose.connection.collection('fna').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          // console.log('>>>>>>  docs length=', docs.length);
          _.forEach(docs, (doc) => {
            if (doc && doc.applications && doc.applications.length > 0) {
              _.forEach(doc.applications, (app) => {
                if (app.applicationDocId && app.appStatus === 'APPLYING') {
                  result.push({
                    id: doc.id,
                    key: ['01', doc.agentId],
                    value: {
                      bundleId: doc.id,
                      pCid: doc.pCid,
                      quotationDocId: app.quotationDocId,
                      applicationDocId: app.applicationDocId,
                    },
                  });
                } else if (_.get(app, 'applicationDocId', '') === '' && _.get(app, 'appStatus', '') === '') {
                  result.push({
                    id: doc.id,
                    key: ['01', doc.agentId],
                    value: {
                      bundleId: doc.id,
                      pCid: doc.pCid,
                      quotationDocId: app.quotationDocId,
                      applicationDocId: null,
                    },
                  });
                }
              });
            }
          });
        }
        // const result = _.concat(endTimeResult, docs);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
};
