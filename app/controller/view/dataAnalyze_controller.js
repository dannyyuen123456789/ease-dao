import mongoose from 'mongoose';

const _ = require('lodash');
// const moment = require('moment');

const CAN_ORDER = false;
exports.api = {
  async documentByLstChgDate(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';


    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {
      $match: {
        $and: [
          {
            lstChgDate: { $exists: true },
          },
          {
            type: {
              $ne: 'DATA_SYNC_TRX_LOG',
            },
          },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          const startT = new Date(startKeys[1]);
          const startTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 00:00:00`);
          const endTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 23:59:59`);
          _.get(matchStr, '$match.$and', []).push({
            lstChgDate: {
              $gte: startTime.getTime(),
              $lte: endTime.getTime(),
            },
          });
        } else {
          const startT = new Date(startKeys[1]);
          const startTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 00:00:00`);
          const endT = new Date(endKeys[1]);
          const endTime = new Date(`${endT.getFullYear()}-${endT.getMonth() + 1}-${endT.getDate()} 23:59:59`);
          _.get(matchStr, '$match.$and', []).push({
            lstChgDate:
              {
                $gte: startTime.getTime(),
                $lte: endTime.getTime(),
              },
          });
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            const startT = new Date(keyItem[1]);
            const startTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 00:00:00`);
            const endTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 23:59:59`);
            // console.log('key 1 = ', startTime.getTime());
            // console.log('key 2 = ', endTime.getTime());
            inArray.push(
              {
                lstChgDate:
                  {
                    $gte: startTime.getTime(),
                    $lte: endTime.getTime(),
                  },
              },
            );
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push({
          $or: inArray,
        });
        // _.set(matchStr, '$match.$or', inArray);
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        const startT = new Date(keyJson[1]);
        const startTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 00:00:00`);
        const endTime = new Date(`${startT.getFullYear()}-${startT.getMonth() + 1}-${startT.getDate()} 23:59:59`);
        // const zone = moment().utcOffset() * 60 * 1000;
        _.get(matchStr, '$match.$and', []).push({
          lstChgDate: {
            $gte: startTime.getTime(),
            $lte: endTime.getTime(),
          },
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { lstChgDate: 1 } });
    }
    aggregateStr.push(projectStr);
    const result = [];
    const createRow = (inDoc) => {
      const doc = _.cloneDeep(inDoc);
      if (doc.id.indexOf('appid-') === -1 && doc.id.indexOf('clientid-') === -1
      && doc.id.indexOf('_DELETEDID') === -1 && doc.id.indexOf('_RLSSTATUS') === -1) {
        result.push({
          id: doc.id,
          key: ['01',
            `${new Date(doc.lstChgDate).getFullYear()
            }-${
              new Date(doc.lstChgDate).getMonth() + 1
            }-${
              new Date(doc.lstChgDate).getDate()}`],
          value: doc,
        });
      }
    };
    const agentResult = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(agentResult)) {
      _.forEach(agentResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const agentExtResult = await mongoose.connection.collection('agentExtraInfo').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(agentExtResult)) {
      _.forEach(agentExtResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(applicationResult)) {
      _.forEach(applicationResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const shieldAppResult = await mongoose.connection.collection('shieldApplication').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(shieldAppResult)) {
      _.forEach(shieldAppResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const approvalResult = await mongoose.connection.collection('approval').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(approvalResult)) {
      _.forEach(approvalResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const shieldApprovalResult = await mongoose.connection.collection('shieldApproval').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(shieldApprovalResult)) {
      _.forEach(shieldApprovalResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const customerResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(customerResult)) {
      _.forEach(customerResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaResult = await mongoose.connection.collection('fna').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaResult)) {
      _.forEach(fnaResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaFeResult = await mongoose.connection.collection('fnaFe').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaFeResult)) {
      _.forEach(fnaFeResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaNaResult = await mongoose.connection.collection('fnaNa').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaNaResult)) {
      _.forEach(fnaNaResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaPadResult = await mongoose.connection.collection('fnaPda').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaPadResult)) {
      _.forEach(fnaPadResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const quotationResult = await mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(quotationResult)) {
      _.forEach(quotationResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const masterDataResult = await mongoose.connection.collection('masterData').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(masterDataResult)) {
      _.forEach(masterDataResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    // const collectionList = ['customer', 'agent', 'agentExtraInfo', 'fna', 'fnaFe', 'fnaNa',
    // 'fnaPda', 'quotation', 'application', 'approval', 'shieldApplication',
    //  'shieldApproval', 'masterData'];
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  async documentsWithoutLstChgDate(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$id'],
        value: '$id',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';


    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {
      $match: {
        $and: [
          {
            lstChgDate: { $exists: false },
          },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          _.get(matchStr, '$match.$and', []).push({
            id: startKeys[1],
          });
        } else {
          _.get(matchStr, '$match.$and', []).push({
            id:
              {
                $gte: startKeys[1],
                $lte: endKeys[1],
              },
          });
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push(
              {
                id: keyItem[1],
              },
            );
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push({
          $or: inArray,
        });
        // _.set(matchStr, '$match.$or', inArray);
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.get(matchStr, '$match.$and', []).push({
          id: keyJson[1],
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { id: 1 } });
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    const result = [];
    const createRow = (inDoc) => {
      const doc = _.cloneDeep(inDoc);
      if (doc.id && doc.id.indexOf('appid-') === -1 && doc.id.indexOf('clientid-') === -1
      && doc.id.indexOf('_DELETEDID') === -1 && doc.id.indexOf('_RLSSTATUS') === -1) {
        result.push(doc);
      }
    };
    const agentResult = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(agentResult)) {
      _.forEach(agentResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const agentExtResult = await mongoose.connection.collection('agentExtraInfo').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(agentExtResult)) {
      _.forEach(agentExtResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(applicationResult)) {
      _.forEach(applicationResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const shieldAppResult = await mongoose.connection.collection('shieldApplication').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(shieldAppResult)) {
      _.forEach(shieldAppResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const approvalResult = await mongoose.connection.collection('approval').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(approvalResult)) {
      _.forEach(approvalResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const shieldApprovalResult = await mongoose.connection.collection('shieldApproval').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(shieldApprovalResult)) {
      _.forEach(shieldApprovalResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const customerResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(customerResult)) {
      _.forEach(customerResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaResult = await mongoose.connection.collection('fna').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaResult)) {
      _.forEach(fnaResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaFeResult = await mongoose.connection.collection('fnaFe').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaFeResult)) {
      _.forEach(fnaFeResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaNaResult = await mongoose.connection.collection('fnaNa').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaNaResult)) {
      _.forEach(fnaNaResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const fnaPadResult = await mongoose.connection.collection('fnaPda').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(fnaPadResult)) {
      _.forEach(fnaPadResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const quotationResult = await mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(quotationResult)) {
      _.forEach(quotationResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const masterDataResult = await mongoose.connection.collection('masterData').aggregate(aggregateStr).toArray();
    if (!_.isEmpty(masterDataResult)) {
      _.forEach(masterDataResult, (emitItem) => {
        createRow(emitItem);
      });
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
};
