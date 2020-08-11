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
const webVsIosReportBundle = async (req) => {
  var now = Date.now();
  const aggregateStr = [];
  // This is the query result and alias -> projectStr
  const projectStr = {
    $project: {
      _id: 0, // 0 is not selected
      id: '$id',
      key: [],
      value: {
        createDate: '$createTime',
        lstChgDate: '$lstChgDate',
        dealerGroup: '$dealerGroup',
        agentCode: '$agentCode',
        clientId: '$pCid',
        bundleApplications: '$applications',
        id: '$id',
      },
    },
  };
  let canSearch = false;
  const startKey = req.query.startkey || '';
  const endKey = req.query.endkey || '';
  const keys = req.query.keys || '';
  const key = req.query.key || '';
  const matchStr = {
    $match: {
      $and: [
        { type: 'bundle' },
      ],
    },
  };
  if (startKey !== '' && endKey !== '') {
    const startKeys = JSON.parse(startKey);
    const endKeys = JSON.parse(endKey);
    if (startKeys || endKeys) {
      if (_.isEqual(startKeys, endKeys)) {
        if (startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'bundle')) {
            canSearch = true;
            if (startKeys.length > 2) {
              _.get(matchStr, '$match.$and', []).push(
                {
                  createTime: new Date(startKeys[2]).toISOString(),
                },
              );
            }
          }
        }
      } else {
        const elemStr = {};
        if (startKeys && startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'bundle')) {
            canSearch = true;
            if (startKeys && startKeys.length > 2) {
              _.set(elemStr, '$gte', new Date(startKeys[2]).toISOString());
            }
          }
        }
        if (endKeys && endKeys.length > 1) {
          if (_.isEqual(endKeys[1], 'bundle')) {
            canSearch = true;
            if (endKeys && endKeys.length > 2) {
              _.set(elemStr, '$lte', new Date(endKeys[2]).toISOString());
            }
          }
        }

        if (!_.isEmpty(elemStr)) {
          _.get(matchStr, '$match.$and', []).push(
            {
              createTime: elemStr,
            },
          );
        }
      }
    }
  } else if (keys !== '') {
    const keysList = JSON.parse(keys);
    const inArray = [];
    if (keysList && keysList.length > 0) {
      _.forEach(keysList, (keyItem) => {
        if (keyItem && keyItem.length > 1) {
          if (_.isEqual(keyItem[1], 'bundle')) {
            canSearch = true;
            if (keyItem && keyItem.length > 2) {
              inArray.push(new Date(keyItem[2]).toISOString());
            }
          }
        }
      });
    }
    if (!_.isEmpty(inArray)) {
      _.get(matchStr, '$match.$and', []).push(
        {
          createTime: { $in: inArray },
        },
      );
    }
  } else if (key !== '' && key !== '[null]') {
    const keyJson = JSON.parse(key);
    if (keyJson && keyJson.length > 1) {
      if (_.isEqual(keyJson[1], 'bundle')) {
        canSearch = true;
        if (keyJson.length > 2) {
          _.get(matchStr, '$match.$and', []).push(
            {
              createTime: new Date(keyJson[2]).toISOString(),
            },
          );
        }
      }
    }
  } else {
    canSearch = true;
  }
  const result = [];
  if (canSearch) {
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>> matchStr', JSON.stringify(matchStr));
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { createDate: 1 } });
    }

    aggregateStr.push(projectStr);
    const emitResult = await mongoose.connection.collection('fna').aggregate(aggregateStr).toArray();
    if (emitResult && emitResult.length > 0) {
      _.forEach(emitResult, (item) => {
        const doc = _.cloneDeep(item);
        const createDate = _.get(doc, 'value.createDate');
        _.set(doc, 'key', ['01', 'bundle', new Date(createDate).getTime()]);
        result.push(doc);
      });
    }
  }
  return result;
};

const webVsIosReportQuot = async (req) => {
  var now = Date.now();
  const aggregateStr = [];
  const projectStr = {
    $project: {
      _id: 0, // 0 is not selected
      id: '$id',
      key: [],
      value: {
        quotCreateDate: '$lastUpdateDate',
        baseProductName: '$baseProductName.en',
        clientId: '$pCid',
        quotationDocId: '$id',
        id: '$id',
        quotProposerName: '$pFullName',
        quotLAName: '$iFullName',
      },
      quickQuote: '$quickQuote',
    },
  };
  let caseQuick = false;
  let caseQuot = false;
  const quickKeys = [];
  const quotKeys = [];
  const startKey = req.query.startkey || '';
  const endKey = req.query.endkey || '';
  const keys = req.query.keys || '';
  const key = req.query.key || '';
  const matchStr = {
    $match: {
      $and: [
        { type: 'quotation' },
      ],
    },
  };

  if (startKey !== '' && endKey !== '') {
    const startKeys = JSON.parse(startKey);
    const endKeys = JSON.parse(endKey);
    if (startKeys || endKeys) {
      if (_.isEqual(startKeys, endKeys)) {
        if (startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'quickQuote')) {
            const temp = {};
            caseQuick = true;
            if (startKeys.length > 2) {
              _.set(temp, 'lastUpdateDate', startKeys[2]);
              _.get(matchStr, '$match.$and', []).push(
                {
                  lastUpdateDate: new Date(startKeys[2]).toISOString(),
                },
              );
            }
            if (startKeys.length > 3) {
              _.set(temp, 'pCid', startKeys[3]);
              _.get(matchStr, '$match.$and', []).push(
                {
                  pCid: startKeys[3],
                },
              );
            }
            if (!_.isEmpty(temp)) {
              quickKeys.push(temp);
            }
          }
          if (_.isEqual(startKeys[1], 'quotation')) {
            caseQuot = true;
            if (startKeys.length > 2) {
              quotKeys.push(startKeys[2]);
              _.get(matchStr, '$match.$and', []).push(
                {
                  lastUpdateDate: new Date(startKeys[2]).toISOString(),
                },
              );
            }
          }
        }
      } else {
        const elemLastUpdateDate = {};
        const elemPCid = {};
        if (startKeys && startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'quickQuote')) {
            caseQuick = true;
            if (startKeys && startKeys.length > 2) {
              _.set(elemLastUpdateDate, '$gte', new Date(startKeys[2]).toISOString());
            }
            if (startKeys && startKeys.length > 3) {
              _.set(elemPCid, '$gte', startKeys[3]);
            }
          }
          if (_.isEqual(startKeys[1], 'quotation')) {
            caseQuot = true;
            if (startKeys && startKeys.length > 2) {
              _.set(elemLastUpdateDate, '$gte', new Date(startKeys[2]).toISOString());
            }
          }
        }
        if (endKeys && endKeys.length > 1) {
          if (_.isEqual(endKeys[1], 'quickQuote')) {
            caseQuick = true;
            if (endKeys && endKeys.length > 2) {
              _.set(elemLastUpdateDate, '$lte', new Date(endKeys[2]).toISOString());
            }
            if (endKeys && endKeys.length > 3) {
              _.set(elemPCid, '$lte', endKeys[3]);
            }
          }
          if (_.isEqual(endKeys[1], 'quotation')) {
            caseQuot = true;
            if (endKeys && endKeys.length > 2) {
              _.set(elemLastUpdateDate, '$lte', new Date(endKeys[2]).toISOString());
            }
          }
        }
        if (!_.isEmpty(elemLastUpdateDate)) {
          _.get(matchStr, '$match.$and', []).push(
            {
              lastUpdateDate: elemLastUpdateDate,
            },
          );
        }
        if (!_.isEmpty(elemPCid)) {
          _.get(matchStr, '$match.$and', []).push(
            {
              pCid: elemPCid,
            },
          );
        }
      }
    }
  } else if (keys !== '') {
    const keysList = JSON.parse(keys);
    const inArray = [];
    if (keysList && keysList.length > 0) {
      _.forEach(keysList, (keyItem) => {
        if (keyItem && keyItem.length > 1) {
          if (_.isEqual(keyItem[1], 'quickQuote')) {
            const temp = {};
            const tempWhere = {};
            caseQuick = true;
            if (keyItem && keyItem.length > 2) {
              _.set(tempWhere, 'lastUpdateDate', new Date(keyItem[2]).toISOString());
              _.set(temp, 'lastUpdateDate', keyItem[2]);
            }
            if (keyItem && keyItem.length > 3) {
              _.set(tempWhere, 'pCid', keyItem[3]);
              _.set(temp, 'pCid', keyItem[3]);
            }
            if (!_.isEmpty(tempWhere)) {
              inArray.push(tempWhere);
            }
            if (!_.isEmpty(temp)) {
              quickKeys.push(temp);
            }
          }
          if (_.isEqual(keyItem[1], 'quotation')) {
            caseQuot = true;
            if (keyItem && keyItem.length > 2) {
              quotKeys.push(keyItem[2]);
              inArray.push({
                lastUpdateDate: new Date(keyItem[2]).toISOString(),
              });
            }
          }
        }
      });
    }
    if (!_.isEmpty(inArray)) {
      _.get(matchStr, '$match.$and', []).push(
        {
          $or: inArray,
        },
      );
    }
  } else if (key !== '' && key !== '[null]') {
    const keyJson = JSON.parse(key);
    if (keyJson && keyJson.length > 1) {
      if (_.isEqual(keyJson[1], 'quickQuote')) {
        caseQuick = true;
        const temp = {};
        if (keyJson.length > 2) {
          _.set(temp, 'lastUpdateDate', keyJson[2]);
          _.get(matchStr, '$match.$and', []).push(
            {
              lastUpdateDate: new Date(keyJson[2]).toISOString(),
            },
          );
        }
        if (keyJson.length > 3) {
          _.set(temp, 'pCid', keyJson[3]);
          _.get(matchStr, '$match.$and', []).push(
            {
              pCid: keyJson[3],
            },
          );
        }
        if (!_.isEmpty(temp)) {
          quickKeys.push(temp);
        }
      }
      if (_.isEqual(keyJson[1], 'quotation')) {
        caseQuot = true;
        if (keyJson.length > 2) {
          quotKeys.push(keyJson[2]);
          _.get(matchStr, '$match.$and', []).push(
            {
              lastUpdateDate: new Date(keyJson[2]).toISOString(),
            },
          );
        }
      }
    }
  } else {
    caseQuick = true;
    caseQuot = true;
  }
  let result = [];
  if (caseQuick || caseQuot) {
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { lastUpdateDate: 1, pCid: 1 } });
    }
    aggregateStr.push(projectStr);
    const quickResult = [];
    const quotResult = [];
    const emitResult = await mongoose.connection.collection('quotation').aggregate(aggregateStr).toArray();
    if (emitResult && emitResult.length > 0) {
      _.forEach(emitResult, (item) => {
        const quotCreateDate = _.get(item, 'value.quotCreateDate');
        const clientId = _.get(item, 'value.clientId');
        const quickQuote = _.get(item, 'quickQuote', false);
        if (quickQuote && caseQuick && (_.isEmpty(quickKeys) || (!_.isEmpty(quickKeys)
         && _.some(quickKeys, it => (it.pCid === clientId
           && new Date(it.lastUpdateDate).toISOString() === quotCreateDate))))) {
          const doc = _.omit(item, ['quickQuote']);
          _.set(doc, 'key', ['01', 'quickQuote', new Date(quotCreateDate).getTime(), clientId]);
          quickResult.push(doc);
        }
        if (!quickQuote && caseQuot && (_.isEmpty(quotKeys) || (!_.isEmpty(quotKeys)
        && _.some(quotKeys, it => (new Date(it).toISOString() === quotCreateDate))))) {
          const doc = _.omit(item, ['quickQuote']);
          _.set(doc, 'key', ['01', 'quotation', new Date(quotCreateDate).getTime()]);
          quotResult.push(doc);
        }
      });
    }
    result = _.concat(quickResult, quotResult);
  }
  return result;
};
const webVsIosReportApplication = async (req) => {
  var now = Date.now();
  const aggregateStr = [];
  const projectStr = {
    $project: {
      _id: 0, // 0 is not selected
      id: '$id',
      key: [],
      value: {
        applicationCreateDate: '$applicationStartedDate',
        applicationSubmittedDate: '$applicationSubmittedDate',
        quotCreateDate: '$quotation.createDate',
        baseProductName: '$quotation.baseProductName.en',
        policyNumber: '$policyNumber',
        quotationDocId: '$quotation.id',
        applicationDocId: '$id',
        id: '$id',
        quotProposerName: '$quotation.pFullName',
        quotLAName: '$quotation.iFullName',
        iCidMapping: '$iCidMapping',
      },
    },
  };
  let canSearch = false;
  const startKey = req.query.startkey || '';
  const endKey = req.query.endkey || '';
  const keys = req.query.keys || '';
  const key = req.query.key || '';
  const matchStr = {
    $match: {
      $and: [
        {
          $or: [
            { type: 'application' },
            { type: 'masterApplication' },
          ],
        },
      ],
    },
  };

  if (startKey !== '' && endKey !== '') {
    const startKeys = JSON.parse(startKey);
    const endKeys = JSON.parse(endKey);
    if (startKeys || endKeys) {
      if (_.isEqual(startKeys, endKeys)) {
        if (startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'application')) {
            canSearch = true;
            if (startKeys.length > 2) {
              _.get(matchStr, '$match.$and', []).push(
                {
                  applicationStartedDate: new Date(startKeys[2]).toISOString(),
                },
              );
            }
          }
        }
      } else {
        const elemDate = {};
        if (startKeys && startKeys.length > 1) {
          if (_.isEqual(startKeys[1], 'application')) {
            canSearch = true;
            if (startKeys && startKeys.length > 2) {
              _.set(elemDate, '$gte', new Date(startKeys[2]).toISOString());
            }
          }
        }
        if (endKeys && endKeys.length > 1) {
          if (_.isEqual(endKeys[1], 'application')) {
            canSearch = true;
            if (endKeys && endKeys.length > 2) {
              _.set(elemDate, '$lte', new Date(endKeys[2]).toISOString());
            }
          }
        }
        if (!_.isEmpty(elemDate)) {
          _.get(matchStr, '$match.$and', []).push(
            {
              applicationStartedDate: elemDate,
            },
          );
        }
      }
    }
  } else if (keys !== '') {
    const keysList = JSON.parse(keys);
    const inArray = [];
    if (keysList && keysList.length > 0) {
      _.forEach(keysList, (keyItem) => {
        if (keyItem && keyItem.length > 1) {
          if (_.isEqual(keyItem[1], 'application')) {
            const tempWhere = {};
            canSearch = true;
            if (keyItem && keyItem.length > 2) {
              _.set(tempWhere, 'applicationStartedDate', new Date(keyItem[2]).toISOString());
            }
            if (!_.isEmpty(tempWhere)) {
              inArray.push(tempWhere);
            }
          }
        }
      });
    }
    if (!_.isEmpty(inArray)) {
      _.get(matchStr, '$match.$and', []).push(
        {
          $or: inArray,
        },
      );
    }
  } else if (key !== '' && key !== '[null]') {
    const keyJson = JSON.parse(key);
    if (keyJson && keyJson.length > 1) {
      if (_.isEqual(keyJson[1], 'application')) {
        canSearch = true;
        if (keyJson.length > 2) {
          _.get(matchStr, '$match.$and', []).push(
            {
              applicationStartedDate: new Date(keyJson[2]).toISOString(),
            },
          );
        }
      }
    }
  } else {
    canSearch = true;
  }
  const result = [];
  if (canSearch) {
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>  matchStr ', JSON.stringify(matchStr));
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { applicationStartedDate: 1 } });
    }
    aggregateStr.push(projectStr);

    const emitResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    if (emitResult && emitResult.length > 0) {
      _.forEach(emitResult, (item) => {
        const applicationCreateDate = _.get(item, 'value.applicationCreateDate');
        const doc = _.cloneDeep(item);
        _.set(doc, 'key', ['01', 'application', new Date(applicationCreateDate).getTime()]);
        result.push(doc);
      });
    }

    const emitShieldResult = await mongoose.connection.collection('shieldApplication').aggregate(aggregateStr).toArray();
    if (emitShieldResult && emitShieldResult.length > 0) {
      _.forEach(emitShieldResult, (item) => {
        const applicationCreateDate = _.get(item, 'value.applicationCreateDate');
        const doc = _.cloneDeep(item);
        _.set(doc, 'key', ['01', 'application', new Date(applicationCreateDate).getTime()]);
        result.push(doc);
      });
    }
  }
  return result;
};
const webVsIosReportAgents = async (req) => {
  var now = Date.now();
  const aggregateStr = [];
  // This is the query result and alias -> projectStr
  const projectStr = {
    $project: {
      _id: 0, // 0 is not selected
      id: '$id',
      key: ['01', 'agents'],
      value: {
        agentCode: '$agentCode',
        agentName: '$name',
        managerCode: '$managerCode',
        channel: '$channel',
        upline2Code: '$rawData.upline2Code',
      },
    },
  };

  const startKey = req.query.startkey || '';
  const endKey = req.query.endkey || '';
  const keys = req.query.keys || '';
  const key = req.query.key || '';
  const matchStr = {
    $match: {
      type: 'agent',
    },
  };
  let canSearch = false;
  if (startKey !== '' && endKey !== '') {
    const startKeys = JSON.parse(startKey);
    const endKeys = JSON.parse(endKey);
    if (startKeys || endKeys) {
      if (_.isEqual(startKeys, endKeys)) {
        if (startKeys.length > 1) {
          if (_.isEqual('agents', startKeys[1])) {
            canSearch = true;
          }
        }
      } else {
        if (startKeys && startKeys.length > 1) {
          if (_.isEqual('agents', startKeys[1])) {
            canSearch = true;
          }
        }

        if (endKeys && endKeys.length > 1) {
          if (_.isEqual('agents', endKeys[1])) {
            canSearch = true;
          }
        }
      }
    }
  } else if (keys !== '') {
    const keysList = JSON.parse(keys);
    const inArray = [];
    if (keysList && keysList.length > 0) {
      _.forEach(keysList, (keyItem) => {
        if (keyItem && keyItem.length > 1) {
          if (_.isEqual('agents', keyItem[1])) {
            canSearch = true;
          }
        }
      });
    }
    if (!_.isEmpty(inArray)) {
      _.set(matchStr, '$match.type', { $in: inArray });
    }
  } else if (key !== '' && key !== '[null]') {
    const keyJson = JSON.parse(key);
    if (keyJson && keyJson.length > 1) {
      if (_.isEqual('agents', keyJson[1])) {
        canSearch = true;
      }
    }
  } else {
    canSearch = true;
  }
  if (canSearch) {
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { agentCode: 1 } });
    }
    aggregateStr.push(projectStr);
    const result = await mongoose.connection.collection('agent').aggregate(aggregateStr).toArray();
    return result;
  }
  return [];
};
const webVsIosReportCust = async (req) => {
  var now = Date.now();
  const aggregateStr = [];
  // This is the query result and alias -> projectStr
  const projectStr = {
    $project: {
      _id: 0, // 0 is not selected
      id: '$id',
      key: [],
      bundle: '$bundle',
      fullName: '$fullName',
    },
  };

  const startKey = req.query.startkey || '';
  const endKey = req.query.endkey || '';
  const keys = req.query.keys || '';
  const key = req.query.key || '';
  const matchStr = {
    $match: {
      $and: [
        { type: 'cust' },
        { bundle: { $exists: true } },
      ],
    },
  };
  let canSearch = false;
  let rangeCase = false;
  const startEnd = {};
  const bundleIdKeys = [];
  if (startKey !== '' && endKey !== '') {
    const startKeys = JSON.parse(startKey);
    const endKeys = JSON.parse(endKey);
    if (startKeys || endKeys) {
      if (_.isEqual(startKeys, endKeys)) {
        if (startKeys.length > 1) {
          if (_.isEqual('bundleInCustomer', startKeys[1])) {
            canSearch = true;
          }
          if (startKeys.length > 2) {
            bundleIdKeys.push(startKeys[2]);
            _.get(matchStr, '$match.$and', []).push(
              {
                bundle: { $elemMatch: { id: startKeys[2] } },
              },
            );
          }
        }
      } else {
        const elemStr = {};
        let whereBundle = {};
        if (startKeys && startKeys.length > 1) {
          if (_.isEqual('bundleInCustomer', startKeys[1])) {
            canSearch = true;
          }
          if (startKeys && startKeys.length > 2) {
            rangeCase = true;
            _.set(startEnd, 'start', startKeys[2]);
            _.set(elemStr, '$elemMatch.id.$gte', startKeys[2]);
          }
        }
        if (endKeys && endKeys.length > 1) {
          if (_.isEqual('bundleInCustomer', endKeys[1])) {
            canSearch = true;
          }
          if (endKeys && endKeys.length > 2) {
            rangeCase = true;
            _.set(startEnd, 'end', endKeys[2]);
            _.set(elemStr, '$elemMatch.id.$lte', endKeys[2]);
          }
        }

        if (!_.isEmpty(elemStr)) {
          whereBundle = {
            bundle: elemStr,
          };
        }
        if (!_.isEmpty(whereBundle)) {
          _.get(matchStr, '$match.$and', []).push(
            whereBundle,
          );
        }
      }
    }
  } else if (keys !== '') {
    const keysList = JSON.parse(keys);
    const inArray = [];
    if (keysList && keysList.length > 0) {
      _.forEach(keysList, (keyItem) => {
        if (keyItem && keyItem.length > 1) {
          if (_.isEqual('bundleInCustomer', keyItem[1])) {
            canSearch = true;
          }
          if (keyItem.length > 2) {
            bundleIdKeys.push(keyItem[2]);
            inArray.push({
              bundle: { $elemMatch: { id: keyItem[2] } },
            });
          }
        }
      });
    }
    if (!_.isEmpty(inArray)) {
      _.get(matchStr, '$match.$and', []).push(
        {
          $or: inArray,
        },
      );
    }
  } else if (key !== '' && key !== '[null]') {
    const keyJson = JSON.parse(key);
    if (keyJson && keyJson.length > 1) {
      if (_.isEqual('bundleInCustomer', keyJson[1])) {
        canSearch = true;
      }
      if (keyJson.length > 2) {
        bundleIdKeys.push(keyJson[2]);
        _.get(matchStr, '$match.$and', []).push(
          {
            bundle: { $elemMatch: { id: keyJson[2] } },
          },
        );
      }
    }
  } else {
    canSearch = true;
  }
  const result = [];
  if (canSearch) {
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { agentCode: 1 } });
    }
    aggregateStr.push(projectStr);
    const emitResult = await mongoose.connection.collection('customer').aggregate(aggregateStr).toArray();
    if (emitResult && emitResult.length > 0) {
      const start = _.get(startEnd, 'start', '');
      const end = _.get(startEnd, 'end', '');
      _.forEach(emitResult, (doc) => {
        const bundles = _.get(doc, 'bundle', []);
        const fullName = _.get(doc, 'fullName');
        let initialBundleId;
        _.forEach(bundles, (bundle, index) => {
          if (index === 0) {
            initialBundleId = bundle.id;
          }
          if (
            _.isEmpty(bundleIdKeys)
            || (!_.isEmpty(bundleIdKeys)
            && _.indexOf(bundleIdKeys, bundle.id) > -1)
          ) {
            if (!rangeCase || (rangeCase && !_.isEmpty(startEnd) && (
              (start !== '' && bundle.id >= start) || start === ''
            ) && (end === '' || (end !== '' && bundle.id <= end)))) {
              result.push({
                id: doc.id,
                key: ['01', 'bundleInCustomer', bundle.id],
                value: {
                  initialBundleId,
                  mappedBundleId: bundle.id,
                  fullName,
                },
              });
            }
          }
        });
      });
    }
  }
  return result;
};
exports.api = {
  agentsDetail(req, res) {
    var now = Date.now();
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', 'agents'],
        value: {
          agentCode: '$agentCode',
          agentName: '$name',
          managerCode: '$managerCode',
          channel: '$channel',
          upline1Code: '$rawData.upline1Code',
          upline2Code: '$rawData.upline2Code',
          profileId: '$profileId',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    let canSearch = false;
    const matchStr = {
      $match: {
        type: 'agent',
      },
    };

    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            if (startKeys[1] === 'agents') {
              canSearch = true;
            }
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            if (keyItem[1] === 'agents') {
              canSearch = true;
            }
          }
        });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        if (keyJson[1] === 'agents') {
          canSearch = true;
        }
      }
    } else {
      canSearch = true;
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { agentCode: 1 } });
    }
    aggregateStr.push(projectStr);
    if (canSearch) {
      mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
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
    } else {
      const resultTemp = {};
      resultTemp.total_rows = 0;
      resultTemp.rows = [];
      printlnEndLog(0, now, req);
      res.json(resultTemp);
    }
  },
  allChannelAppCases(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          id: '$id',
          parentId: '$parentId',
          policyNumber: '$policyNumber',
          type: '$type',
          applicationSubmittedDate: null,
          applicationStartedDate: null,
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
          premiumFrequency: { $cond: { if: '$quotation', then: '$quotation.paymentMode', else: null } },
          agentName: { $cond: { if: '$quotation.agent', then: '$quotation.agent.name', else: null } },
          currency: { $cond: { if: '$quotation', then: '$quotation.ccy', else: null } },
          channel: { $cond: { if: '$quotation.agent', then: '$quotation.agent.dealerGroup', else: null } },
          riskProfile: { $cond: { if: '$quotation.extraFlags.fna', then: '$quotation.extraFlags.fna.riskProfile', else: null } },
          rop: { $cond: { if: '$quotation.clientChoice.recommendation.rop', then: '$quotation.clientChoice.recommendation.rop.choiceQ1', else: null } },
          pDocType: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.idDocType', else: null } },
          pDocTypeOther: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.idDocTypeOther', else: null } },
          proposerIc: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.idCardNo', else: null } },
          proposerName: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.fullName', else: null } },
          proposerMobileCountryCode: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.mobileCountryCode', else: null } },
          proposerMobileNo: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.mobileNo', else: null } },
          proposerEmailAddress: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.email', else: null } },
          dob: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.dob', else: null } },
          educationLevel: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.education', else: null } },
          language: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.language', else: null } },
          pAge: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.pAge', else: null } },
          languageOther: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.languageOther', else: null } },
          dateOfRoadshow: { $cond: { if: '$applicationForm.values.proposer.declaration', then: '$applicationForm.values.proposer.declaration.ROADSHOW02', else: null } },
          venue: { $cond: { if: '$applicationForm.values.proposer.declaration', then: '$applicationForm.values.proposer.declaration.ROADSHOW03', else: null } },
          trustedIndividualName: { $cond: { if: '$applicationForm.values.proposer.declaration.trustedIndividuals', then: '$applicationForm.values.proposer.declaration.trustedIndividuals.fullName', else: null } },
          trustedIndividualMobileNo: { $cond: { if: '$applicationForm.values.proposer.declaration.trustedIndividuals', then: '$applicationForm.values.proposer.declaration.trustedIndividuals.mobileNo', else: null } },
          trustedIndividualMobileCountryCode: { $cond: { if: '$applicationForm.values.proposer.declaration.trustedIndividuals', then: '$applicationForm.values.proposer.declaration.trustedIndividuals.mobileCountryCode', else: null } },
          insDocType: null,
          insDocTypeOther: null,
          lifeAssuredIc: null,
          lifeAssuredName: null,
          plans: null,
          paymentMethod: { $cond: { if: '$payment', then: '$payment.initPayMethod', else: null } },
          cid: { $cond: { if: '$applicationForm.values.proposer.personalInfo', then: '$applicationForm.values.proposer.personalInfo.cid', else: null } },
          fnId: null,
          agentCode: { $cond: { if: '$quotation.agent', then: '$quotation.agent.agentCode', else: null } },
          productLine: { $cond: { if: '$quotation', then: '$quotation.productLine', else: null } },
          rspAmount: { $cond: { if: '$quotation.policyOptionsDesc', then: '$quotation.policyOptionsDesc.rspAmount', else: null } },
          rspPayFreq: { $cond: { if: '$quotation.policyOptionsDesc', then: '$quotation.policyOptionsDesc.rspPayFreq', else: null } },
        },
        bundle: '$applicationForm.values.proposer.personalInfo.bundle',
        insured: '$applicationForm.values.insured',
        ccy: '$applicationForm.values.planDetails.ccy',
        planList: '$applicationForm.values.planDetails.planList',
        applicationSubmittedDate: '$applicationSubmittedDate',
        applicationStartedDate: '$applicationStartedDate',
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        $and: [
          {
            applicationStartedDate: { $exists: true, $ne: 0 },
          },
        ],
      },
    };
    let caseAppId = false;
    let caseAppStartDate = false;
    let caseAppSubmissionDate = false;
    let fullCase = false;
    const appIdKeys = [];
    const appStartKeys = [];
    const appSubKeys = [];
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual('applicationId', startKeys[1])) {
            caseAppId = true;
            if (startKeys && startKeys.length > 2) {
              appIdKeys.push(startKeys[2]);
              _.get(matchStr, '$match.$and', []).push({
                id: startKeys[2],
              });
            }
          }
          if (_.isEqual('appStartDate', startKeys[1])) {
            caseAppStartDate = true;
            if (startKeys && startKeys.length > 2) {
              appStartKeys.push(startKeys[2]);
              _.get(matchStr, '$match.$and', []).push({
                $or: [
                  { applicationStartedDate: new Date(startKeys[2]).toISOString() },
                  { applicationStartedDate: startKeys[2] },
                ],

              });
            }
          }
          if (_.isEqual('appSubmissionDate', startKeys[1])) {
            caseAppSubmissionDate = true;
            if (startKeys && startKeys.length > 2) {
              appSubKeys.push(startKeys[2]);
              _.get(matchStr, '$match.$and', []).push({
                $or: [
                  { applicationSubmittedDate: new Date(startKeys[2]).toISOString() },
                  { applicationSubmittedDate: startKeys[2] },
                ],
              });
            }
          }
        } else {
          const appIdTemp = {};
          const startTemp = {};
          const submissionTemp = {};
          const startTempN = {};
          const submissionTempN = {};
          if (_.isEqual('applicationId', startKeys[1])) {
            caseAppId = true;
            if (startKeys && startKeys.length > 2) {
              _.set(appIdTemp, '$gte', startKeys[2]);
            }
          }
          if (_.isEqual('applicationId', endKeys[1])) {
            caseAppId = true;
            if (endKeys && endKeys.length > 2) {
              _.set(appIdTemp, '$lte', endKeys[2]);
            }
          }
          if (_.isEqual('appStartDate', startKeys[1])) {
            caseAppStartDate = true;
            if (startKeys && startKeys.length > 2) {
              _.set(startTemp, '$gte', new Date(startKeys[2]).toISOString());
              _.set(startTempN, '$gte', startKeys[2]);
            }
          }
          if (_.isEqual('appStartDate', endKeys[1])) {
            caseAppStartDate = true;
            if (endKeys && endKeys.length > 2) {
              _.set(startTemp, '$lte', new Date(endKeys[2]).toISOString());
              _.set(startTempN, '$lte', endKeys[2]);
            }
          }
          if (_.isEqual('appSubmissionDate', startKeys[1])) {
            caseAppSubmissionDate = true;
            if (startKeys && startKeys.length > 2) {
              _.set(submissionTemp, '$gte', new Date(startKeys[2]).toISOString());
              _.set(submissionTempN, '$gte', startKeys[2]);
            }
          }
          if (_.isEqual('appSubmissionDate', endKeys[1])) {
            caseAppSubmissionDate = true;
            if (endKeys && endKeys.length > 2) {
              _.set(submissionTemp, '$lte', new Date(endKeys[2]).toISOString());
              _.set(submissionTempN, '$lte', endKeys[2]);
            }
          }
          if (!_.isEmpty(appIdTemp)) {
            _.get(matchStr, '$match.$and', []).push({
              id: appIdTemp,
            });
          }
          if (!_.isEmpty(startTemp)) {
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                { applicationStartedDate: startTemp },
                { applicationStartedDate: startTempN },
              ],
            });
          }
          if (!_.isEmpty(submissionTemp)) {
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                { applicationSubmittedDate: submissionTemp },
                { applicationSubmittedDate: submissionTempN },
              ],
            });
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            if (_.isEqual('applicationId', keyItem[1])) {
              caseAppId = true;
              if (keyItem && keyItem.length > 2) {
                appIdKeys.push(keyItem[2]);
                inArray.push({
                  id: keyItem[2],
                });
              }
            }
            if (_.isEqual('appStartDate', keyItem[1])) {
              caseAppStartDate = true;
              if (keyItem && keyItem.length > 2) {
                appStartKeys.push(keyItem[2]);
                inArray.push({
                  applicationStartedDate: new Date(keyItem[2]).toISOString(),
                });
                inArray.push({
                  applicationStartedDate: keyItem[2],
                });
              }
            }
            if (_.isEqual('appSubmissionDate', keyItem[1])) {
              caseAppSubmissionDate = true;
              if (keyItem && keyItem.length > 2) {
                appSubKeys.push(keyItem[2]);
                inArray.push({
                  applicationSubmittedDate: new Date(keyItem[2]).toISOString(),
                });
                inArray.push({
                  applicationSubmittedDate: keyItem[2],
                });
              }
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push({
          $or: inArray,
        });
        // matchStr.$match = { policyNumber: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        if (_.isEqual('applicationId', keyJson[1])) {
          caseAppId = true;
          if (keyJson && keyJson.length > 2) {
            appIdKeys.push(keyJson[2]);
            _.get(matchStr, '$match.$and', []).push({
              id: keyJson[2],
            });
          }
        }
        if (_.isEqual('appStartDate', keyJson[1])) {
          caseAppStartDate = true;
          if (keyJson && keyJson.length > 2) {
            appStartKeys.push(new Date(keyJson[2]).toISOString());
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                { applicationStartedDate: new Date(keyJson[2]).toISOString() },
                { applicationStartedDate: keyJson[2] },
              ],
            });
          }
        }
        if (_.isEqual('appSubmissionDate', keyJson[1])) {
          caseAppSubmissionDate = true;
          if (keyJson && keyJson.length > 2) {
            appSubKeys.push(new Date(keyJson[2]).toISOString());
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                { applicationSubmittedDate: new Date(keyJson[2]).toISOString() },
                { applicationSubmittedDate: keyJson[2] },
              ],
            });
          }
        }
      }
    } else {
      caseAppId = true;
      caseAppStartDate = true;
      caseAppSubmissionDate = true;
      fullCase = true;
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    const sortStr = {};
    if (!fullCase) {
      if (caseAppId) {
        _.set(sortStr, 'id', 1);
      }
      if (caseAppStartDate) {
        _.set(sortStr, 'applicationStartedDate', 1);
      }
      if (caseAppSubmissionDate) {
        _.set(sortStr, 'applicationSubmittedDate', 1);
      }
      if (!_.isEmpty(sortStr)) {
        if (CAN_ORDER) {
          aggregateStr.push({ $sort: sortStr });
        }
      }
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    const cerateRow = (doc) => {
      const insured = _.get(doc, 'insured', []);
      const applicationSubmittedDate = _.get(doc, 'applicationSubmittedDate');
      if (applicationSubmittedDate) {
        _.set(doc, 'value.applicationSubmittedDate', new Date(applicationSubmittedDate).getTime());
      }
      const applicationStartedDate = _.get(doc, 'applicationStartedDate');
      _.set(doc, 'value.applicationStartedDate', new Date(applicationStartedDate).getTime());
      if (!_.isEmpty(insured)) {
        const insuredTemp = insured[0];
        if (insuredTemp && insuredTemp) {
          const personalInfo = _.get(insuredTemp, 'personalInfo', {});
          if (!_.isEmpty(personalInfo)) {
            _.set(doc, 'value.lifeAssuredIc', _.get(personalInfo, 'idCardNo', ''));
            _.set(doc, 'value.lifeAssuredName', _.get(personalInfo, 'fullName', ''));
            _.set(doc, 'value.insDocType', _.get(personalInfo, 'idDocType', ''));
            _.set(doc, 'value.insDocTypeOther', _.get(personalInfo, 'idDocTypeOther'));
          }
        }
      }
      const ccy = _.get(doc, 'ccy');
      if (!_.get(doc, 'value.currency')) {
        _.set(doc, 'value.currency', ccy);
      }
      const planList = _.get(doc, 'planList', []);
      if (!_.isEmpty(planList)) {
        const plansTemp = [];
        _.forEach(planList, (plan) => {
          plansTemp.push({
            covName: _.get(plan, 'covName'),
            sumInsured: _.get(plan, 'sumInsured'),
            premium: _.get(plan, 'premium'),
          });
        });
        _.set(doc, 'value.plans', plansTemp);
      }
      const bundle = _.get(doc, 'bundle', []);
      if (!_.isEmpty(bundle)) {
        let fnId = null;
        _.forEach(bundle, (it) => {
          if (it.isValid) {
            fnId = it.id;
          }
        });
        _.set(doc, 'value.fnId', fnId);
      }
      return _.omit(doc, ['bundle', 'insured', 'ccy', 'planList', 'applicationSubmittedDate', 'applicationStartedDate']);
    };
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const appIdResult = [];
        const appStartResult = [];
        const appSubResult = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const applicationSubmittedDate = _.get(item, 'applicationSubmittedDate');
            const applicationStartedDate = _.get(item, 'applicationStartedDate');
            if (caseAppId && (_.isEmpty(appIdKeys)
            || (!_.isEmpty(appIdKeys) && _.some(appIdKeys, it => (it === item.id))
            ))) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'applicationId', doc.id]);
              appIdResult.push(cerateRow(doc));
            }
            if (caseAppStartDate && (_.isEmpty(appStartKeys)
            || (!_.isEmpty(appStartKeys)
            && _.some(appStartKeys, it => (it === applicationStartedDate
              || new Date(it).toISOString() === applicationStartedDate))
            ))) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'appStartDate', new Date(applicationStartedDate).getTime()]);
              appStartResult.push(cerateRow(doc));
            }
            if (caseAppSubmissionDate && applicationSubmittedDate && (_.isEmpty(appSubKeys)
            || (!_.isEmpty(appSubKeys)
            && _.some(appSubKeys, it => (it === applicationSubmittedDate
              || new Date(it).toISOString() === applicationSubmittedDate))
            ))) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'appSubmissionDate', new Date(applicationSubmittedDate).getTime()]);
              appSubResult.push(cerateRow(doc));
            }
          });
        }
        const result = _.concat(appIdResult, appStartResult, appSubResult);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        printlnEndLog(result.length, now, req);
        res.json(resultTemp);
      }
    });
  },
  allChannelPolicyCases(req, res) {
    // emit(['01', 'approveRejectDate', approveRejectDate], {
    //   applicationId: doc.applicationId
    // });
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          applicationId: '$applicationId',
        },
        approveRejectDate: '$approveRejectDate',
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
            approveRejectDate: { $exists: true, $ne: '' },
          },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          _.get(matchStr, '$match.$and', []).push({ approveRejectDate: new Date(startKeys[2]).toISOString() });
        } else {
          _.get(matchStr, '$match.$and', []).push({
            approveRejectDate: {
              $gte: new Date(startKeys[2]).toISOString(),
              $lte: new Date(endKeys[2]).toISOString(),
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
          if (keyItem && keyItem.length > 2) {
            inArray.push(new Date(keyItem[2]).toISOString());
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push({
          approveRejectDate: { $in: inArray },
        });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 2) {
        _.get(matchStr, '$match.$and', []).push({
          approveRejectDate: new Date(keyJson[2]).toISOString(),
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (CAN_ORDER) {
      aggregateStr.push({ $sort: { approveRejectDate: 1 } });
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('approval').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const approveRejectDate = _.get(doc, 'approveRejectDate');
            if (approveRejectDate && approveRejectDate !== '') {
              _.set(doc, 'key', ['01', 'approveRejectDate', new Date(approveRejectDate).getTime()]);
              result.push(_.omit(doc, ['approveRejectDate']));
            }
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        printlnEndLog(result.length, now, req);
        res.json(resultTemp);
      }
    });
  },
  async webvsiosReport(req, res) {
    const emitBundleResult = await webVsIosReportBundle(req);
    const emitQuotResult = await webVsIosReportQuot(req);
    const emitAppResult = await webVsIosReportApplication(req);
    const emitAgentResult = await webVsIosReportAgents(req);
    const emitCustResult = await webVsIosReportCust(req);
    const result = _.concat(emitAgentResult, emitAppResult,
      emitBundleResult, emitCustResult, emitQuotResult);
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    printlnEndLog(result.length, now, req);
    res.json(resultTemp);
  },
};
