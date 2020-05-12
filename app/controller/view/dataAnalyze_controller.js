import mongoose from 'mongoose';

const _ = require('lodash');

exports.api = {
  async documentByLstChgDate(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
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
    // const key = req.query.key || '';


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
          {
            id: {
              $not: /^.*appid-.*$/i,
            },
          },
          {
            id: {
              $not: /^.*clientid-.*$/i,
            },
          },
          {
            id: {
              $not: /^.*_DELETEDID.*$/i,
            },
          },
          {
            id: {
              $not: /^.*_RLSSTATUS.*$/i,
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
          _.get(matchStr, '$match.$and', []).push({
            lstChgDate: new Date(startKeys[1]).getTime(),
          });
        } else {
          const startT = new Date(startKeys[1]);
          startT.setDate(startT.getDate() - 1);
          const endT = new Date(endKeys[1]);
          endT.setDate(endT.getDate() + 1);
          _.get(matchStr, '$match.$and', []).push({
            lstChgDate:
              {
                $gt: startT.getTime(),
                $lt: endT.getTime(),
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
            startT.setDate(startT.getDate() - 1);
            const endT = new Date(keyItem[1]);
            endT.setDate(endT.getDate() + 1);
            // console.log('key 1 = ', keyItem[1]);
            // console.log('key 2 = ', (`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`));
            inArray.push(
              {
                lstChgDate:
                  {
                    $gt: startT.getTime(),
                    $lt: endT.getTime(),
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
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // aggregateStr.push({ $sort: { approvalStatus: 1, approvalCaseId: 1 } });
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    const result = [];
    const createRow = (inDoc) => {
      const doc = _.cloneDeep(inDoc);

      return {
        id: doc.id,
        key: ['01',
          `${new Date(doc.lstChgDate).getFullYear()
          }-${
            new Date(doc.lstChgDate).getMonth() + 1
          }-${
            new Date(doc.lstChgDate).getDate()}`],
        value: doc,
      };
    };

    const agentResult = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    // log4jUtil.log('agentResult = ', JSON.stringify(agentResult));
    if (!_.isEmpty(agentResult)) {
      _.forEach(agentResult, (emitItem) => {
        result.push(createRow(emitItem));
      });
    }
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    // log4jUtil.log('applicationResult = ', JSON.stringify(applicationResult));
    if (!_.isEmpty(applicationResult)) {
      _.forEach(applicationResult, (emitItem) => {
        result.push(createRow(emitItem));
      });
    }
    const customerResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    // log4jUtil.log('agentResult = ', JSON.stringify(agentResult));
    if (!_.isEmpty(customerResult)) {
      // result = _.concat(agentResult);
      _.forEach(customerResult, (emitItem) => {
        result.push(createRow(emitItem));
      });
    }

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
    // const key = req.query.key || '';


    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {
      $match: {
        $and: [
          {
            lstChgDate: { $exists: false },
          },
          // {
          //   type: {
          //     $ne: 'DATA_SYNC_TRX_LOG',
          //   },
          // },
          {
            id: {
              $not: /^.*appid-.*$/i,
            },
          },
          {
            id: {
              $not: /^.*clientid-.*$/i,
            },
          },
          {
            id: {
              $not: /^.*_DELETEDID.*$/i,
            },
          },
          {
            id: {
              $not: /^.*_RLSSTATUS.*$/i,
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
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { id: 1 } });
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    let result = [];


    const agentResult = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    // log4jUtil.log('agentResult = ', JSON.stringify(agentResult));
    if (!_.isEmpty(agentResult)) {
      result = _.concat(result, agentResult);
      // _.forEach(agentResult, (emitItem) => {
      //   result.push(createRow(emitItem));
      // });
    }
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    // log4jUtil.log('applicationResult = ', JSON.stringify(applicationResult));
    if (!_.isEmpty(applicationResult)) {
      result = _.concat(result, applicationResult);
      // _.forEach(applicationResult, (emitItem) => {
      //   result.push(createRow(emitItem));
      // });
    }
    const customerResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    // log4jUtil.log('agentResult = ', JSON.stringify(agentResult));
    if (!_.isEmpty(customerResult)) {
      result = _.concat(result, customerResult);
      // result = _.concat(agentResult);
      // _.forEach(customerResult, (emitItem) => {
      //   result.push(createRow(emitItem));
      // });
    }

    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
};
