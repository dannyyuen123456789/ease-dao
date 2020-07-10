import mongoose from 'mongoose';
import printLogWithTime from '../../utils/log';

const _ = require('lodash');


const CAN_ORDER = false;
const printlnEndLog = (cnt) => {
  printLogWithTime(`Successful, result count: ${cnt}`);
  printLogWithTime('----------------------------------------------------------------------');
};
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
        printlnEndLog(docs.length);
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
              value: { cids: quotationCids },
            });
          });
          resultTemp.total_rows = result.length;
          resultTemp.rows = result;
          printlnEndLog(result.length);
        } else {
          resultTemp.total_rows = docs.length;
          resultTemp.rows = docs;
          printlnEndLog(docs.length);
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
          printlnEndLog(result.length);
        } else {
          resultTemp.total_rows = docs.length;
          resultTemp.rows = docs;
          printlnEndLog(docs.length);
        }
        res.json(resultTemp);
      }
    });
  },
  quotationsByMutipleBaseProductCode(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01'],
        value: {
          bundleId: '$bundleId',
          clientId: '$pCid',
        },
      },
    };
    // const startKey = req.query.startkey || '';
    // const endKey = req.query.endkey || '';
    // const keys = req.query.keys || '';
    // const key = req.query.key || '';
    //  emit(['01', doc.agentId], emitObject);
    const matchStr = {};
    // if (startKey !== '' && endKey !== '') {
    //   const startKeys = JSON.parse(startKey);
    //   const endKeys = JSON.parse(endKey);
    //   if (startKeys.length > 1 && endKeys.length > 1) {
    //     if (_.isEqual(startKeys, endKeys)) {
    //       matchStr.$match = { baseProductCode: startKeys[1] };
    //     } else {
    //       matchStr.$match = { baseProductCode: { $gte: startKeys[1], $lte: endKeys[1] } };
    //     }
    //   }
    // } else if (keys !== '') {
    //   const keysList = JSON.parse(keys);
    //   //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
    //   const inArray = [];
    //   if (keysList && keysList.length > 0) {
    //     _.forEach(keysList, (keyItem) => {
    //       if (keyItem && keyItem.length > 1) {
    //         inArray.push(keyItem[1]);
    //       }
    //     });
    //   }
    //   if (!_.isEmpty(inArray)) {
    //     matchStr.$match = { baseProductCode: { $in: inArray } };
    //   }
    // } else if (key !== '' && key !== '[null]') {
    //   const keyJson = JSON.parse(key);
    //   if (keyJson && keyJson.length > 1) {
    //     matchStr.$match = { baseProductCode: keyJson[1] };
    //   }
    // }
    // matchStr.$match = {$and:[{key:"01"},{baseProductCode:{$in:["SAV","ESP","RHP2","ART2","LITE","MPC","CSP","HER","HIM","TPX","TPPX","DTS","DTJ","FX2"]}}]};
    matchStr.$match = { 
      $or:[
        {
          baseProductCode : "SAV",
          'plans': { $elemMatch: { covCode: {$in: ["PET","PPEPS"] }} },
        },
        {
          baseProductCode : "ESP",
          'plans': { $elemMatch: { covCode: {$in: ["WPN","PENCI","PPU","WUN"] }} },
        },
        {
          baseProductCode : "RHP2",
          'plans': { $elemMatch: { covCode: {$in: ["WUN_RHP2","PET_RHP2"] }} },
        },
        {
          baseProductCode : "ART2",
          'plans': { $elemMatch: { covCode: {$in: ["WUN_NPE","PET_NPE"] }} },
        },
        {
          baseProductCode : "LITE",
          'plans': { $elemMatch: { covCode: {$in: ["LITE_SPPEP","LITE_CIPE","LITE_CIB","LITE_CRBP","LITE_ECIB","EPPU","EWU","LITE_SPPEP"] }} },
        },
        {
          baseProductCode : "TPX",
          'plans': { $elemMatch: { covCode: {$in: ["CRX","WPN","CIP","ECIP","PENCI","PPU","EPPU","WUN","EWU","MPCR"] }} },
        },
        {
          baseProductCode : "TPPX",
          'plans': { $elemMatch: { covCode: {$in: ["CRX","WPN","CIP","ECIP","PENCI","PPU","EPPU","WUN","EWU","MPCR"] }} },
        },
        {
          baseProductCode : "DTS",
          'plans': { $elemMatch: { covCode: {$in: ["WPPT_DTS","WPSR_DTS","DLZ"] }} },
        },
        {
          baseProductCode : "FX2",
          'plans': { $elemMatch: { covCode: {$in: ["FX2_CCA","FX2_CMA","FX2_CAB","FX2_CPW","FX2_CPP","FX2_ECA","FX2_EMA","FX2_EAB","FX2_EPW","FX2_EPP","FX2_SCC"] }} },
        },
        {
          baseProductCode : {$in:["MPC","CSP","HER","HIM"]},
        },
      ]
    };

    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // if (CAN_ORDER) {
    //   aggregateStr.push({ $sort: { baseProductCode: 1 } });
    // }
    //  console.log(" >>>>> matchStr=", JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        resultTemp.total_rows = docs.length;
        resultTemp.rows = docs;
        printlnEndLog(docs.length);
        res.json(resultTemp);
      }
    });
  },
};
