import mongoose from 'mongoose';

const _ = require('lodash');


const CAN_ORDER = false;
exports.api = {
  quotationsByBaseProductCode(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$baseProductCode'],
        value: {
          bundleId: '$bundleId',
          clientId: '$pCid',
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
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { baseProductCode: startKeys[1] };
        } else {
          matchStr.$match = { baseProductCode: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { baseProductCode: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = { baseProductCode: keyJson[1] };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { baseProductCode: 1 } });
    }
    //  console.log(" >>>>> aggregateStr=", JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
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
  quotationsByNHAFFund(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$baseProductCode'],
        pCid: '$pCid',
        iCid: '$iCid',
        // value: {
        //   cids: { $cond: { if: ('$pCid' === '$iCid'), then: ['$pCid'], else: 0 } },
        // },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {
      $match: {
        'fund.funds': { $elemMatch: { fundCode: 'NHAF' } },
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          _.set(matchStr, '$match.baseProductCode', startKeys[1]);
        } else {
          _.set(matchStr, '$match.baseProductCode', { $gte: startKeys[1], $lte: endKeys[1] });
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
        _.set(matchStr, '$match.baseProductCode', { $in: inArray });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.set(matchStr, '$match.baseProductCode', keyJson[1]);
      }
    }
    // _.set(matchStr, '$match.fund', { $ne: null });
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { baseProductCode: 1 } });
    }
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (doc) => {
            const quotationCids = [];
            if (doc.pCid) {
              quotationCids.push(doc.pCid);
            }
            if (doc.iCid && doc.iCid !== doc.pCid) {
              quotationCids.push(doc.iCid);
            }
            result.push({
              id: doc.id,
              key: doc.key,
              value: quotationCids,
            });
          });
          resultTemp.total_rows = result.length;
          resultTemp.rows = result;
        } else {
          resultTemp.total_rows = docs.length;
          resultTemp.rows = docs;
        }
        res.json(resultTemp);
      }
    });
  },
  validBundleInClient(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$agentId'],
        cid: '$cid',
        bundle: '$bundle',
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {
      $match: {
        bundle: { $ne: null },
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          _.set(matchStr, '$match.agentId', startKeys[1]);
        } else {
          _.set(matchStr, '$match.agentId', { $gte: startKeys[1], $lte: endKeys[1] });
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
        _.set(matchStr, '$match.agentId', { $in: inArray });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.set(matchStr, '$match.agentId', keyJson[1]);
      }
    }
    // _.set(matchStr, '$match.fund', { $ne: null });
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { agentId: 1 } });
    }
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('customer').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (doc) => {
            let validBundleId = '';
            _.forEach(doc.bundle, (bundle) => {
              if (bundle.isValid) {
                validBundleId = bundle.id;
              }
            });

            result.push({
              id: doc.id,
              key: doc.key,
              value: {
                id: doc.cid,
                validBundleId,
              },
            });
          });
          resultTemp.total_rows = result.length;
          resultTemp.rows = result;
        } else {
          resultTemp.total_rows = docs.length;
          resultTemp.rows = docs;
        }
        res.json(resultTemp);
      }
    });
  },
};
