import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';

const _ = require('lodash');

const printlnEndLog = (cnt, now, req) => {
  printLogWithTime('Get view');
  printLogWithTime(`Request - ${req.originalUrl}`);
  printLogWithTime(`Result - Success - result count: ${cnt} - ${Date.now() - now}ms`);
  printLogWithTime('----------------------------------------------------------------------');
};
exports.api = {
  async agentDocuments(req, res) {
    var now = Date.now();
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', { $cond: { if: '$agentCode', then: '$agentCode', else: '$agentId' } }],
        value: null,
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
        const where = [];
        if (startKeys.length > 1 && endKeys.length > 1 && _.isEqual(startKeys[1], endKeys[1])) {
          where.push({ agentCode: startKeys[1] });
          where.push({ agentId: startKeys[1] });
        } else {
          const agentCodeTemp = {};
          const agentIdTemp = {};
          if (startKeys.length > 1) {
            _.set(agentCodeTemp, 'agentCode.$gte', startKeys[1]);
            _.set(agentIdTemp, 'agentId.$gte', startKeys[1]);
          }
          if (endKeys.length > 1) {
            _.set(agentCodeTemp, 'agentCode.$lte', endKeys[1]);
            _.set(agentIdTemp, 'agentId.$lte', endKeys[1]);
          }
          if (!_.isEmpty(agentCodeTemp)) {
            where.push(agentCodeTemp);
          }
          if (!_.isEmpty(agentIdTemp)) {
            where.push(agentIdTemp);
          }
        }
        if (!_.isEmpty(where)) {
          matchStr.$match = { $or: where };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push({ agentCode: keyItem[1] });
            inArray.push({ agentId: keyItem[1] });
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { $or: inArray };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = {
          $or: [
            { agentCode: keyJson[1] },
            { agentId: keyJson[1] },
          ],
        };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    //  console.log(" >>>>> aggregateStr=", JSON.stringify(aggregateStr));
    let result = [];
    aggregateStr.push(projectStr);
    const agentResult = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    // log4jUtil.log('agentResult = ', JSON.stringify(agentResult));
    if (!_.isEmpty(agentResult)) {
      result = _.concat(agentResult);
    }
    const applicationResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    // log4jUtil.log('applicationResult = ', JSON.stringify(applicationResult));
    if (!_.isEmpty(applicationResult)) {
      result = _.concat(result, applicationResult);
    }
    const approvalResult = await mongoose.connection.collection('approval').aggregate(aggregateStr).toArray();
    // log4jUtil.log('approvalResult = ', JSON.stringify(approvalResult));
    if (!_.isEmpty(approvalResult)) {
      result = _.concat(result, approvalResult);
    }
    const bundleResult = await mongoose.connection.collection('fna').aggregate(aggregateStr).toArray();
    // log4jUtil.log('bundleResult = ', JSON.stringify(bundleResult));
    if (!_.isEmpty(bundleResult)) {
      result = _.concat(result, bundleResult);
    }
    const custResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    // log4jUtil.log('custResult = ', JSON.stringify(custResult));
    if (!_.isEmpty(custResult)) {
      result = _.concat(result, custResult);
    }
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    printlnEndLog(result.length, now, req);
    res.json(resultTemp);
  },
};
