import mongoose from 'mongoose';

const _ = require('lodash');
// xue.hua
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

    const userIds = [];
    const agentIds = [];
    const fafirmCodeIds = [];
    const proxyIds = [];
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'userId')) {
            caseUser = true;
            matchStr.$match = { 'rawData.agentCode': startKeys[2] };
            userIds.push(startKeys[2]);
          }
          if (_.isEqual(startKeys[1], 'agentCode')) {
            caseAgent = true;
            matchStr.$match = { agentCode: startKeys[2] };
            agentIds.push(startKeys[2]);
          }
          if (_.isEqual(startKeys[1], 'fafirmCode')) {
            caseFafirmCode = true;
            matchStr.$match = { 'rawData.upline2Code': startKeys[2] };
            fafirmCodeIds.push(startKeys[2]);
          }
          if (_.isEqual(startKeys[1], 'proxy')) {
            caseProxy = true;
            matchStr.$match = {
              $or: [{ 'rawData.proxy1UserId': startKeys[2] }, { 'rawData.proxy2UserId': startKeys[2] }],
            };
            proxyIds.push(startKeys[2]);
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
              userIds.push(keyItem[2]);
            }
            if (_.isEqual(keyItem[1], 'agentCode')) {
              caseAgent = true;
              inArray.push({
                agentCode: keyItem[2],
              });
              agentIds.push(keyItem[2]);
            }
            if (_.isEqual(keyItem[1], 'fafirmCode')) {
              caseFafirmCode = true;
              inArray.push({
                'rawData.upline2Code': keyItem[2],
              });
              fafirmCodeIds.push(keyItem[2]);
            }
            if (_.isEqual(keyItem[1], 'proxy')) {
              caseProxy = true;
              inArray.push({
                'rawData.proxy1UserId': keyItem[2],
              });
              inArray.push({
                'rawData.proxy2UserId': keyItem[2],
              });
              proxyIds.push(keyItem[2]);
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
              if (_.isEmpty(userIds)
              || (!_.isEmpty(userIds) && _.indexOf(userIds, doc.rawData.agentCode) > -1)) {
                if (doc.rawData) {
                  userResult.push({
                    id: doc.id,
                    key: ['01', 'userId', doc.rawData.agentCode],
                    value: Object.assign({}, doc),
                  });
                }
              }
            }
            if (caseAgent) {
              const doc = _.cloneDeep(item);
              if (_.isEmpty(agentIds)
              || (!_.isEmpty(agentIds) && _.indexOf(agentIds, doc.agentCode) > -1)) {
                agentResult.push({
                  id: doc.id,
                  key: ['01', 'agentCode', doc.agentCode],
                  value: Object.assign({}, doc),
                });
              }
            }
            if (caseFafirmCode) {
              if ((item.channel === 'BROKER' || item.channel === 'SYNERGY') && item.rawData && item.rawData.upline2Code) {
                const doc = _.cloneDeep(item);
                if (_.isEmpty(fafirmCodeIds)
                || (!_.isEmpty(fafirmCodeIds)
                 && _.indexOf(fafirmCodeIds, doc.rawData.upline2Code) > -1)) {
                  fafirmCodeResult.push({
                    id: doc.id,
                    key: ['01', 'fafirmCode', doc.rawData.upline2Code],
                    value: Object.assign({}, doc),
                  });
                }
              }
            }
            if (caseProxy) {
              if (item.rawData && item.rawData.proxy1UserId) {
                if (_.isEmpty(proxyIds)
                || (!_.isEmpty(proxyIds)
                 && _.indexOf(proxyIds, item.rawData.proxy1UserId) > -1)) {
                  proxy1Result.push({
                    id: item.id,
                    key: ['01', 'proxy', item.rawData.proxy1UserId],
                    value: {
                      agentCode: item.agentCode,
                    },
                  });
                }
              }
              if (item.rawData && item.rawData.proxy2UserId) {
                if (_.isEmpty(proxyIds)
                || (!_.isEmpty(proxyIds)
                 && _.indexOf(proxyIds, item.rawData.proxy2UserId) > -1)) {
                  proxy2Result.push({
                    id: item.id,
                    key: ['01', 'proxy', item.rawData.proxy2UserId],
                    value: {
                      agentCode: item.agentCode,
                    },
                  });
                }
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
  agentWithDescendingOrder(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        email: '$email',
        tel: '$tel',
        agentCode: '$agentCode',
        agentName: '$name',
        mobile: '$mobile',
        manager: '$manager',
        managerCode: '$managerCode',
        compCode: '$compCode',
        company: '$company',
        faAdminCode: '',
        profileId: '$profileId',
        lstChgDate: '$lstChgDate',
        lastUpdateDate: '$lastUpdateDate',
        faAdvisorRole: '$rawData.faAdvisorRole',
        upline2Code: '$rawData.upline2Code',
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const descending = req.query.descending || false;
    // console.log('>>>>> descending ', descending);
    // const key = req.query.key || '';
    const matchStr = {
    };
    let caseTime = false;
    let caseAgent = false;
    const fistAgent = [];
    const fistTime = [];
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      const orInArray = [];
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'timeFirst')) {
            caseTime = true;
            orInArray.push(
              {
                $and: [
                  {
                    lstChgDate: {
                      $exists: true,
                    },
                  },
                  {
                    lstChgDate: startKeys[2],
                  },
                ],
              },
            );
            orInArray.push(
              {
                $and: [
                  {
                    $or: [{
                      lstChgDate: {
                        $exists: false,
                      },
                    },
                    {
                      lstChgDate: '',
                    },
                    ],
                  },
                  {
                    lastUpdateDate: {
                      $exists: true,
                    },
                  },
                  {
                    lastUpdateDate: new Date(startKeys[2]).toISOString(),
                  },
                ],
              },
            );
            if (startKeys[2] === 0) {
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      $or: [{
                        lastUpdateDate: {
                          $exists: false,
                        },
                      },
                      {
                        lastUpdateDate: '',
                      },
                      ],
                    },
                  ],
                },
              );
            }
            if (startKeys.length > 3) {
              matchStr.$match = {
                agentCode: startKeys[3],
              };
            }
          }
          if (_.isEqual(startKeys[1], 'agentCodeFirst')) {
            caseAgent = true;
            matchStr.$match = {
              agentCode: startKeys[2],
            };
            if (startKeys.length > 3) {
              orInArray.push(
                {
                  $and: [
                    {
                      lstChgDate: {
                        $exists: true,
                      },
                    },
                    {
                      lstChgDate: startKeys[3],
                    },
                  ],
                },
              );
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      lastUpdateDate: {
                        $exists: true,
                      },
                    },
                    {
                      lastUpdateDate: new Date(startKeys[3]).toISOString(),
                    },
                  ],
                },
              );
            } else {
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      $or: [{
                        lastUpdateDate: {
                          $exists: false,
                        },
                      },
                      {
                        lastUpdateDate: '',
                      },
                      ],
                    },
                  ],
                },
              );
            }
          }
          if (!_.isEmpty(orInArray)) {
            _.set(matchStr, '$match.$or', orInArray);
          }
        } else { // startkey !== endkey
          if (_.isEqual(startKeys[1], 'timeFirst')) {
            caseTime = true;
            const lstChgDateTemp = {};
            const lastUpdateDateTemp = {};
            if (descending) {
              _.set(lstChgDateTemp, 'lstChgDate', {
                $lte: startKeys[2],
                $gte: endKeys[2],
              });
              const startDateTemp = startKeys[2] > 253402271999000 ? 253402271999000 : startKeys[2];
              const endDateTemp = endKeys[2] < 25139000 ? 25139000 : endKeys[2];
              _.set(lastUpdateDateTemp, 'lastUpdateDate', {
                $lte: new Date(startDateTemp).toISOString(),
                $gte: new Date(endDateTemp).toISOString(),
              });
            } else {
              _.set(lstChgDateTemp, 'lstChgDate', {
                $gte: startKeys[2],
                $lte: endKeys[2],
              });
              const startDateTemp = startKeys[2] < 25139000 ? 25139000 : startKeys[2];
              const endDateTemp = endKeys[2] > 253402271999000 ? 253402271999000 : endKeys[2];
              _.set(lastUpdateDateTemp, 'lastUpdateDate', {
                $gte: new Date(startDateTemp).toISOString(),
                $lte: new Date(endDateTemp).toISOString(),
              });
            }
            orInArray.push(
              {
                $and: [
                  {
                    lstChgDate: {
                      $exists: true,
                    },
                  },
                  lstChgDateTemp,
                ],
              },
            );
            orInArray.push(
              {
                $and: [
                  {
                    $or: [{
                      lstChgDate: {
                        $exists: false,
                      },
                    },
                    {
                      lstChgDate: '',
                    },
                    ],
                  },
                  {
                    lastUpdateDate: {
                      $exists: true,
                    },
                  },
                  lastUpdateDateTemp,
                ],
              },
            );
            if (startKeys[2] === 0 && endKeys[2] === 0) {
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      $or: [{
                        lastUpdateDate: {
                          $exists: false,
                        },
                      },
                      {
                        lastUpdateDate: '',
                      },
                      ],
                    },
                  ],
                },
              );
            }
            if (startKeys.length > 3) {
              if (descending) {
                _.set(matchStr, '$match.agentCode.$lte', startKeys[3]);
              } else {
                _.set(matchStr, '$match.agentCode.$gte', startKeys[3]);
              }
            }
            if (endKeys.length > 3) {
              if (descending) {
                _.set(matchStr, '$match.agentCode.$gte', endKeys[3]);
              } else {
                _.set(matchStr, '$match.agentCode.$lte', endKeys[3]);
              }
            }
          }
          if (_.isEqual(startKeys[1], 'agentCodeFirst')) {
            caseAgent = true;
            if (descending) {
              _.set(matchStr, '$match.agentCode.$lte', startKeys[2] === 'ZZZ' ? 'zzz' : startKeys[2]);
              _.set(matchStr, '$match.agentCode.$gte', endKeys[2]);
            } else {
              _.set(matchStr, '$match.agentCode.$gte', startKeys[2]);
              _.set(matchStr, '$match.agentCode.$lte', endKeys[2] === 'ZZZ' ? 'zzz' : endKeys[2]);
            }

            if (startKeys.length > 3 || endKeys.length > 3) {
              // 253402271999000 = 9999-12-31 23:59:59  25139000 = 1970-01-01 14:58:59
              const lstTemp = {};
              const lastUpTemp = {};
              if (startKeys.length > 3) {
                if (descending) {
                  _.set(lstTemp, 'lstChgDate.$lte', startKeys[3]);
                  const tempDate = startKeys[3] > 253402271999000 ? 253402271999000 : startKeys[3];
                  _.set(lastUpTemp, 'lastUpdateDate.$lte', new Date(tempDate).toISOString());
                } else {
                  _.set(lstTemp, 'lstChgDate.$gte', startKeys[3]);
                  const tempDate = startKeys[3] < 25139000 ? 25139000 : startKeys[3];
                  _.set(lastUpTemp, 'lastUpdateDate.$gte', new Date(tempDate).toISOString());
                }
              }
              if (endKeys.length > 3) {
                if (descending) {
                  _.set(lstTemp, 'lstChgDate.$gte', endKeys[3]);

                  const tempDate = endKeys[3] < 25139000 ? 25139000 : endKeys[3];
                  _.set(lastUpTemp, 'lastUpdateDate.$gte', new Date(tempDate).toISOString());
                } else {
                  _.set(lstTemp, 'lstChgDate.$lte', endKeys[3]);
                  const tempDate = endKeys[3] > 253402271999000 ? 253402271999000 : endKeys[3];
                  _.set(lastUpTemp, 'lastUpdateDate.$lte', new Date(tempDate).toISOString());
                }
              }
              orInArray.push(
                {
                  $and: [
                    {
                      lstChgDate: {
                        $exists: true,
                      },
                    },
                    lstTemp,
                  ],
                },
              );
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      lastUpdateDate: {
                        $exists: true,
                      },
                    },
                    lastUpTemp,
                  ],
                },
              );
              if (startKeys[3] === 0 && startKeys[3] === 0) {
                orInArray.push(
                  {
                    $and: [
                      {
                        $or: [{
                          lstChgDate: {
                            $exists: false,
                          },
                        },
                        {
                          lstChgDate: '',
                        },
                        ],
                      },
                      {
                        $or: [{
                          lastUpdateDate: {
                            $exists: false,
                          },
                        },
                        {
                          lastUpdateDate: '',
                        },
                        ],
                      },
                    ],
                  },
                );
              }
            }
          }
          if (!_.isEmpty(orInArray)) {
            _.set(matchStr, '$match.$or', orInArray);
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            const orInArray = [];
            const orTemp = {};
            if (_.isEqual(keyItem[1], 'timeFirst')) {
              caseTime = true;
              fistTime.push({
                time: keyItem[2],
                agentCode: keyItem.length > 2 ? keyItem[3] : '',
              });
              orInArray.push(
                {
                  $and: [
                    {
                      lstChgDate: {
                        $exists: true,
                      },
                    },
                    {
                      lstChgDate: keyItem[2],
                    },
                  ],
                },
              );
              orInArray.push(
                {
                  $and: [
                    {
                      $or: [{
                        lstChgDate: {
                          $exists: false,
                        },
                      },
                      {
                        lstChgDate: '',
                      },
                      ],
                    },
                    {
                      lastUpdateDate: {
                        $exists: true,
                      },
                    },
                    {
                      lastUpdateDate: new Date(keyItem[2]).toISOString(),
                    },
                  ],
                },
              );

              if (keyItem[2] === 0) {
                orInArray.push(
                  {
                    $and: [
                      {
                        $or: [{
                          lstChgDate: {
                            $exists: false,
                          },
                        },
                        {
                          lstChgDate: '',
                        },
                        ],
                      },
                      {
                        $or: [{
                          lastUpdateDate: {
                            $exists: false,
                          },
                        },
                        {
                          lastUpdateDate: '',
                        },
                        ],
                      },
                    ],
                  },
                );
              }
              if (keyItem.length > 3) {
                _.set(orTemp, 'agentCode', keyItem[3]);
              }
            }
            if (_.isEqual(keyItem[1], 'agentCodeFirst')) {
              fistAgent.push({
                agentCode: keyItem[2],
                time: keyItem.length > 2 ? keyItem[3] : '',
              });
              caseAgent = true;
              _.set(orTemp, 'agentCode', keyItem[2]);
              if (keyItem.length > 3) {
                orInArray.push(
                  {
                    $and: [
                      {
                        lstChgDate: {
                          $exists: true,
                        },
                      },
                      {
                        lstChgDate: keyItem[3],
                      },
                    ],
                  },
                );
                orInArray.push(
                  {
                    $and: [
                      {
                        $or: [{
                          lstChgDate: {
                            $exists: false,
                          },
                        },
                        {
                          lstChgDate: '',
                        },
                        ],
                      },
                      {
                        lastUpdateDate: {
                          $exists: true,
                        },
                      },
                      {
                        lastUpdateDate: new Date(keyItem[3]).toISOString(),
                      },
                    ],
                  },
                );
              } else {
                orInArray.push(
                  {
                    $and: [
                      {
                        $or: [{
                          lstChgDate: {
                            $exists: false,
                          },
                        },
                        {
                          lstChgDate: '',
                        },
                        ],
                      },
                      {
                        $or: [{
                          lastUpdateDate: {
                            $exists: false,
                          },
                        },
                        {
                          lastUpdateDate: '',
                        },
                        ],
                      },
                    ],
                  },
                );
              }
            }
            if (!_.isEmpty(orInArray)) {
              _.set(orTemp, '$or', orInArray);
            }
            if (!_.isEmpty(orTemp)) {
              inArray.push(orTemp);
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        matchStr.$match = { $or: inArray };
      }
    } else {
      caseTime = true;
      caseAgent = true;
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    if (caseTime) {
      aggregateStr.push({
        $sort: {
          lstChgDate: (descending ? -1 : 1),
          lastUpdateDate: (descending ? -1 : 1),
          agentCode: (descending ? -1 : 1),
        },
      });
    } else if (caseAgent) {
      aggregateStr.push({
        $sort: {
          agentCode: (descending ? -1 : 1),
          lstChgDate: (descending ? -1 : 1),
          lastUpdateDate: (descending ? -1 : 1),
        },
      });
    }
    aggregateStr.push(projectStr);

    const createRow = (item, keyType) => {
      const doc = _.cloneDeep(item);
      let faadminCode;
      if (_.get(doc, 'faAdvisorRole', '') !== '') {
        faadminCode = doc.upline2Code;
      }
      let lastChangedTime = _.get(doc, 'lstChgDate', '');
      const lastUpdateDate = _.get(doc, 'lastUpdateDate', '');
      if ((lastChangedTime === null || lastChangedTime === '')
         && lastUpdateDate !== '') {
        lastChangedTime = new Date(lastUpdateDate).getTime();
      } else if (!lastChangedTime) {
        lastChangedTime = 0;
      }

      const docKey = [];
      docKey.push('01');
      docKey.push(keyType);
      if (keyType === 'timeFirst') {
        docKey.push(lastChangedTime);
        docKey.push(doc.agentCode);
      } else if (keyType === 'agentCodeFirst') {
        docKey.push(doc.agentCode);
        docKey.push(lastChangedTime);
      }
      if (faadminCode) {
        _.set(doc, 'faAdminCode', faadminCode);
      }
      return {
        id: doc.id,
        key: docKey,
        value: _.omit(doc, ['lstChgDate', 'lastUpdateDate', 'faAdvisorRole', 'upline2Code']),

      };
    };
    // console.log('>>>>>>matchStr  ', JSON.stringify(matchStr));
    mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        // console.log('>>>>>> ', docs.length);
        const resultTemp = {};
        let result = [];
        const resultTime = [];
        const resultAgent = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const lstChgDate = _.get(item, 'lstChgDate', '');
            const lastUpdateDate = _.get(item, 'lastUpdateDate', '');
            if (caseTime) {
              if (_.isEmpty(fistTime) || (!_.isEmpty(fistTime)
              && _.some(fistTime, it => (
                ((it.agentCode !== '' && it.agentCode === item.agentCode) || it.agentCode === '')
                && (
                  (it.time !== ''
                   && (
                     lstChgDate === it.time
                    || (
                      lstChgDate === '' && lastUpdateDate !== ''
                    && new Date(lastUpdateDate).getTime() === it.time)))
                )
              )))) {
                resultTime.push(createRow(item, 'timeFirst'));
              }
            }
            if (caseAgent) {
              if (_.isEmpty(fistAgent) || (!_.isEmpty(fistAgent)
               && _.some(fistAgent, it => (
                 it.agentCode === item.agentCode
                 && (
                   (it.time === '' && lstChgDate === '' && lastUpdateDate === '')
                   || (it.time !== ''
                    && (
                      lstChgDate === it.time
                     || (
                       lstChgDate === '' && lastUpdateDate !== ''
                     && new Date(lastUpdateDate).getTime() === it.time)))
                 )
               )))) {
                resultAgent.push(createRow(item, 'agentCodeFirst'));
              }
            }
          });
        }
        result = _.concat(resultAgent, resultTime);
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  agents(req, res) {
    // console.log(">>>>>",req.query);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$agentCode'],
        value: {
          email: '$email',
          tel: '$tel',
          agentCode: '$agentCode',
          agentName: '$name',
          mobile: '$mobile',
          manager: '$manager',
          managerCode: '$managerCode',
          compCode: '$compCode',
          company: '$company',
          profileId: '$profileId',
          channel: '$channel',
        },
        faAdvisorRole: '$rawData.faAdvisorRole',
        upline2Code: '$rawData.upline2Code',
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
          matchStr.$match = { agentCode: startKeys[1] };
        } else {
          matchStr.$match = { agentCode: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { agentCode: { $in: inArray } };
      }
    }
    // } else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { agentCode: 1 } });
    //  console.log(" >>>>> aggregateStr=", JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('agent').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            if (_.get(doc, 'faAdvisorRole', '') !== '') {
              const upline2Code = _.get(doc, 'upline2Code', '');
              if (upline2Code !== '') {
                _.set(doc, 'value.faAdminCode', upline2Code);
              }
            }
            result.push(_.omit(doc, ['faAdvisorRole', 'upline2Code']));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  allChannelApprovalCases(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$approvalCaseId'],
        value: {
          compCode: '$compCode',
          caseNo: '$policyId',
          agentId: '$agentId',
          agentName: '$agentName',
          managerName: '$managerName',
          managerId: '$managerId',
          directorId: '$directorId',
          directorName: '$directorName',
          approveManagerId: '$approveRejectManagerId',
          approveManagerName: '$approveRejectManagerName',
          submittedDate: '$submittedDate',
          approvalStatus: '$approvalStatus',
          approvalCaseId: '$approvalCaseId',
          applicationId: '$applicationId',
          lastEditedBy: '$lastEditedBy',
          supervisorApproveRejectDate: null,
          approveRejectDate: null,
          approveRejectManagerId: '$approveRejectManagerId',
          approveRejectManagerName: '$approveRejectManagerName',
          faFirmName: '$faFirmName',
          jointFieldWorkCase: { $cond: { if: '$accept', then: '$accept.jointFieldWorkCase', else: null } },
          purposeOfJointFieldWork: { $cond: { if: '$accept', then: '$accept.jointFieldWorkCBGroup', else: null } },
          dateOfCall: { $cond: { if: '$accept', then: '$accept.callDate', else: null } },
          personContacted: { $cond: { if: '$accept', then: '$accept.contactPerson', else: null } },
          mobileNo: { $cond: { if: '$accept', then: '$accept.mobileNo', else: null } },
          mobileCountryCode: { $cond: { if: '$accept', then: '$accept.mobileCountryCode', else: null } },
          approveComment: { $cond: { if: '$accept', then: '$accept.approveComment', else: null } },
        },
        supervisorApproveRejectDate: '$supervisorApproveRejectDate',
        approveRejectDate: '$approveRejectDate',
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
          matchStr.$match = { approvalCaseId: startKeys[1] };
        } else {
          matchStr.$match = { approvalCaseId: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { approvalCaseId: { $in: inArray } };
      }
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { approvalCaseId: 1 } });
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
            const supervisorApproveRejectDate = _.get(doc, 'supervisorApproveRejectDate', '');
            if (supervisorApproveRejectDate !== '') {
              _.set(doc, 'value.supervisorApproveRejectDate', new Date(supervisorApproveRejectDate).getTime());
            }
            const approveRejectDate = _.get(doc, 'approveRejectDate', '');
            if (approveRejectDate !== '') {
              _.set(doc, 'value.approveRejectDate', new Date(approveRejectDate).getTime());
            }
            result.push(_.omit(doc, ['supervisorApproveRejectDate', 'approveRejectDate']));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  appByPolNum(req, res) {
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
    const matchStr = {
      $match: {
        policyNumber: { $exists: true, $ne: '' },
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = {
            policyNumber: startKeys[1],
          };
        } else {
          matchStr.$match = { policyNumber: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { policyNumber: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = {
          policyNumber: keyJson[1],
        };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // aggregateStr.push({ $sort: { policyNumber: 1 } });
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    //  aggregate(aggregateStr, { allowDiskUse: true }).toArray((err, docs) => {
    // { allowDiskUse: true } 排序内存不够
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const policyNumber = _.get(doc, 'policyNumber', '');
            if (policyNumber !== null && policyNumber !== '') {
              result.push({
                id: doc.id,
                key: ['01', doc.policyNumber],
                value: doc,
              });
            }
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  appWithSubmitDate(req, res) {
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
          appStatus: '$appStatus',
          policyNumber: '$policyNumber',
          type: '$type',
          isCrossAge: '$isCrossAge',
          isBackDate: '$applicationForm.values.planDetails.isBackDate',
          applicationSubmittedDate: '$applicationSubmittedDate',
          lastUpdateDate: '$applicationSubmittedDate',
          agentCode: '$quotation.agent.agentCode',
          agentName: '$quotation.agent.name',
          channel: '$quotation.agent.dealerGroup',
          premium: '$quotation.premium',
          ccy: '$quotation.ccy',
          sameAs: '$quotation.sameAs',
          paymentMode: null,
          pTrustedIndividuals: '$applicationForm.values.proposer.personalInfo.trustedIndividuals',
          pFullName: '$applicationForm.values.proposer.personalInfo.fullName',
          pLastName: '$applicationForm.values.proposer.personalInfo.lastName',
          pFirstName: '$applicationForm.values.proposer.personalInfo.firstName',
          pOthName: '$applicationForm.values.proposer.personalInfo.othName',
          pHanyuPinyinName: '$applicationForm.values.proposer.personalInfo.hanyuPinyinName',
          iFullName: null,
          iLastName: null,
          iFirstName: null,
          iOthName: null,
          iHanyuPinyinName: null,
          iUndischargedBankrupt: null,
          pUndischargedBankrupt: '$applicationForm.values.proposer.declaration.BANKRUPTCY01',
          payorSurname: '$applicationForm.values.proposer.declaration.FUND_SRC03',
          payorGivenName: '$applicationForm.values.proposer.declaration.FUND_SRC04',
          payorOtherName: '$applicationForm.values.proposer.declaration.FUND_SRC05',
          payorPinYinName: '$applicationForm.values.proposer.declaration.FUND_SRC06',
          initPayMethod: { $cond: { if: '$payment', then: '$payment.initPayMethod', else: null } },
          trxStatus: { $cond: { if: '$payment', then: '$payment.trxStatus', else: null } },
          trxNo: { $cond: { if: '$payment', then: '$payment.trxNo', else: null } },
          plans: null,
        },
        plans: '$quotation.plans',
        paymentMode: '$quotation.paymentMode',
        insured: '$applicationForm.values.insured',
        cashPortion: '$payment.cashPortion',
        quotType: '$quotation.quotType',
        planDetails: '$applicationForm.values.planDetails',
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
            applicationSubmittedDate: { $exists: true, $ne: 0 },
          },
          {
            policyNumber: { $exists: true, $ne: '' },
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
            $or: [
              { applicationSubmittedDate: new Date(startKeys[1]).toISOString() },
              { applicationSubmittedDate: startKeys[1] },
            ],
          });
        } else {
          _.get(matchStr, '$match.$and', []).push({
            $or: [
              {
                applicationSubmittedDate: {
                  $gte: new Date(startKeys[1]).toISOString(),
                  $lte: new Date(endKeys[1]).toISOString(),
                },
              },
              {
                applicationSubmittedDate: {
                  $gte: startKeys[1],
                  $lte: endKeys[1],
                },
              },
            ],
          });
          // matchStr.$match = { policyNumber: { $gte: startKeys[1], $lte: endKeys[1] } };
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 1) {
            inArray.push({
              $or: [
                { applicationSubmittedDate: new Date(keyItem[1]).toISOString() },
                { applicationSubmittedDate: keyItem[1] },
              ],
            });
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
        _.get(matchStr, '$match.$and', []).push({
          $or: [
            { applicationSubmittedDate: new Date(keyJson[1]).toISOString() },
            { applicationSubmittedDate: keyJson[1] },
          ],
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { applicationSubmittedDate: 1 } });
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const quotType = _.get(doc, 'quotType', '');
            let paymentMode = _.get(doc, 'paymentMode', '');
            if (quotType === 'SHIELD') {
              if (_.get(doc, 'cashPortion', '') === 0) {
                // initPayMethod = '-';
                _.set(doc, 'value.initPayMethod', '-');
              }
              const planDetails = _.get(doc, 'planDetails', {});
              if (!_.isEmpty(planDetails)) {
                _.set(doc, 'value.ccy', _.get(planDetails, 'ccy'));
                let premium = 0;
                const planList = _.get(planDetails, 'planList', []);
                if (!_.isEmpty(planList)) {
                  const plans = [];
                  _.forEach(planList, (plan, index) => {
                    plans.push({
                      covName: _.get(plan, 'covName'),
                      sumInsured: _.get(plan, 'sumInsured'),
                    });
                    premium += _.get(plan, 'premium', 0);
                    if (index === 0) {
                      paymentMode = _.get(plan, 'payFreq');
                    }
                  });
                  _.set(doc, 'value.plans', plans);
                }
                _.set(doc, 'value.premium', premium);
              }
            } else {
              const plans = _.get(doc, 'plans', []);
              if (!_.isEmpty(plans)) {
                const plansTemp = [];
                _.forEach(plans, (plan) => {
                  plansTemp.push({
                    covName: _.get(plan, 'covName'),
                    sumInsured: _.get(plan, 'sumInsured'),
                  });
                });
                _.set(doc, 'value.plans', plansTemp);
              }
            }
            // const isBackDate = _.get(doc, 'planDetails.isBackDate', '');
            // if (isBackDate !== '') {
            //   _.set(doc, 'value.isBackDate', isBackDate);
            // }
            if (paymentMode !== '') {
              _.set(doc, 'value.paymentMode', paymentMode);
            }
            const insured = _.get(doc, 'insured', []);
            if (!_.isEmpty(insured)) {
              const insuredTemp = insured[0];
              if (insuredTemp) {
                const personalInfo = _.get(insuredTemp, 'personalInfo', {});
                const iFullName = _.get(personalInfo, 'fullName', '');
                _.set(doc, 'value.iFullName', iFullName);
                const iLastName = _.get(personalInfo, 'lastName', '');
                _.set(doc, 'value.iLastName', iLastName);
                const iFirstName = _.get(personalInfo, 'firstName', '');
                _.set(doc, 'value.iFirstName', iFirstName);
                const iOthName = _.get(personalInfo, 'othName', '');
                _.set(doc, 'value.iOthName', iOthName);
                const hanyuPinyinName = _.get(personalInfo, 'hanyuPinyinName', '');
                _.set(doc, 'value.iHanyuPinyinName', hanyuPinyinName);
                const iUndischargedBankrupt = _.get(insuredTemp, 'declaration.BANKRUPTCY01');
                _.set(doc, 'value.iUndischargedBankrupt', iUndischargedBankrupt);
              }
            }
            _.get(doc, 'key', []).push(
              '01',
            );
            const applicationSubmittedDate = _.get(doc, 'value.applicationSubmittedDate');
            if (applicationSubmittedDate) {
              _.get(doc, 'key', []).push(
                new Date(applicationSubmittedDate).getTime(),
              );
            }
            result.push(_.omit(doc,
              [
                'plans', 'paymentMode',
                'insured',
                'cashPortion',
                'quotType', 'planDetails',
              ]));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  appWithoutSubmitDate(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01'],
        value: {
          id: '$id',
          appStatus: '$appStatus',
          parentId: '$parentId',
          policyNumber: '$policyNumber',
          type: '$type',
          isCrossAge: '$isCrossAge',
          isBackDate: '$applicationForm.values.planDetails.isBackDate',
          applicationSubmittedDate: '$applicationSubmittedDate',
          lastUpdateDate: null,
          agentCode: '$quotation.agent.agentCode',
          agentName: '$quotation.agent.name',
          channel: '$quotation.agent.dealerGroup',
          premium: '$quotation.premium',
          ccy: '$quotation.ccy',
          sameAs: '$quotation.sameAs',
          paymentMode: null,
          pTrustedIndividuals: '$applicationForm.values.proposer.personalInfo.trustedIndividuals',
          pFullName: '$applicationForm.values.proposer.personalInfo.fullName',
          pLastName: '$applicationForm.values.proposer.personalInfo.lastName',
          pFirstName: '$applicationForm.values.proposer.personalInfo.firstName',
          pOthName: '$applicationForm.values.proposer.personalInfo.othName',
          pHanyuPinyinName: '$applicationForm.values.proposer.personalInfo.hanyuPinyinName',
          iFullName: null,
          iLastName: null,
          iFirstName: null,
          iOthName: null,
          iHanyuPinyinName: null,
          iUndischargedBankrupt: null,
          pUndischargedBankrupt: '$applicationForm.values.proposer.declaration.BANKRUPTCY01',
          payorSurname: '$applicationForm.values.proposer.declaration.FUND_SRC03',
          payorGivenName: '$applicationForm.values.proposer.declaration.FUND_SRC04',
          payorOtherName: '$applicationForm.values.proposer.declaration.FUND_SRC05',
          payorPinYinName: '$applicationForm.values.proposer.declaration.FUND_SRC06',
          initPayMethod: { $cond: { if: '$payment', then: '$payment.initPayMethod', else: null } },
          trxStatus: { $cond: { if: '$payment', then: '$payment.trxStatus', else: null } },
          trxNo: { $cond: { if: '$payment', then: '$payment.trxNo', else: null } },
          plans: null,
        },
        plans: '$quotation.plans',
        paymentMode: '$quotation.paymentMode',
        insured: '$applicationForm.values.insured',
        cashPortion: '$payment.cashPortion',
        // payment: { $type: '$payment' },
        quotType: '$quotation.quotType',
        planDetails: '$applicationForm.values.planDetails',
        applicationSignedDate: '$applicationSignedDate',
        applicationStartedDate: '$applicationStartedDate',
        lastUpdateDate: '$lastUpdateDate',
      },
    };
    const matchStr = {
      $match: {
        $and: [
          {
            $or: [
              { applicationSubmittedDate: { $exists: false } },
              { applicationSubmittedDate: 0 },
            ],

          },
          {
            $and: [
              {
                policyNumber: { $exists: true },
              },
              {
                policyNumber: { $ne: '' },
              },
              {
                policyNumber: { $ne: null },
              },
            ],
          },
        ],

      },
    };

    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { id: 1 } });
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const quotType = _.get(doc, 'quotType', '');
            let paymentMode = _.get(doc, 'paymentMode', '');
            // const payment = _.get(doc, 'payment');
            // if (_.isEmpty(payment)) {
            //   console.log('>>>>>  id ', doc.id);
            //   console.log('>>>>>  payment ', payment);
            //   console.log('>>>>>  payment type ', typeof payment);
            // }
            if (quotType === 'SHIELD') {
              if (_.get(doc, 'cashPortion', '') === 0) {
                // initPayMethod = '-';
                _.set(doc, 'value.initPayMethod', '-');
              }
              const planDetails = _.get(doc, 'planDetails', {});
              if (!_.isEmpty(planDetails)) {
                _.set(doc, 'value.ccy', _.get(planDetails, 'ccy'));
                let premium = 0;
                const planList = _.get(planDetails, 'planList', []);
                if (!_.isEmpty(planList)) {
                  const plans = [];
                  _.forEach(planList, (plan, index) => {
                    plans.push({
                      covName: _.get(plan, 'covName'),
                      sumInsured: _.get(plan, 'sumInsured'),
                    });
                    premium += _.get(plan, 'premium', 0);
                    if (index === 0) {
                      paymentMode = _.get(plan, 'payFreq');
                    }
                  });
                  _.set(doc, 'value.plans', plans);
                }
                _.set(doc, 'value.premium', premium);
              }
            } else {
              const plans = _.get(doc, 'plans', []);
              if (!_.isEmpty(plans)) {
                const plansTemp = [];
                _.forEach(plans, (plan) => {
                  plansTemp.push({
                    covName: _.get(plan, 'covName'),
                    sumInsured: _.get(plan, 'sumInsured'),
                  });
                });
                _.set(doc, 'value.plans', plansTemp);
              }
            }
            // const isBackDate = _.get(doc, 'planDetails.isBackDate', '');
            // if (isBackDate !== '') {
            //   _.set(doc, 'value.isBackDate', isBackDate);
            // }
            if (paymentMode !== '') {
              _.set(doc, 'value.paymentMode', paymentMode);
            }
            const insured = _.get(doc, 'insured', []);
            if (!_.isEmpty(insured)) {
              const insuredTemp = insured[0];
              if (insuredTemp) {
                const personalInfo = _.get(insuredTemp, 'personalInfo', {});
                const iFullName = _.get(personalInfo, 'fullName', '');
                _.set(doc, 'value.iFullName', iFullName);
                const iLastName = _.get(personalInfo, 'lastName', '');
                _.set(doc, 'value.iLastName', iLastName);
                const iFirstName = _.get(personalInfo, 'firstName', '');
                _.set(doc, 'value.iFirstName', iFirstName);
                const iOthName = _.get(personalInfo, 'othName', '');
                _.set(doc, 'value.iOthName', iOthName);
                const hanyuPinyinName = _.get(personalInfo, 'hanyuPinyinName', '');
                _.set(doc, 'value.iHanyuPinyinName', hanyuPinyinName);
                const iUndischargedBankrupt = _.get(insuredTemp, 'declaration.BANKRUPTCY01');
                _.set(doc, 'value.iUndischargedBankrupt', iUndischargedBankrupt);
              }
            }
            // _.get(doc, 'key', []).push(
            //   '01',
            // );
            // const applicationSubmittedDate = _.get(doc, 'value.applicationSubmittedDate');
            // if (applicationSubmittedDate) {
            //   _.get(doc, 'key', []).push(
            //     new Date(applicationSubmittedDate).getTime(),
            //   );
            // }
            const lastUpdateDate = doc.value.applicationSubmittedDate
            || doc.applicationSignedDate || doc.applicationStartedDate || doc.lastUpdateDate;
            _.set(doc, 'value.lastUpdateDate', lastUpdateDate);
            result.push(_.omit(doc,
              [
                'plans',
                'paymentMode',
                'insured',
                'cashPortion',
                'quotType',
                'planDetails',
                'applicationSignedDate',
                'applicationStartedDate',
                'lastUpdateDate',
              ]));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  approvalApp(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$approvalCaseId'],
        value: {
          compCode: '$compCode',
          caseNo: '$policyId',
          agentId: '$agentId',
          agentName: '$agentName',
          managerName: '$managerName',
          managerId: '$managerId',
          directorId: '$directorId',
          directorName: '$directorName',
          approveManagerId: '$approveRejectManagerId',
          approveManagerName: '$approveRejectManagerName',
          submittedDate: '$submittedDate',
          approvalStatus: '$approvalStatus',
          approvalCaseId: '$approvalCaseId',
          applicationId: '$applicationId',
          lastEditedBy: '$lastEditedBy',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';


    // emit(['01', doc.approvalCaseId], emitObj);
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { approvalCaseId: startKeys[1] };
        } else {
          matchStr.$match = { approvalCaseId: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { approvalCaseId: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = {
          approvalCaseId: keyJson[1],
        };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { approvalCaseId: 1 } });
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
  approvalCases(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$approvalCaseId'],
        value: {
          compCode: '$compCode',
          displayCaseNo: '$policyId',
          caseNo: '$policyId',
          agentId: '$agentId',
          agentName: '$agentName',
          managerName: '$managerName',
          managerId: '$managerId',
          directorId: '$directorId',
          directorName: '$directorName',
          approveManagerId: '$approveRejectManagerId',
          approveManagerName: '$approveRejectManagerName',
          submittedDate: '$submittedDate',
          approvalStatus: '$approvalStatus',
          approvalCaseId: '$approvalCaseId',
          applicationId: '$applicationId',
          lastEditedBy: '$lastEditedBy',
          supervisorApproveRejectDate: null,
          approveRejectDate: null,
          approveRejectManagerId: '$approveRejectManagerId',
          approveRejectManagerName: '$approveRejectManagerName',
          faFirmName: '$faFirmName',
          jointFieldWorkCase: { $cond: { if: '$accept', then: '$accept.jointFieldWorkCase', else: null } },
          purposeOfJointFieldWork: { $cond: { if: '$accept', then: '$accept.jointFieldWorkCBGroup', else: null } },
          dateOfCall: { $cond: { if: '$accept', then: '$accept.callDate', else: null } },
          personContacted: { $cond: { if: '$accept', then: '$accept.contactPerson', else: null } },
          mobileNo: { $cond: { if: '$accept', then: '$accept.mobileNo', else: null } },
          mobileCountryCode: { $cond: { if: '$accept', then: '$accept.mobileCountryCode', else: null } },
          approveComment: { $cond: { if: '$accept', then: '$accept.approveComment', else: null } },
        },
        supervisorApproveRejectDate: '$supervisorApproveRejectDate',
        approveRejectDate: '$approveRejectDate',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';


    // emit(['01', doc.approvalCaseId], emitObj);
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { approvalCaseId: startKeys[1] };
        } else {
          matchStr.$match = { approvalCaseId: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { approvalCaseId: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = {
          approvalCaseId: keyJson[1],
        };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { approvalCaseId: 1 } });
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
            const supervisorApproveRejectDate = _.get(doc, 'supervisorApproveRejectDate', '');
            if (supervisorApproveRejectDate !== '') {
              _.set(doc, 'value.supervisorApproveRejectDate', new Date(supervisorApproveRejectDate).getTime());
            }
            const approveRejectDate = _.get(doc, 'approveRejectDate', '');
            if (approveRejectDate !== '') {
              _.set(doc, 'value.approveRejectDate', new Date(approveRejectDate).getTime());
            }
            result.push(_.omit(doc, ['supervisorApproveRejectDate', 'approveRejectDate']));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  approvalDateCases(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          compCode: '$compCode',
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
          submittedDate: '$submittedDate',
          approvalStatus: '$approvalStatus',
          onHoldReason: '$onHoldReason',
          approvalCaseId: '$approvalCaseId',
          applicationId: '$applicationId',
          quotationId: '$quotationId',
          customerId: '$customerId',
          customerName: '$customerName',
          approveRejectDate: '$approveRejectDate',
          lastEditedBy: '$lastEditedBy',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';


    // emit(['01', doc.approvalCaseId], emitObj);
    const matchStr = {
      $match: {
        $and: [
          { approveRejectDate: { $exists: true } },
        ],

      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          _.get(matchStr, '$match.$and', []).push({
            approveRejectDate: new Date(startKeys[1]).toISOString(),
          });
          // matchStr.$match = { approvalCaseId: startKeys[1] };
        } else {
          _.get(matchStr, '$match.$and', []).push({
            approveRejectDate: {
              $gte: new Date(startKeys[1]).toISOString(),
              $lte: new Date(endKeys[1]).toISOString(),
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
              { approveRejectDate: new Date(keyItem[1]).toISOString() },
            );
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push({
          $or: inArray,
        });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.get(matchStr, '$match.$and', []).push({
          approveRejectDate: new Date(keyJson[1]).toISOString(),
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { approveRejectDate: 1 } });
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
            const approveRejectDate = _.get(doc, 'value.approveRejectDate', '');
            if (approveRejectDate !== '') {
              _.set(doc, 'key', ['01', new Date(approveRejectDate).getTime()]);
              result.push(doc);
            }
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  async approvalDetails(req, res) {
    // doc.type === 'approval') {
    //   emit(['01', doc.approvalStatus, doc.], emitObj);
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
  bundleApp(req, res) {
    // doc.type === 'bundle') {
    //   emit(['01', 'application',  app.applicationDocId]
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        // key: ['01', '$quotationDocId', null],
        applications: '$applications',
        isValid: '$isValid',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStrBundle = {
      $match: {
        $and: [
          { applications: { $exists: true } },
        ],
      },
    };
    const applicationDocIds = [];
    let rangeCase = false;
    const startEnd = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        let whereBundle = {};
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 2) {
            _.get(matchStrBundle, '$match.$and', []).push(
              {
                applications: { $elemMatch: { applicationDocId: startKeys[2] } },
              },
            );
            applicationDocIds.push(startKeys[2]);
          }
        } else {
          const elemStr = {};
          if (startKeys && startKeys.length > 2) {
            rangeCase = true;
            _.set(startEnd, 'start', startKeys[2]);
            _.set(elemStr, '$elemMatch.applicationDocId.$gte', startKeys[2]);
          }

          if (endKeys && endKeys.length > 2) {
            rangeCase = true;
            _.set(startEnd, 'end', endKeys[2]);
            _.set(elemStr, '$elemMatch.applicationDocId.$lte', endKeys[2]);
          }

          if (!_.isEmpty(elemStr)) {
            whereBundle = {
              applications: elemStr,
            };
          }
        }
        if (!_.isEmpty(whereBundle)) {
          _.get(matchStrBundle, '$match.$and', []).push(
            whereBundle,
          );
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inBundleArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            applicationDocIds.push(keyItem[2]);
            inBundleArray.push({
              applications: { $elemMatch: { applicationDocId: keyItem[2] } },
            });
          }
        });
      }
      if (!_.isEmpty(inBundleArray)) {
        _.get(matchStrBundle, '$match.$and', []).push(
          {
            $or: inBundleArray,
          },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 2) {
        _.get(matchStrBundle, '$match.$and', []).push(
          {
            applications: { $elemMatch: { applicationDocId: keyJson[2] } },
          },
        );
        applicationDocIds.push(keyJson[2]);
      }
    }
    if (!_.isEmpty(matchStrBundle)) {
      aggregateStr.push(matchStrBundle);
    }
    aggregateStr.push({ $sort: { id: 1, 'applications.applicationDocId': 1 } });
    aggregateStr.push(projectStr);
    mongoose.connection.collection('fna').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          // console.log('>>>>>>  docs length=', docs.length);
          const start = _.get(startEnd, 'start', '');
          const end = _.get(startEnd, 'end', '');
          _.forEach(docs, (doc) => {
            if (doc && doc.applications && doc.applications.length > 0) {
              _.forEach(doc.applications, (app) => {
                if (
                  _.isEmpty(applicationDocIds)
                  || (!_.isEmpty(applicationDocIds)
                  && _.indexOf(applicationDocIds, app.applicationDocId) > -1)
                ) {
                  if (!rangeCase || (rangeCase && !_.isEmpty(startEnd) && (
                    (start !== '' && app.applicationDocId >= start) || start === ''
                  ) && (end === '' || (end !== '' && app.applicationDocId <= end)))) {
                    result.push({
                      id: doc.id,
                      key: ['01', 'application', app.applicationDocId],
                      value: {
                        bundleId: doc.id,
                        applicationDocId: app.applicationDocId,
                        appStatus: app.appStatus,
                        isValid: doc.isValid,
                      },
                    });
                  }
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
  bundleApplications(req, res) {
    // doc.type === 'bundle') {
    //   emit(['01', 'application',  app.applicationDocId]
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        // key: ['01', '$quotationDocId', null],
        applications: '$applications',
        status: '$status',
        pCid: '$pCid',
        isValid: '$isValid',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStrBundle = {
      $match: {
        $and: [
          { applications: { $exists: true } },
        ],
      },
    };
    const applications = [];
    const quotations = [];
    let caseApp = false;
    let caseQuot = false;
    let rangeCase = false;
    const startEnd = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (startKeys.length > 2 && endKeys.length > 2) {
          if (_.isEqual(startKeys, endKeys)) {
            if (_.isEqual('application', startKeys[1])) {
              const temp = {};
              caseApp = true;
              _.set(temp, 'appStatus', startKeys[2]);
              if (startKeys.length > 3) {
                _.set(temp, 'applicationDocId', startKeys[3]);
              }
              if (!_.isEmpty(temp)) {
                _.get(matchStrBundle, '$match.$and', []).push(
                  {
                    applications: { $elemMatch: temp },
                  },
                );
                applications.push(_.cloneDeep(temp));
              }
            } else if (_.isEqual('quotation', startKeys[1])) {
              if (startKeys.length > 3) {
                caseQuot = true;
                _.get(matchStrBundle, '$match.$and', []).push(
                  {
                    applications: { $elemMatch: { quotationDocId: startKeys[3] } },
                  },
                );
                quotations.push(startKeys[3]);
              }
            }
          } else {
            const temp = {};
            if (_.isEqual('application', startKeys[1])) {
              caseApp = true;
              _.set(startEnd, 'start.appStatus', startKeys[2]);
              _.set(temp, 'appStatus.$gte', startKeys[2]);
              if (startKeys && startKeys.length > 3) {
                _.set(startEnd, 'start.applicationDocId', startKeys[3]);
                _.set(temp, 'applicationDocId.$gte', startKeys[3]);
              }
            } else if (_.isEqual('quotation', startKeys[1])) {
              if (startKeys && startKeys.length > 3) {
                caseQuot = true;
                _.set(startEnd, 'start.quotationDocId', startKeys[3]);
                _.set(temp, 'quotationDocId.$gte', startKeys[3]);
              }
            }
            if (_.isEqual('application', endKeys[1])) {
              caseApp = true;
              _.set(temp, 'appStatus.$lte', endKeys[2]);
              _.set(startEnd, 'end.appStatus', endKeys[2]);
              if (endKeys && endKeys.length > 3) {
                _.set(startEnd, 'end.applicationDocId', endKeys[3]);
                _.set(temp, 'applicationDocId.$lte', endKeys[3]);
              }
            } else if (_.isEqual('quotation', endKeys[1])) {
              if (endKeys && endKeys.length > 3) {
                caseQuot = true;
                _.set(startEnd, 'end.quotationDocId', endKeys[3]);
                _.set(temp, 'quotationDocId.$lte', endKeys[3]);
              }
            }
            if (!_.isEmpty(temp)) {
              rangeCase = true;
              _.get(matchStrBundle, '$match.$and', []).push(
                {
                  applications: { $elemMatch: temp },
                },
              );
            }
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inBundleArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            if (_.isEqual('application', keyItem[1])) {
              caseApp = true;
              const temp = {};
              _.set(temp, 'appStatus', keyItem[2]);
              if (keyItem.length > 3) {
                _.set(temp, 'applicationDocId', keyItem[3]);
              }
              if (!_.isEmpty(temp)) {
                applications.push(_.cloneDeep(temp));
                inBundleArray.push({
                  applications: { $elemMatch: temp },
                });
              }
            } else if (_.isEqual('quotation', keyItem[1])) {
              if (keyItem.length > 3) {
                caseQuot = true;
                inBundleArray.push({
                  applications: { $elemMatch: { quotationDocId: keyItem[3] } },
                });
                quotations.push(keyItem[3]);
              }
            }
          }
        });
      }
      if (!_.isEmpty(inBundleArray)) {
        _.get(matchStrBundle, '$match.$and', []).push(
          {
            $or: inBundleArray,
          },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 2) {
        if (_.isEqual('application', keyJson[1])) {
          const temp = {};
          caseApp = true;
          _.set(temp, 'appStatus', keyJson[2]);
          if (keyJson.length > 3) {
            _.set(temp, 'applicationDocId', keyJson[3]);
          }
          if (!_.isEmpty(temp)) {
            _.get(matchStrBundle, '$match.$and', []).push(
              {
                applications: { $elemMatch: temp },
              },
            );
            applications.push(_.cloneDeep(temp));
          }
        } else if (_.isEqual('quotation', keyJson[1])) {
          if (keyJson.length > 3) {
            caseQuot = true;
            _.get(matchStrBundle, '$match.$and', []).push(
              {
                applications: { $elemMatch: { quotationDocId: keyJson[3] } },
              },
            );
            quotations.push(keyJson[3]);
          }
        }
      }
    } else {
      caseApp = true;
      caseQuot = true;
    }
    if (!_.isEmpty(matchStrBundle)) {
      aggregateStr.push(matchStrBundle);
    }
    if (caseApp) {
      aggregateStr.push({ $sort: { 'applications.appStatus': 1, 'applications.applicationDocId': 1 } });
    } else if (caseQuot) {
      aggregateStr.push({ $sort: { 'applications.quotationDocId': 1 } });
    }

    aggregateStr.push(projectStr);
    mongoose.connection.collection('fna').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const appResult = [];
        const quotResult = [];
        if (docs && docs.length > 0) {
          // console.log('>>>>>>  docs length=', docs.length);
          const startAppStatus = _.get(startEnd, 'start.appStatus', '');
          const endAppStatus = _.get(startEnd, 'end.appStatus', '');
          const startApplicationDocId = _.get(startEnd, 'start.applicationDocId', '');
          const endApplicationDocId = _.get(startEnd, 'end.applicationDocId', '');
          const startQuotationDocId = _.get(startEnd, 'start.quotationDocId', '');
          const endQuotationDocId = _.get(startEnd, 'end.quotationDocId', '');

          _.forEach(docs, (doc) => {
            if (doc && doc.applications && doc.applications.length > 0) {
              _.forEach(doc.applications, (app) => {
                if (app.applicationDocId) {
                  if (caseApp) {
                    if (
                      _.isEmpty(applications)
                  || (!_.isEmpty(applications)
                  && _.findIndex(applications, (o) => {
                    const tempStatus = _.get(o, 'appStatus', '');
                    const applicationDocId = _.get(o, 'applicationDocId', '');
                    return (tempStatus === '' || tempStatus === app.appStatus)
                    && (applicationDocId === '' || applicationDocId === app.applicationDocId);
                  }) !== -1)
                    ) {
                      if (!rangeCase || (rangeCase && !_.isEmpty(startEnd) && (
                        (startAppStatus !== '' && app.appStatus >= startAppStatus) || startAppStatus === ''
                      ) && ((startApplicationDocId !== '' && app.applicationDocId >= startApplicationDocId) || startApplicationDocId === ''
                      ) && (endAppStatus === '' || (endAppStatus !== '' && app.appStatus <= endAppStatus))
                      && (endApplicationDocId === '' || (endApplicationDocId !== '' && app.applicationDocId <= endApplicationDocId)))) {
                        appResult.push({
                          id: doc.id,
                          key: ['01', 'application', app.appStatus, app.applicationDocId],
                          value: {
                            bundleId: doc.id,
                            bundleStatus: doc.status,
                            pCid: doc.pCid,
                            bundleIsValid: doc.isValid,
                            quotationDocId: app.quotationDocId,
                            applicationDocId: app.applicationDocId,
                            appStatus: app.appStatus,
                          },
                        });
                      }
                    }
                  }
                } else if (caseQuot) {
                  if (_.isEmpty(quotations)
                  || (!_.isEmpty(quotations)
                  && _.indexOf(quotations, app.quotationDocId) > -1)) {
                    console.log('>>>>> app.quotationDocId=', app.quotationDocId);
                    console.log('>>>>> ', JSON.stringify(quotations));
                    if (!rangeCase || (rangeCase && !_.isEmpty(startEnd) && (
                      (startQuotationDocId !== '' && app.quotationDocId >= startQuotationDocId) || startQuotationDocId === ''
                    ) && (endQuotationDocId === '' || (endQuotationDocId !== '' && app.quotationDocId <= endQuotationDocId)))) {
                      quotResult.push({
                        id: doc.id,
                        key: ['01', 'quotation', null, app.quotationDocId],
                        value: {
                          bundleId: doc.id,
                          bundleStatus: doc.status,
                          pCid: doc.pCid,
                          bundleIsValid: doc.isValid,
                          quotationDocId: app.quotationDocId,
                          applicationDocId: null,
                          appStatus: null,
                        },
                      });
                    }
                  }
                }
              });
            }
          });
        }
        const result = _.concat(appResult, quotResult);
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
  cpfApps(req, res) {
    // doc.type === 'application') {
    //  emit(['01',  payment.initPayMethod],
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$payment.initPayMethod'],
        value: {
          id: '$id',
          policyNumber: '$policyNumber',
          type: '$type',
          covName: null,
          payment: '$payment',
          lastUpdateDate:
          {
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
        },
        plans: '$quotation.plans',
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        $and: [
          { payment: { $exists: true } },
          { quotation: { $exists: true } },
          { 'quotation.agent': { $exists: true } },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (startKeys.length > 1 && endKeys.length > 1) {
          if (_.isEqual(startKeys, endKeys)) {
            _.get(matchStr, '$match.$and', []).push(
              {
                'payment.initPayMethod': startKeys[1],
              },
            );
          } else {
            const temp = {};
            if (startKeys && startKeys.length > 1) {
              _.set(temp, '$gte', startKeys[1]);
            }
            if (endKeys && endKeys.length > 1) {
              _.set(temp, '$lte', endKeys[1]);
            }
            if (!_.isEmpty(temp)) {
              _.get(matchStr, '$match.$and', []).push(
                { 'payment.initPayMethod': temp },
              );
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
            inArray.push(keyItem[1]);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push(
          { 'payment.initPayMethod': { $in: inArray } },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.get(matchStr, '$match.$and', []).push(
          {
            'payment.initPayMethod': keyJson[1],
          },
        );
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }

    aggregateStr.push({ $sort: { 'payment.initPayMethod': 1 } });

    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const plans = _.get(doc, 'plans');
            if (plans) {
              if (plans && plans.length > 0 && plans[0].covName) {
                const covName = _.get(plans[0], 'covName');
                if (covName) {
                  _.set(doc, 'value.covName', covName);
                }
              }
            }
            result.push(_.omit(doc, ['plans']));
          });
        }
        const resultTemp = {};
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
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
        'rawData.upline2Code': { $exists: true, $ne: '' },
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
  downloadMaterial(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$id'],
        value: {
          section: '$section',
          sectionId: '$sectionId',
          name: '$name',
          id: '$id',
          effDate: '$effDate',
          expDate: '$expDate',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        type: 'material',
      },
    };

    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(matchStr, '$match.id', startKeys[1]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(matchStr, '$match.id.$gte', startKeys[1]);
          }

          if (endKeys && endKeys.length > 1) {
            _.set(matchStr, '$match.id.$lte', endKeys[1]);
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
        _.set(matchStr, '$match.id', { $in: inArray });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.set(matchStr, '$match.id', keyJson[1]);
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { id: 1 } });
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
  funds(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$fundCode'],
        value: {
          compCode: '$compCode',
          fundCode: '$fundCode',
          fundName: '$fundName',
          ccy: '$ccy',
          isMixedAsset: '$isMixedAsset',
          assetClass: '$assetClass',
          riskRating: '$riskRating',
          paymentMethod: '$paymentMethod',
          version: '$version',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        type: 'fund',
      },
    };

    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(matchStr, '$match.fundCode', startKeys[1]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(matchStr, '$match.fundCode.$gte', startKeys[1]);
          }

          if (endKeys && endKeys.length > 1) {
            _.set(matchStr, '$match.fundCode.$lte', endKeys[1]);
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
        _.set(matchStr, '$match.fundCode', { $in: inArray });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.set(matchStr, '$match.fundCode', keyJson[1]);
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { fundCode: 1 } });
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
  naById(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$id'],
        value: {
          id: '$id',
          productType: '$productType',
          ckaSection: '$ckaSection',
        },
      },
    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {};
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          matchStr.$match = { id: startKeys[1] };
        } else {
          matchStr.$match = { id: { $gte: startKeys[1], $lte: endKeys[1] } };
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
        matchStr.$match = { id: { $in: inArray } };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        matchStr.$match = { id: keyJson[1] };
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log(' >>>>> aggregateStr=', JSON.stringify(aggregateStr));
    // order by managerCode (注意 显示字段（projectStr）要放到最后)
    aggregateStr.push({ $sort: { id: 1 } });
    aggregateStr.push(projectStr);
    mongoose.connection.collection('fnaNa').aggregate(aggregateStr).toArray((err, docs) => {
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
  onlinePayment(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          id: '$id',
          parentId: '$parentId', // no shield is not in
          policyNumber: '$policyNumber',
          type: '$type',
          trxTime: { $cond: { if: '$payment.trxTime', then: '$payment.trxTime', else: '$payment.trxStartTime' } },
          ccy: '$payment.policyCcy',
          initTotalPrem: '$payment.initTotalPrem', // { $cond: { if: { '$quotation.quotType': 'SHIELD' }, then: '$payment.cashPortion', else:'$payment.initTotalPrem'   } },
          trxAmount: '$payment.initTotalPrem', // { $cond: { if: { '$quotation.quotType': 'SHIELD' }, then: '$payment.cashPortion', else: '$payment.initTotalPrem' } },
          paymentMethod: '$payment.initPayMethod',
          trxNo: '$payment.trxNo', // { $cond: { if: '$payment.trxNo', then: '$payment.trxNo', else: '' } },
          proposerName: '$quotation.pFullName',
          agentName: '$quotation.agent.name',
          agentCompany: '$quotation.agent.company',
          trxStatus: '$payment.trxStatus', // {
          //   $cond: {
          //     if: { '$quotation.quotType': 'SHIELD' },
          //     then: { $cond: { if: '$payment.trxStatus',
          // then: '$payment.trxStatus', else: '' } },
          //     else: '$payment.trxStatus',
          //   },
          // },
          trxEnquiryStatus: '$payment.trxEnquiryStatus',
          applicationSubmittedDate: '$applicationSubmittedDate',
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
        },
        quotType: '$quotation.quotType',
        cashPortion: '$payment.cashPortion',
        totCashPortion: '$payment.totCashPortion',
        shieldCcy: '$applicationForm.values.planDetails.ccy',
        shieldAgentName: '$agent.name',
        agentCompany: '$agent.company',
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
            payment: { $exists: true },
          },
          {
            'quotation.agent': { $exists: true },
          },
        ],

      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys.length > 1 && endKeys.length > 1) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], '-')) {
            _.get(matchStr, '$match.$and', []).push({
              'quotation.quotType': 'SHIELD',
            });
            _.get(matchStr, '$match.$and', []).push({
              'payment.cashPortion': 0,
            });
          } else {
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                {
                  $and: [
                    { 'quotation.quotType': { $ne: 'SHIELD' } },
                    { 'payment.initPayMethod': startKeys[1] },
                  ],
                },
                {
                  $and: [
                    { 'quotation.quotType': 'SHIELD' },
                    { 'payment.cashPortion': { $ne: 0 } },
                    { 'payment.initPayMethod': startKeys[1] },
                  ],
                },
              ],
            });
          }
          if (startKey && startKey.length > 2) {
            if (startKeys[2] === 0) {
              _.get(matchStr, '$match.$and', []).push(
                {
                  'payment.trxTime': startKeys[2],
                },
              );
              _.get(matchStr, '$match.$and', []).push(
                {
                  'payment.trxStartTime': startKeys[2],
                },
              );
            } else {
              _.get(matchStr, '$match.$and', []).push({
                $or: [
                  {
                    'payment.trxTime': startKeys[2],
                  },
                  {
                    'payment.trxStartTime': startKeys[2],
                  },
                ],
              });
            }
          }
        } else {
          const temp = {};
          if (_.isEqual(startKeys[1], '-')) {
            _.get(matchStr, '$match.$and', []).push({
              'quotation.quotType': 'SHIELD',
            });
            _.get(matchStr, '$match.$and', []).push({
              'payment.cashPortion': 0,
            });
          } else {
            _.get(matchStr, '$match.$and', []).push({
              $and: [
                {
                  $or: [
                    { 'quotation.quotType': { $ne: 'SHIELD' } },
                    {
                      $and: [
                        { 'quotation.quotType': 'SHIELD' },
                        { 'payment.cashPortion': { $ne: 0 } },
                      ],
                    },
                  ],
                },
                { 'payment.initPayMethod': { $gte: startKeys[1], $lte: endKeys[1] } },
              ],
            });
          }
          if (startKeys && startKeys.length > 2) {
            _.set(temp, '$gte', startKeys[2]);
          }
          if (endKeys && endKeys.length > 2) {
            _.set(temp, '$lte', endKeys[2]);
          }
          if (!_.isEmpty(temp)) {
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                {
                  $and: [
                    { 'payment.trxTime': temp },
                    { 'payment.trxTime': { $exists: true } },
                    { 'payment.trxTime': { $ne: 0 } },
                    { 'payment.trxStartTime': { $exists: false } },
                  ],
                },
                {
                  $and: [
                    {
                      $or: [
                        { 'payment.trxTime': { $exists: false } },
                        { 'payment.trxTime': 0 },
                      ],
                    },
                    { 'payment.trxStartTime': temp },
                    { 'payment.trxStartTime': { $exists: true } },
                  ],
                },
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
          const temp = [];
          if (keyItem && keyItem.length > 1) {
            if (_.isEqual(keyItem[1], '-')) {
              temp.push(
                {
                  'quotation.quotType': 'SHIELD',
                },
              );
              temp.push(
                {
                  'payment.cashPortion': 0,
                },
              );
            } else {
              temp.push({
                $or: [
                  {
                    $and: [
                      { 'quotation.quotType': { $ne: 'SHIELD' } },
                      { 'payment.initPayMethod': keyItem[1] },
                    ],
                  },
                  {
                    $and: [
                      { 'quotation.quotType': 'SHIELD' },
                      { 'payment.cashPortion': { $ne: 0 } },
                      { 'payment.initPayMethod': keyItem[1] },
                    ],
                  },
                ],
              });
            }
            if (keyItem && keyItem.length > 2) {
              if (keyItem[2] === 0) {
                temp.push(
                  {
                    'payment.trxTime': keyItem[2],
                  },
                );
                temp.push({
                  'payment.trxStartTime': keyItem[2],
                });
              } else {
                temp.push({
                  $or: [
                    {
                      'payment.trxTime': keyItem[2],
                    },
                    {
                      'payment.trxStartTime': keyItem[2],
                    },
                  ],
                });
              }
            }
            if (!_.isEmpty(temp)) {
              inArray.push({
                $and: temp,
              });
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
        if (_.isEqual(keyJson[1], '-')) {
          _.get(matchStr, '$match.$and', []).push({
            'quotation.quotType': 'SHIELD',
          });
          _.get(matchStr, '$match.$and', []).push({
            'payment.cashPortion': 0,
          });
        } else {
          _.get(matchStr, '$match.$and', []).push({
            $or: [
              {
                $and: [
                  { 'quotation.quotType': { $ne: 'SHIELD' } },
                  { 'payment.initPayMethod': keyJson[1] },
                ],
              },
              {
                $and: [
                  { 'quotation.quotType': 'SHIELD' },
                  { 'payment.cashPortion': { $ne: 0 } },
                  { 'payment.initPayMethod': keyJson[1] },
                ],
              },
            ],
          });
        }
        if (keyJson && keyJson.length > 2) {
          if (keyJson[2] === 0) {
            _.get(matchStr, '$match.$and', []).push(
              {
                'payment.trxTime': keyJson[2],
              },
            );
            _.get(matchStr, '$match.$and', []).push({
              'payment.trxStartTime': keyJson[2],
            });
          } else {
            _.get(matchStr, '$match.$and', []).push({
              $or: [
                {
                  'payment.trxTime': keyJson[2],
                },
                {
                  'payment.trxStartTime': keyJson[2],
                },
              ],
            });
          }
        }
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push({ $sort: { 'payment.initPayMethod': 1 } });
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultTemp = {};
        const result = [];
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const doc = _.cloneDeep(item);
            const quotType = _.get(doc, 'quotType', '');
            const cashPortion = _.get(doc, 'cashPortion', '');
            const paymentMethod = _.get(doc, 'value.paymentMethod', null);
            const trxTime = _.get(doc, 'value.trxTime', null);
            _.get(doc, 'key', []).push('01');
            if (quotType === 'SHIELD') {
              if (cashPortion === 0) {
                _.get(doc, 'key', []).push('-');
              } else {
                _.get(doc, 'key', []).push(paymentMethod);
              }
              const shieldCcy = _.get(doc, 'shieldCcy', '');
              _.set(doc, 'value.ccy', shieldCcy);
              _.set(doc, 'value.trxNo', _.get(doc, 'value.trxNo', ''));
              const trxStatus = _.get(doc, 'value.trxStatus');
              if (trxStatus) {
                _.set(doc, 'value.trxStatus', trxStatus);
              } else {
                _.set(doc, 'value.trxStatus', '');
              }
              const totCashPortion = _.get(doc, 'totCashPortion');
              if (typeof cashPortion === 'number') {
                _.set(doc, 'value.initTotalPrem', cashPortion);
              } else {
                delete doc.value.initTotalPrem;
              }

              if (typeof totCashPortion === 'number') {
                _.set(doc, 'value.trxAmount', totCashPortion);
              } else {
                delete doc.value.trxAmount;
              }
              const shieldAgentName = _.get(doc, 'shieldAgentName');
              if (shieldAgentName) {
                _.set(doc, 'value.agentName', shieldAgentName);
              } else {
                delete doc.value.agentName;
              }
              const agentCompany = _.get(doc, 'agentCompany');
              if (agentCompany) {
                _.set(doc, 'value.agentCompany', agentCompany);
              } else {
                delete doc.value.agentCompany;
              }
            } else {
              _.get(doc, 'key', []).push(paymentMethod);
              delete doc.value.parentId;
            }
            if (trxTime !== '') {
              _.get(doc, 'key', []).push(trxTime);
            } else {
              _.get(doc, 'key', []).push(null);
              delete doc.value.trxTime;
            }
            result.push(_.omit(doc, ['quotType', 'cashPortion', 'totCashPortion', 'shieldCcy', 'shieldAgentName', 'agentCompany']));
          });
        }
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
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
  products(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$planInd', '$covCode'],
        value: {
          compCode: '$compCode',
          covCode: '$covCode',
          covName: '$covName',
          version: '$version',
          planCode: '$planCode',
          productLine: '$productLine',
          productCategory: '$productCategory',
          smokeInd: '$smokeInd',
          genderInd: '$genderInd',
          ctyGroup: '$ctyGroup',
          entryAge: '$entryAge',
          currencies: '$currencies',
          quotForm: { $cond: { if: '$quotForm', then: '$quotForm', else: '' } },
          effDate: { $cond: { if: { $gt: ['$effDate', ''] }, then: '$effDate', else: 100000 } },
          expDate: { $cond: { if: { $gt: ['$expDate', ''] }, then: '$expDate', else: 9999999900000 } },
          prodFeature: { $cond: { if: '$prodFeature', then: '$prodFeature', else: '' } },
          keyRisk: { $cond: { if: '$keyRisk', then: '$keyRisk', else: '' } },
          insuredAgeDesc: { $cond: { if: '$insuredAgeDesc', then: '$insuredAgeDesc', else: '' } },
          payModeDesc: { $cond: { if: '$payModeDesc', then: '$payModeDesc', else: '' } },
          polTermDesc: { $cond: { if: '$polTermDesc', then: '$polTermDesc', else: '' } },
          premTermDesc: { $cond: { if: '$premTermDesc', then: '$premTermDesc', else: '' } },
          illustrationInd: { $cond: { if: '$illustrationInd', then: '$illustrationInd', else: '' } },
          scrOrderSeq: { $cond: { if: '$scrOrderSeq', then: '$scrOrderSeq', else: 0 } },
          tnc: { $cond: { if: '$tnc', then: '$tnc', else: '' } },
        },
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
            type: 'product',
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
            planInd: startKeys[1],
          });
          // _.set(matchStr, '$match.planInd', startKeys[1]);
          if (startKeys.length > 2) {
            _.get(matchStr, '$match.$and', []).push({
              covCode: startKeys[2],
            });
            // _.set(matchStr, '$match.covCode', startKeys[2]);
          }
        } else if (_.isEqual(startKeys[1], endKeys[1])) {
          _.get(matchStr, '$match.$and', []).push({
            planInd: startKeys[1],
          });
          const temp = {};
          if (startKeys.length > 2) {
            _.set(temp, '$gte', startKeys[2]);
          }
          if (endKeys.length > 2) {
            _.set(temp, '$lte', endKeys[2]);
          }
          if (!_.isEmpty(temp)) {
            _.get(matchStr, '$match.$and', []).push({
              covCode: temp,
            });
          }
        } else {
          _.get(matchStr, '$match.$and', []).push({
            planInd: { $gte: startKeys[1], $lte: endKeys[1] },
          });
          const temp = [];
          const tempCovCode = {};
          if (startKeys.length > 2) {
            temp.push({
              planInd: startKeys[1],
              covCode: { $gte: startKeys[2] },

            });
            _.set(tempCovCode, '$gte', startKeys[2]);
          }
          if (endKeys.length > 2) {
            temp.push({
              planInd: endKeys[1],
              covCode: { $lte: endKeys[2] },
            });
            _.set(tempCovCode, '$lte', endKeys[2]);
          }
          if (startKeys.length > 2 && endKeys.length > 2) {
            temp.push({
              covCode: tempCovCode,
            });
          }
          if (!_.isEmpty(temp)) {
            _.get(matchStr, '$match.$and', []).push({
              $or: temp,
            });
            // _.set(matchStr, '$match.$or', temp);
          }
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      //  console.log(" >>>>> keysList=", JSON.stringify(keysList));
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          const temp = {};
          if (keyItem && keyItem.length > 1) {
            _.set(temp, 'planInd', keyItem[1]);
          }
          if (keyItem && keyItem.length > 2) {
            _.set(temp, 'covCode', keyItem[2]);
          }
          if (!_.isEmpty(temp)) {
            inArray.push(temp);
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
          planInd: keyJson[1],
        });
        // _.set(matchStr, '$match.planInd', keyJson[1]);
      }
      if (keyJson && keyJson.length > 2) {
        _.get(matchStr, '$match.$and', []).push({
          covCode: keyJson[2],
        });
        // _.set(matchStr, '$match.covCode', keyJson[2]);
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { planInd: 1, covCode: 1 } });
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
  async signatureExpire(req, res) {
    // doc.type === 'masterApproval') {
    //   emit(['01', doc.approvalStatus, doc.approvalCaseId], emitObj);
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          appId: '$id',
          polNo: { $cond: { if: '$policyNumber', then: '$policyNumber', else: '' } },
          bundleId: '$bundleId',
          signDate: null,
          payMethod: '$payment.trxMethod',
          payStatus: '$payment.trxStatus',
          isFullySigned: '$isFullySigned',
          isInitialPaymentCompleted: { $cond: { if: '$isInitialPaymentCompleted', then: '$isInitialPaymentCompleted', else: '$isInitialPaymentComeleted' } },
          docType: '$type',
        },
        biSignedDate: '$biSignedDate',
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
            isSubmittedStatus: { $ne: true },
          },
          {
            isInvalidated: { $ne: true },
          },
          {
            biSignedDate: { $exists: true, $ne: 0 },
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
            _.get(matchStr, '$match.$and', []).push(
              {
                biSignedDate: new Date(startKeys[1]).toISOString(),
              },
            );
          }
        } else {
          const temp = {};
          if (startKeys && startKeys.length > 1) {
            _.set(temp, '$gte', new Date(startKeys[1]).toISOString());
          }
          if (endKeys && endKeys.length > 1) {
            _.set(temp, '$lte', new Date(endKeys[1]).toISOString());
          }
          if (!_.isEmpty(temp)) {
            _.get(matchStr, '$match.$and', []).push(
              {
                biSignedDate: temp,
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
            inArray.push({
              biSignedDate: new Date(keyItem[1]).toISOString(),
            });
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push(
          { $or: inArray },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.get(matchStr, '$match.$and', []).push({
          biSignedDate: new Date(keyJson[1]).toISOString(),
        });
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }

    aggregateStr.push({ $sort: { biSignedDate: 1 } });
    aggregateStr.push(projectStr);

    const createRow = (item) => {
      const doc = _.cloneDeep(item);
      const biSignedDate = new Date(_.get(doc, 'biSignedDate', ''));
      _.set(doc, 'key', ['01', biSignedDate.getTime()]);
      _.set(doc, 'value.signDate', biSignedDate.getTime());
      // return doc;
      return _.omit(doc, ['biSignedDate']);
    };

    // console.log(' >>>>> matchStr=', JSON.stringify(matchStr));
    const result = [];
    const aggregateStrShield = _.cloneDeep(aggregateStr);
    const emitResult = await mongoose.connection.collection('application').aggregate(aggregateStr).toArray();
    // console.log(' >>>>> emitResult=', emitResult.length);
    if (!_.isEmpty(emitResult)) {
      _.forEach(emitResult, (emitItem) => {
        result.push(createRow(emitItem));
      });
    }

    const emitAgentResult = await mongoose.connection.collection('shieldApplication').aggregate(aggregateStrShield).toArray();
    if (!_.isEmpty(emitAgentResult)) {
      _.forEach(emitAgentResult, (emitItem) => {
        result.push(createRow(emitItem));
      });
    }
    // console.log(' >>>>> length=', result.length);
    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  async submission(req, res) {
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          approvalCaseId: '$approvalCaseId',
          status: '$approvalStatus',
          applicationId: '$applicationId',
          policyId: '$policyId',
          agentId: '$agentId',
          directorId: '$directorId',
          managerId: '$managerId',
          lastEditedDate: '$lastEditedDate',
          submittedDate: '$submittedDate',
          quotationId: '$quotationId',
          approveRejectDate: '$approveRejectDate',
          submisssionFlag: { $cond: { if: '$submisssionFlag', then: '$submisssionFlag', else: false } },
          isFACase: { $cond: { if: '$isFACase', then: '$isFACase', else: false } },
          caseLockedManagerCodebyStatus: { $cond: { if: '$caseLockedManagerCodebyStatus', then: '$caseLockedManagerCodebyStatus', else: '' } },
          isShield: { $cond: { if: '$isShield', then: '$isShield', else: false } },
          subApprovalList: { $cond: { if: '$subApprovalList', then: '$subApprovalList', else: [] } },
          approvalStatus: '$approvalStatus',
        },
        submittedDate: '$submittedDate',
        supervisorApproveRejectDate: '$supervisorApproveRejectDate',
        expiredDate: '$expiredDate',
      },

    };
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
    };

    let caseExpired = false;
    let caseSubmitdoc = false;
    let casePendingapproval = false;
    let caseLastedit = false;
    let casePendingForFAFirm = false;
    let caseExpiredNotification = false;
    let caseSecondaryProxyNotification = false;
    const expiredKeys = [];
    const submitdocKeys = [];
    const pendingapprovalKeys = [];
    const lasteditKeys = [];
    const pendingForFAFirmKeys = [];
    const expiredNotificationKeys = [];
    const secondaryProxyNotificationKeys = [];
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      const andWhere = [];
      if (startKeys.length > 2 && endKeys.length > 2) {
        if (_.isEqual(startKeys, endKeys)) {
          if (_.isEqual(startKeys[1], 'expired')) {
            caseExpired = true;
            const expiredKey = {};
            andWhere.push({ submittedDate: new Date(startKeys[2]).toISOString() });
            _.set(expiredKey, 'submittedDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ approvalStatus: startKeys[3] });
              _.set(expiredKey, 'approvalStatus', startKeys[3]);
            }
            expiredKeys.push(expiredKey);
          }
          if (_.isEqual(startKeys[1], 'submitdoc')) {
            caseSubmitdoc = true;
            const submitdocKey = {};
            andWhere.push({ approvalStatus: startKeys[2] });
            _.set(submitdocKey, 'approvalStatus', startKeys[2]);
            if (startKeys.length > 3) {
              _.set(submitdocKey, 'submisssionFlag', startKeys[3]);
              if (startKeys[3]) {
                andWhere.push({ submisssionFlag: startKeys[3] });
              } else {
                // andWhere.push({ submisssionFlag: { $ne: true } });
                andWhere.push({
                  $or: [
                    { submisssionFlag: false },
                    { submisssionFlag: { $exists: false } },
                  ],
                });
              }
            }
            submitdocKey.push(submitdocKey);
          }
          if (_.isEqual(startKeys[1], 'pendingapproval')) {
            casePendingapproval = true;
            const pendingapprovalKey = {};
            andWhere.push({ submittedDate: new Date(startKeys[2]).toISOString() });
            _.set(pendingapprovalKey, 'submittedDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ managerId: startKeys[3] });
              _.set(pendingapprovalKey, 'managerId', startKeys[3]);
            }
            if (startKeys.length > 4) {
              andWhere.push({ approvalStatus: startKeys[4] });
              _.set(pendingapprovalKey, 'approvalStatus', startKeys[4]);
            }
            pendingapprovalKeys.push(pendingapprovalKey);
          }
          if (_.isEqual(startKeys[1], 'lastedit')) {
            caseLastedit = true;
            const lasteditKey = {};
            andWhere.push({ lastEditedDate: new Date(startKeys[2]).toISOString() });
            _.set(lasteditKey, 'lastEditedDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ submittedDate: new Date(startKeys[3]).toISOString() });
              _.set(lasteditKey, 'submittedDate', new Date(startKeys[3]).toISOString());
            }
            if (startKeys.length > 4) {
              andWhere.push({ approvalStatus: startKeys[4] });
              _.set(lasteditKey, 'approvalStatus', startKeys[4]);
            }
            lasteditKeys.push(lasteditKey);
          }
          if (_.isEqual(startKeys[1], 'pendingForFAFirm')) {
            casePendingForFAFirm = true;
            const pendingForFAFirmKey = {};
            andWhere.push({ supervisorApproveRejectDate: new Date(startKeys[2]).toISOString() });
            _.set(pendingForFAFirmKey, 'supervisorApproveRejectDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ agentId: startKeys[3] });
              _.set(pendingForFAFirmKey, 'agentId', startKeys[3]);
            }
            if (startKeys.length > 4) {
              andWhere.push({ approvalStatus: startKeys[4] });
              _.set(pendingForFAFirmKey, 'approvalStatus', startKeys[4]);
            }
            pendingForFAFirmKeys.push(pendingForFAFirmKey);
          }
          if (_.isEqual(startKeys[1], 'expiredNotification')) {
            caseExpiredNotification = true;
            const expiredNotificationKey = {};
            andWhere.push({ expiredDate: new Date(startKeys[2]).toISOString() });
            _.set(expiredNotificationKey, 'expiredDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ approvalStatus: startKeys[3] });
              _.set(expiredNotificationKey, 'approvalStatus', startKeys[3]);
            }
            expiredNotificationKeys.push(expiredNotificationKey);
          }
          if (_.isEqual(startKeys[1], 'secondaryProxyNotification')) {
            caseSecondaryProxyNotification = true;
            const secondaryProxyNotificationKey = {};
            andWhere.push({ submittedDate: new Date(startKeys[2]).toISOString() });
            _.set(secondaryProxyNotificationKey, 'submittedDate', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              andWhere.push({ approvalStatus: startKeys[3] });
              _.set(secondaryProxyNotificationKey, 'approvalStatus', startKeys[3]);
            }
            secondaryProxyNotificationKeys.push(secondaryProxyNotificationKey);
          }
        } else {
          const expiredWhere = {};
          if (_.isEqual(startKeys[1], 'expired')) {
            caseExpired = true;
            _.set(expiredWhere, 'submittedDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              // if (startKeys[3] !== '0') {
              _.set(expiredWhere, 'approvalStatus.$gte', startKeys[3]);
              // }
            }
          }
          if (_.isEqual(endKeys[1], 'expired')) {
            caseExpired = true;
            _.set(expiredWhere, 'submittedDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              // if (endKeys[3] !== 'ZZZ') {
              _.set(expiredWhere, 'approvalStatus.$lte', endKeys[3]);
              // }
            }
          }
          if (!_.isEmpty(expiredWhere)) {
            andWhere.push(expiredWhere);
          }
          const submitDocWhere = {};
          if (_.isEqual(startKeys[1], 'submitdoc')) {
            caseSubmitdoc = true;
            _.set(submitDocWhere, 'approvalStatus.$gte', startKeys[2]);
            if (startKeys.length > 3) {
              if (startKeys[3]) {
                _.set(submitDocWhere, 'submisssionFlag', startKeys[3]);
              } else {
                // andWhere.push({ submisssionFlag: { $ne: true } });
                _.set(submitDocWhere, '$or', [
                  { submisssionFlag: false },
                  { submisssionFlag: { $exists: false } },
                ]);
              }
            }
          }
          if (_.isEqual(endKeys[1], 'submitdoc')) {
            caseSubmitdoc = true;
            _.set(submitDocWhere, 'approvalStatus.$lte', endKeys[2]);
            if (endKeys.length > 3) {
              if (endKeys[3]) {
                _.set(submitDocWhere, 'submisssionFlag', endKeys[3]);
              } else {
                // andWhere.push({ submisssionFlag: { $ne: true } });
                _.get(submitDocWhere, '$or', []).push({ submisssionFlag: false });
                _.get(submitDocWhere, '$or', []).push({ submisssionFlag: { $exists: false } });
              }
            }
          }
          if (!_.isEmpty(submitDocWhere)) {
            andWhere.push(submitDocWhere);
          }
          const pendingapprovalWhere = {};
          if (_.isEqual(startKeys[1], 'pendingapproval')) {
            casePendingapproval = true;
            _.set(pendingapprovalWhere, 'submittedDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              if (startKeys[3] !== '0') {
                _.set(pendingapprovalWhere, 'managerId.$gte', startKeys[3]);
              }
            }
            if (startKeys.length > 4) {
              // if (startKeys[4] !== '0') {
              _.set(pendingapprovalWhere, 'approvalStatus.$gte', startKeys[4]);
              // }
            }
          }
          if (_.isEqual(endKeys[1], 'pendingapproval')) {
            casePendingapproval = true;
            _.set(pendingapprovalWhere, 'submittedDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              if (endKeys[3] !== 'ZZZ') {
                _.set(pendingapprovalWhere, 'managerId.$lte', endKeys[3]);
              }
            }
            if (endKeys.length > 4) {
              _.set(pendingapprovalWhere, 'approvalStatus.$lte', endKeys[4]);
            }
          }
          if (!_.isEmpty(pendingapprovalWhere)) {
            andWhere.push(pendingapprovalWhere);
          }
          const lasteditWhere = {};
          if (_.isEqual(startKeys[1], 'lastedit')) {
            caseLastedit = true;
            _.set(lasteditWhere, 'lastEditedDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              _.set(lasteditWhere, 'submittedDate.$gte', new Date(startKeys[3]).toISOString());
            }
            if (startKeys.length > 4) {
              // if (startKeys[4] !== '0') {
              _.set(lasteditWhere, 'approvalStatus.$gte', startKeys[4]);
              // }
            }
          }
          if (_.isEqual(endKeys[1], 'lastedit')) {
            caseLastedit = true;
            _.set(lasteditWhere, 'lastEditedDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              _.set(lasteditWhere, 'submittedDate.$lte', new Date(endKeys[3]).toISOString());
            }
            if (endKeys.length > 4) {
              _.set(lasteditWhere, 'approvalStatus.$lte', endKeys[4]);
            }
          }
          if (!_.isEmpty(lasteditWhere)) {
            andWhere.push(lasteditWhere);
          }
          const pendingForFAFirmWhere = {};
          if (_.isEqual(startKeys[1], 'pendingForFAFirm')) {
            casePendingForFAFirm = true;
            _.set(pendingForFAFirmWhere, 'supervisorApproveRejectDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              if (startKeys[3] !== '0') {
                _.set(pendingForFAFirmWhere, 'agentId.$gte', startKeys[3]);
              }
            }
            if (startKeys.length > 4) {
              _.set(pendingForFAFirmWhere, 'approvalStatus.$gte', startKeys[4]);
            }
          }
          if (_.isEqual(endKeys[1], 'pendingForFAFirm')) {
            casePendingForFAFirm = true;
            _.set(pendingForFAFirmWhere, 'supervisorApproveRejectDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              if (endKeys[3] !== 'ZZZ') {
                _.set(pendingForFAFirmWhere, 'agentId.$lte', endKeys[3]);
              }
            }
            if (endKeys.length > 4) {
              _.set(pendingForFAFirmWhere, 'approvalStatus.$lte', endKeys[4]);
            }
          }
          if (!_.isEmpty(pendingForFAFirmWhere)) {
            andWhere.push(pendingForFAFirmWhere);
          }
          const expiredNotificationWhere = {};
          if (_.isEqual(startKeys[1], 'expiredNotification')) {
            caseExpiredNotification = true;
            _.set(expiredNotificationWhere, 'expiredDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              // if (startKeys[3] !== '0') {
              _.set(expiredNotificationWhere, 'approvalStatus.$gte', startKeys[3]);
              // }
            }
          }
          if (_.isEqual(endKeys[1], 'expiredNotification')) {
            caseExpiredNotification = true;
            _.set(expiredNotificationWhere, 'expiredDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              // if (endKeys[3] !== 'ZZZ') {
              _.set(expiredNotificationWhere, 'approvalStatus.$lte', endKeys[3]);
              // }
            }
          }
          if (!_.isEmpty(expiredNotificationWhere)) {
            andWhere.push(expiredNotificationWhere);
          }
          const secondaryProxyNotificationWhere = {};
          if (_.isEqual(startKeys[1], 'secondaryProxyNotification')) {
            caseSecondaryProxyNotification = true;
            _.set(secondaryProxyNotificationWhere, 'submittedDate.$gte', new Date(startKeys[2]).toISOString());
            if (startKeys.length > 3) {
              _.set(secondaryProxyNotificationWhere, 'approvalStatus.$gte', startKeys[3]);
            }
          }
          if (_.isEqual(endKeys[1], 'secondaryProxyNotification')) {
            caseSecondaryProxyNotification = true;
            _.set(secondaryProxyNotificationWhere, 'submittedDate.$lte', new Date(endKeys[2]).toISOString());
            if (endKeys.length > 3) {
              _.set(secondaryProxyNotificationWhere, 'approvalStatus.$lte', endKeys[3]);
            }
          }
          if (!_.isEmpty(secondaryProxyNotificationWhere)) {
            andWhere.push(secondaryProxyNotificationWhere);
          }
        }
        if (!_.isEmpty(andWhere)) {
          _.set(matchStr, '$match.$and', andWhere);
        }
      }
    } else if (keys !== '') {
      const keysList = JSON.parse(keys);
      const inArray = [];
      if (keysList && keysList.length > 0) {
        _.forEach(keysList, (keyItem) => {
          if (keyItem && keyItem.length > 2) {
            if (_.isEqual(keyItem[1], 'expired')) {
              caseExpired = true;
              const expiredKey = {};
              _.set(expiredKey, 'submittedDate', new Date(keyItem[2]).toISOString());
              if (keyItem.length > 3) {
                _.set(expiredKey, 'approvalStatus', keyItem[3]);
              }
              expiredKeys.push(_.cloneDeep(expiredKey));
              inArray.push(expiredKey);
            }
            if (_.isEqual(keyItem[1], 'submitdoc')) {
              caseSubmitdoc = true;
              const submitdocKey = {};
              _.set(submitdocKey, 'approvalStatus', keyItem[2]);
              if (keyItem.length > 3) {
                if (keyItem[3]) {
                  _.set(submitdocKey, 'submisssionFlag', keyItem[3]);
                } else {
                  _.set(submitdocKey, '$or', [
                    { submisssionFlag: false },
                    { submisssionFlag: { $exists: false } },
                  ]);
                }
              }
              if (keyItem.length > 3) {
                submitdocKeys.push({
                  approvalStatus: keyItem[2],
                  submisssionFlag: keyItem[3],
                });
              } else {
                submitdocKeys.push({
                  approvalStatus: keyItem[2],
                });
              }
              inArray.push(submitdocKey);
            }
            if (_.isEqual(keyItem[1], 'pendingapproval')) {
              casePendingapproval = true;
              const pendingapprovalKey = {};
              _.set(pendingapprovalKey, 'submittedDate', new Date(keyItem[2]).toISOString());
              if (keyItem.length > 3) {
                _.set(pendingapprovalKey, 'managerId', keyItem[3]);
              }
              if (keyItem.length > 4) {
                _.set(pendingapprovalKey, 'approvalStatus', keyItem[4]);
              }
              pendingapprovalKeys.push(_.cloneDeep(pendingapprovalKey));
              inArray.push(pendingapprovalKey);
            }
            if (_.isEqual(keyItem[1], 'lastedit')) {
              caseLastedit = true;
              const lasteditKey = {};
              _.set(lasteditKey, 'lastEditedDate', new Date(keyItem[2]).toISOString());
              if (keyItem.length > 3) {
                _.set(lasteditKey, 'submittedDate', new Date(keyItem[3]).toISOString());
              }
              if (keyItem.length > 4) {
                _.set(lasteditKey, 'approvalStatus', keyItem[4]);
              }
              lasteditKeys.push(_.cloneDeep(lasteditKey));
              inArray.push(lasteditKey);
            }
            if (_.isEqual(keyItem[1], 'pendingForFAFirm')) {
              casePendingForFAFirm = true;
              const pendingForFAFirmKey = {};
              _.set(pendingForFAFirmKey, 'supervisorApproveRejectDate', new Date(keyItem[2]).toISOString());
              if (keyItem.length > 3) {
                _.set(pendingForFAFirmKey, 'agentId', keyItem[3]);
              }
              if (keyItem.length > 4) {
                _.set(pendingForFAFirmKey, 'approvalStatus', keyItem[4]);
              }
              pendingForFAFirmKeys.push(_.cloneDeep(pendingForFAFirmKey));
              inArray.push(pendingForFAFirmKey);
            }
            if (_.isEqual(keyItem[1], 'expiredNotification')) {
              caseExpiredNotification = true;
              const expiredNotificationKey = {};
              _.set(expiredNotificationKey, 'expiredDate', new Date(keyItem[2]).toISOString());

              if (keyItem.length > 3) {
                _.set(expiredNotificationKey, 'approvalStatus', keyItem[3]);
              }
              expiredNotificationKeys.push(_.cloneDeep(expiredNotificationKey));
              inArray.push(expiredNotificationKey);
            }
            if (_.isEqual(keyItem[1], 'secondaryProxyNotification')) {
              caseSecondaryProxyNotification = true;
              const secondaryProxyNotificationKey = {};
              _.set(secondaryProxyNotificationKey, 'submittedDate', new Date(keyItem[2]).toISOString());
              if (keyItem.length > 3) {
                _.set(secondaryProxyNotificationKey, 'approvalStatus', keyItem[3]);
              }
              secondaryProxyNotificationKeys.push(_.cloneDeep(secondaryProxyNotificationKey));
              inArray.push(secondaryProxyNotificationKey);
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.set(matchStr, '$match.$or', inArray);
        // matchStr.$match = { $or: inArray };
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 2) {
        if (_.isEqual(keyJson[1], 'expired')) {
          caseExpired = true;
          const expiredKey = {};
          _.set(expiredKey, 'submittedDate', new Date(keyJson[2]).toISOString());
          if (keyJson.length > 3) {
            _.set(expiredKey, 'approvalStatus', keyJson[3]);
          }
          expiredKeys.push(_.cloneDeep(expiredKey));
          _.set(matchStr, '$match', expiredKey);
        }
        if (_.isEqual(keyJson[1], 'submitdoc')) {
          caseSubmitdoc = true;
          const submitdocKey = {};
          _.set(submitdocKey, 'approvalStatus', keyJson[2]);
          if (keyJson.length > 3) {
            if (keyJson[3]) {
              _.set(submitdocKey, 'submisssionFlag', keyJson[3]);
            } else {
              _.set(submitdocKey, '$or', [
                { submisssionFlag: false },
                { submisssionFlag: { $exists: false } },
              ]);
            }
          }
          if (keyJson.length > 3) {
            submitdocKeys.push({
              approvalStatus: keyJson[2],
              submisssionFlag: keyJson[3],
            });
          } else {
            submitdocKeys.push({
              approvalStatus: keyJson[2],
            });
          }
          _.set(matchStr, '$match', submitdocKeys);
        }
        if (_.isEqual(keyJson[1], 'pendingapproval')) {
          casePendingapproval = true;
          const pendingapprovalKey = {};
          _.set(pendingapprovalKey, 'submittedDate', new Date(keyJson[2]).toISOString());
          if (keyJson.length > 3) {
            _.set(pendingapprovalKey, 'managerId', keyJson[3]);
          }
          if (keyJson.length > 4) {
            _.set(pendingapprovalKey, 'approvalStatus', keyJson[4]);
          }
          pendingapprovalKeys.push(_.cloneDeep(pendingapprovalKey));
          _.set(matchStr, '$match', pendingapprovalKeys);
        }
        if (_.isEqual(keyJson[1], 'lastedit')) {
          caseLastedit = true;
          const lasteditKey = {};
          _.set(lasteditKey, 'lastEditedDate', new Date(keyJson[2]).toISOString());
          if (keyJson.length > 3) {
            _.set(lasteditKey, 'submittedDate', new Date(keyJson[3]).toISOString());
          }
          if (keyJson.length > 4) {
            _.set(lasteditKey, 'approvalStatus', keyJson[4]);
          }
          lasteditKeys.push(_.cloneDeep(lasteditKey));
          _.set(matchStr, '$match', lasteditKey);
        }
        if (_.isEqual(keyJson[1], 'pendingForFAFirm')) {
          casePendingForFAFirm = true;
          const pendingForFAFirmKey = {};
          _.set(pendingForFAFirmKey, 'supervisorApproveRejectDate', new Date(keyJson[2]).toISOString());
          if (keyJson.length > 3) {
            _.set(pendingForFAFirmKey, 'agentId', keyJson[3]);
          }
          if (keyJson.length > 4) {
            _.set(pendingForFAFirmKey, 'approvalStatus', keyJson[4]);
          }
          pendingForFAFirmKeys.push(_.cloneDeep(pendingForFAFirmKey));
          _.set(matchStr, '$match', pendingForFAFirmKey);
        }
        if (_.isEqual(keyJson[1], 'expiredNotification')) {
          caseExpiredNotification = true;
          const expiredNotificationKey = {};
          _.set(expiredNotificationKey, 'expiredDate', new Date(keyJson[2]).toISOString());

          if (keyJson.length > 3) {
            _.set(expiredNotificationKey, 'approvalStatus', keyJson[3]);
          }
          expiredNotificationKeys.push(_.cloneDeep(expiredNotificationKey));
          _.set(matchStr, '$match', expiredNotificationKey);
        }
        if (_.isEqual(keyJson[1], 'secondaryProxyNotification')) {
          caseSecondaryProxyNotification = true;
          const secondaryProxyNotificationKey = {};
          _.set(secondaryProxyNotificationKey, 'submittedDate', new Date(keyJson[2]).toISOString());
          if (keyJson.length > 3) {
            _.set(secondaryProxyNotificationKey, 'approvalStatus', keyJson[3]);
          }
          secondaryProxyNotificationKeys.push(_.cloneDeep(secondaryProxyNotificationKey));
          _.set(matchStr, '$match', secondaryProxyNotificationKey);
        }
      }
    } else {
      caseExpired = true;
      caseSubmitdoc = true;
      casePendingapproval = true;
      caseLastedit = true;
      casePendingForFAFirm = true;
      caseExpiredNotification = true;
      caseSecondaryProxyNotification = true;
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    aggregateStr.push(projectStr);
    const expiredResult = [];
    const submitdocResult = [];
    const pendingapprovalResult = [];
    const lasteditResult = [];
    const pendingForFAFirmResult = [];
    const expiredNotificationResult = [];
    const secondaryProxyNotificationResult = [];
    // console.log(' >>>>> matchStr=', JSON.stringify(aggregateStr));

    const escapeStatusForExpiryView = ['E', 'A', 'R'];
    const pendingForFAFirmStatus = ['PFAFA', 'PDocFAF', 'PDisFAF'];
    const omitColumn = ['submittedDate', 'supervisorApproveRejectDate', 'expiredDate'];

    const createRow = (doc, type) => {
      const approvalStatus = _.get(doc, 'value.approvalStatus', '');
      const submisssionFlag = _.get(doc, 'value.submisssionFlag', false);
      const isShield = _.get(doc, 'value.isShield', false);
      const managerId = _.get(doc, 'value.managerId', null);
      const longUTCSubmitDate = Date.parse(_.get(doc, 'submittedDate'));
      const longUTCLastEditDate = Date.parse(_.get(doc, 'value.lastEditedDate'));
      const longUTCSupervisorApproveRejectDate = Date.parse(_.get(doc, 'supervisorApproveRejectDate'));
      const expiredDate = _.get(doc, 'expiredDate');
      const agentId = _.get(doc, 'value.agentId', null);
      if (escapeStatusForExpiryView.indexOf(approvalStatus) === -1 && caseExpired
      && (_.isEmpty(expiredKeys)
      || (!_.isEmpty(expiredKeys) && _.some(expiredKeys, (it) => {
        const approvalStatusT = _.get(it, 'approvalStatus', '');
        const submittedDateT = _.get(it, 'submittedDate', '');
        return (
          ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
        && (
          (submittedDateT !== '' && submittedDateT === doc.submittedDate) || submittedDateT === ''));
      })
      ))) {
        const temp = _.omit(doc, omitColumn);
        _.set(temp, 'key', ['01', 'expired', longUTCSubmitDate, approvalStatus]);
        expiredResult.push(temp);
      }
      if (type === 'approval' && caseSubmitdoc && (_.isEmpty(expiredKeys)
      || (!_.isEmpty(submitdocKeys) && _.some(submitdocKeys, (it) => {
        const approvalStatusT = _.get(it, 'approvalStatus', '');
        const submisssionFlagT = _.get(it, 'submisssionFlag', false);
        return (
          ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
        && submisssionFlag === submisssionFlagT);
      })
      ))) {
        const temp = _.omit(doc, omitColumn);
        _.set(temp, 'key', ['01', 'submitdoc', approvalStatus, submisssionFlag]);
        submitdocResult.push(temp);
      }
      if (type === 'masterApproval' || !isShield) {
        if (casePendingapproval && (_.isEmpty(pendingapprovalKeys)
        || (!_.isEmpty(pendingapprovalKeys) && _.some(pendingapprovalKeys, (it) => {
          const managerIdT = _.get(it, 'managerId', '');
          const approvalStatusT = _.get(it, 'approvalStatus', '');
          const submittedDateT = _.get(it, 'submittedDate', '');
          return (
            ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
          && ((managerIdT !== '' && managerIdT === managerId) || managerIdT === '')
          && (
            (submittedDateT !== '' && submittedDateT === doc.submittedDate) || submittedDateT === ''));
        })
        ))) {
          const temp = _.omit(doc, omitColumn);
          _.set(temp, 'key', ['01', 'pendingapproval', longUTCSubmitDate, managerId, approvalStatus]);
          pendingapprovalResult.push(temp);
        }
        if (caseLastedit && (_.isEmpty(lasteditKeys)
        || (!_.isEmpty(lasteditKeys) && _.some(lasteditKeys, (it) => {
          const lastEditedDateT = _.get(it, 'lastEditedDate', '');
          const approvalStatusT = _.get(it, 'approvalStatus', '');
          const submittedDateT = _.get(it, 'submittedDate', '');
          return (
            ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
          && ((lastEditedDateT !== '' && lastEditedDateT === _.get(doc, 'value.lastEditedDate')) || lastEditedDateT === '')
          && (
            (submittedDateT !== '' && submittedDateT === doc.submittedDate) || submittedDateT === ''));
        })
        ))) {
          const temp = _.omit(doc, omitColumn);
          _.set(temp, 'key', ['01', 'lastedit', longUTCLastEditDate, longUTCSubmitDate, approvalStatus]);
          lasteditResult.push(temp);
        }


        if (pendingForFAFirmStatus.indexOf(approvalStatus) > -1 && casePendingForFAFirm
         && (_.isEmpty(pendingForFAFirmKeys)
        || (!_.isEmpty(pendingForFAFirmKeys) && _.some(pendingForFAFirmKeys, (it) => {
          const agentIdT = _.get(it, 'agentId', '');
          const approvalStatusT = _.get(it, 'approvalStatus', '');
          const supervisorApproveRejectDateT = _.get(it, 'supervisorApproveRejectDate', '');
          return (
            ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
          && ((agentIdT !== '' && agentIdT === agentId) || agentIdT === '')
          && (
            (supervisorApproveRejectDateT !== ''
             && supervisorApproveRejectDateT === doc.supervisorApproveRejectDate)
             || supervisorApproveRejectDateT === ''));
        })
        ))) {
          const temp = _.omit(doc, omitColumn);
          _.set(temp, 'key', ['01', 'pendingForFAFirm', longUTCSupervisorApproveRejectDate, agentId, approvalStatus]);
          pendingForFAFirmResult.push(temp);
        }
        if (approvalStatus === 'E' && expiredDate && caseExpiredNotification
        && (_.isEmpty(expiredNotificationKeys)
      || (!_.isEmpty(expiredNotificationKeys) && _.some(expiredNotificationKeys, (it) => {
        const approvalStatusT = _.get(it, 'approvalStatus', '');
        const expiredDateT = _.get(it, 'expiredDate', '');
        return (
          ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
        && (
          (expiredDateT !== '' && expiredDateT === expiredDate) || expiredDateT === ''));
      })
      ))) {
          const longUTCExpiredDate = Date.parse(expiredDate);
          const temp = _.omit(doc, omitColumn);
          _.set(temp, 'key', ['01', 'expiredNotification', longUTCExpiredDate, approvalStatus]);
          expiredNotificationResult.push(temp);
        }
        if (caseSecondaryProxyNotification
          && (_.isEmpty(expiredNotificationKeys)
      || (!_.isEmpty(expiredNotificationKeys) && _.some(expiredNotificationKeys, (it) => {
        const approvalStatusT = _.get(it, 'approvalStatus', '');
        const submittedDateT = _.get(it, 'submittedDate', '');
        return (
          ((approvalStatusT !== '' && approvalStatusT === approvalStatus) || approvalStatusT === '')
        && (
          (submittedDateT !== '' && submittedDateT === doc.submittedDate) || submittedDateT === ''));
      })
      ))) {
          const temp = _.omit(doc, omitColumn);
          _.set(temp, 'key', ['01', 'secondaryProxyNotification', longUTCSubmitDate, approvalStatus]);
          secondaryProxyNotificationResult.push(temp);
        }
      }
    };
    const emitResult = await mongoose.connection.collection('approval').aggregate(aggregateStr).toArray();
    // console.log(' >>>>> emitResult=', emitResult.length);
    if (!_.isEmpty(emitResult)) {
      _.forEach(emitResult, (emitItem) => {
        createRow(emitItem, 'approval');
      });
    }
    const emitShieldResult = await mongoose.connection.collection('shieldApproval').aggregate(aggregateStr).toArray();
    // console.log(' >>>>> emitResult=', emitResult.length);
    if (!_.isEmpty(emitShieldResult)) {
      _.forEach(emitShieldResult, (emitItem) => {
        createRow(emitItem, 'masterApproval');
      });
    }
    const resultTemp = {};
    const result = _.concat(expiredResult, submitdocResult,
      pendingapprovalResult, lasteditResult, pendingForFAFirmResult,
      expiredNotificationResult, secondaryProxyNotificationResult);
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
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
    // console.log(' >>>>> matchStr111=', JSON.stringify(mastAggregateStr));
    const emitMasterResult = await mongoose.connection.collection('shieldApplication').aggregate(mastAggregateStr).toArray();
    if (!_.isEmpty(emitMasterResult)) {
      result = _.concat(result, emitMasterResult);
    }

    const resultTemp = {};
    resultTemp.total_rows = result.length;
    resultTemp.rows = result;
    res.json(resultTemp);
  },
  submissionRptApps(req, res) {
    // doc.type === 'application') {
    //  emit(['01',  payment.initPayMethod],
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          id: '$id',
          policyNumber: '$policyNumber',
          pId: '$applicationForm.values.proposer.personalInfo.idCardNo',
          pName: '$applicationForm.values.proposer.personalInfo.fullName',
          aName: '$quotation.agent.name',
          aCode: '$quotation.agent.agentCode',
          bankRefId: '$applicationForm.values.proposer.personalInfo.branchInfo.bankRefId',
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
          quotation: '$quotation',
          planDetails: { $cond: { if: '$applicationForm.values.planDetails', then: '$applicationForm.values.planDetails', else: null } },
          productCode: '$quotation.baseProductCode',
        },
        branchInfo: '$applicationForm.values.proposer.personalInfo.branchInfo',
        dealerGroup: '$quotation.agent.dealerGroup',
      },
    };
    let caseSingPost = false;
    let caseDirect = false;
    const singPostKeys = [];
    const directKeys = [];
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        $and: [
          { 'quotation.agent': { $exists: true } },
          { 'applicationForm.values': { $exists: true } },
          { 'applicationForm.values.proposer': { $exists: true } },
          { 'applicationForm.values.proposer.personalInfo': { $exists: true } },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (startKeys.length > 1 && endKeys.length > 1) {
          if (_.isEqual(startKeys, endKeys)) {
            if (_.isEqual(startKeys[1], 'SINGPOST')) {
              caseSingPost = true;
              if (startKeys && startKeys.length > 2) {
                singPostKeys.push(startKeys[2]);
                _.get(matchStr, '$match.$and', []).push({
                  'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
                  'quotation.agent.dealerGroup': startKeys[1],
                  id: startKeys[2],
                });
              } else {
                _.get(matchStr, '$match.$and', []).push({
                  'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
                  'quotation.agent.dealerGroup': startKeys[1],
                });
              }
            } else if (_.isEqual(startKeys[1], 'DIRECT')) {
              caseDirect = true;
              if (startKeys && startKeys.length > 2) {
                directKeys.push(startKeys[2]);
                _.get(matchStr, '$match.$and', []).push({
                  'quotation.agent.dealerGroup': startKeys[1],
                  id: startKeys[2],
                });
              } else {
                _.get(matchStr, '$match.$and', []).push({
                  'quotation.agent.dealerGroup': startKeys[1],
                });
              }
            }
          } else if (_.isEqual(startKeys[1], endKeys[1])) {
            _.get(matchStr, '$match.$and', []).push({
              'quotation.agent.dealerGroup': startKeys[1],
            });
            if (_.isEqual(startKeys[1], 'SINGPOST')) {
              caseSingPost = true;
            }
            if (_.isEqual(startKeys[1], 'DIRECT')) {
              caseDirect = true;
            }
            const temp = {};
            if (startKeys.length > 2) {
              _.set(temp, '$gte', startKeys[2]);
            }
            if (endKeys.length > 2) {
              _.set(temp, '$lte', endKeys[2]);
            }
            if (!_.isEmpty(temp)) {
              _.get(matchStr, '$match.$and', []).push({
                id: temp,
              });
            }
          } else {
            _.get(matchStr, '$match.$and', []).push({
              'quotation.agent.dealerGroup': { $gte: startKeys[1], $lte: endKeys[1] },
            });
            if (_.isEqual(startKeys[1], 'SINGPOST') || _.isEqual(endKeys[1], 'SINGPOST')) {
              caseSingPost = true;
            }
            if (_.isEqual(startKeys[1], 'DIRECT') || _.isEqual(endKeys[1], 'DIRECT')) {
              caseDirect = true;
            }
            const temp = [];
            const tempId = {};
            if (startKeys.length > 2) {
              temp.push({
                'quotation.agent.dealerGroup': startKeys[1],
                id: { $gte: startKeys[2] },

              });
              _.set(tempId, '$gte', startKeys[2]);
            }
            if (endKeys.length > 2) {
              temp.push({
                'quotation.agent.dealerGroup': endKeys[1],
                id: { $lte: endKeys[2] },
              });
              _.set(tempId, '$lte', endKeys[2]);
            }
            if (startKeys.length > 2 && endKeys.length > 2) {
              temp.push({
                id: tempId,
              });
            }
            if (!_.isEmpty(temp)) {
              _.get(matchStr, '$match.$and', []).push({
                $or: temp,
              });
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
            if (_.isEqual(keyItem[1], 'SINGPOST')) {
              caseSingPost = true;
              if (keyItem && keyItem.length > 2) {
                singPostKeys.push(keyItem[2]);
                inArray.push({
                  'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
                  'quotation.agent.dealerGroup': keyItem[1],
                  id: keyItem[2],
                });
              } else {
                inArray.push({
                  'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
                  'quotation.agent.dealerGroup': keyItem[1],
                });
              }
            } else if (_.isEqual(keyItem[1], 'DIRECT')) {
              caseDirect = true;
              if (keyItem && keyItem.length > 2) {
                directKeys.push(keyItem[2]);
                inArray.push({
                  'quotation.agent.dealerGroup': keyItem[1],
                  id: keyItem[2],
                });
              } else {
                inArray.push({
                  'quotation.agent.dealerGroup': keyItem[1],
                });
              }
            }
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push(
          { $or: inArray },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        if (_.isEqual(keyJson[1], 'SINGPOST')) {
          caseSingPost = true;
          if (keyJson && keyJson.length > 2) {
            singPostKeys.push(keyJson[2]);
            _.get(matchStr, '$match.$and', []).push({
              'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
              'quotation.agent.dealerGroup': keyJson[1],
              id: keyJson[2],
            });
          } else {
            _.get(matchStr, '$match.$and', []).push({
              'applicationForm.values.proposer.personalInfo.branchInfo': { $exists: true },
              'quotation.agent.dealerGroup': keyJson[1],
            });
          }
        } else if (_.isEqual(keyJson[1], 'DIRECT')) {
          caseDirect = true;
          if (keyJson && keyJson.length > 2) {
            directKeys.push(keyJson[2]);
            _.get(matchStr, '$match.$and', []).push({
              'quotation.agent.dealerGroup': keyJson[1],
              id: keyJson[2],
            });
          } else {
            _.get(matchStr, '$match.$and', []).push({
              'quotation.agent.dealerGroup': keyJson[1],
            });
          }
        }
      }
    } else {
      _.get(matchStr, '$match.$and', []).push(
        { 'quotation.agent.dealerGroup': { $in: ['SINGPOST', 'DIRECT'] } },
      );
      caseSingPost = true;
      caseDirect = true;
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>matchStr= ', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { 'quotation.agent.dealerGroup': 1, id: 1 } });

    aggregateStr.push(projectStr);
    mongoose.connection.collection('application').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultSingPost = [];
        const resultDirect = [];
        // console.log('>>>>>>docs.length= ', docs.length);
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const branchInfo = _.get(item, 'branchInfo');
            if (caseSingPost && branchInfo && item.dealerGroup === 'SINGPOST' && (
              _.isEmpty(singPostKeys) || (!_.isEmpty(singPostKeys)
            && _.some(singPostKeys, it => (it === item.id)))
            )) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'SINGPOST', doc.id]);
              resultSingPost.push(_.omit(doc, ['branchInfo', 'dealerGroup']));
            }
            if (caseDirect && item.dealerGroup === 'DIRECT' && (
              _.isEmpty(directKeys) || (!_.isEmpty(directKeys)
            && _.some(directKeys, it => (it === item.id)))
            )) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'DIRECT', doc.id]);
              delete doc.value.bankRefId;
              resultDirect.push(_.omit(doc, ['branchInfo', 'dealerGroup']));
            }
          });
        }
        const result = _.concat(resultSingPost, resultDirect);
        const resultTemp = {};
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
  },
  submissionRptPendingDetails(req, res) {
    // doc.type === 'application') {
    //  emit(['01',  payment.initPayMethod],
    const aggregateStr = [];
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: [],
        value: {
          compCode: '$compCode',
          displayCaseNo: '$policyId',
          caseNo: '$policyId',
          product: '$productName',
          dealerGroup: '$dealerGroup',
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
    let caseSingPost = false;
    let caseDirect = false;
    const singPostKeys = [];
    const directKeys = [];
    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        $and: [
          { approvalStatus: { $in: ['SUBMITTED', 'PDoc', 'PDis'] } },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (startKeys.length > 1 && endKeys.length > 1) {
          if (_.isEqual(startKeys, endKeys)) {
            _.get(matchStr, '$match.$and', []).push({
              dealerGroup: startKeys[1],
            });
            if (startKeys && startKeys.length > 2) {
              _.get(matchStr, '$match.$and', []).push({
                lastEditedDate: new Date(startKeys[2]).toISOString(),
              });
            }
            if (_.isEqual(startKeys[1], 'SINGPOST')) {
              caseSingPost = true;
              if (startKeys && startKeys.length > 2) {
                directKeys.push(new Date(startKeys[2]).toISOString());
              }
            }
            if (_.isEqual(startKeys[1], 'DIRECT')) {
              caseDirect = true;
              if (startKeys && startKeys.length > 2) {
                directKeys.push(new Date(startKeys[2]).toISOString());
              }
            }
          } else if (_.isEqual(startKeys[1], endKeys[1])) {
            _.get(matchStr, '$match.$and', []).push({
              dealerGroup: startKeys[1],
            });
            if (_.isEqual(startKeys[1], 'SINGPOST')) {
              caseSingPost = true;
            }
            if (_.isEqual(startKeys[1], 'DIRECT')) {
              caseDirect = true;
            }
            const temp = {};
            if (startKeys.length > 2) {
              _.set(temp, '$gte', new Date(startKeys[2]).toISOString());
            }
            if (endKeys.length > 2) {
              _.set(temp, '$lte', new Date(endKeys[2]).toISOString());
            }
            if (!_.isEmpty(temp)) {
              _.get(matchStr, '$match.$and', []).push({
                lastEditedDate: temp,
              });
            }
          } else {
            _.get(matchStr, '$match.$and', []).push({
              dealerGroup: { $gte: startKeys[1], $lte: endKeys[1] },
            });
            if (_.isEqual(startKeys[1], 'SINGPOST') || _.isEqual(endKeys[1], 'SINGPOST')) {
              caseSingPost = true;
            }
            if (_.isEqual(startKeys[1], 'DIRECT') || _.isEqual(endKeys[1], 'DIRECT')) {
              caseDirect = true;
            }
            const temp = [];
            const tempLastEditedDate = {};
            if (startKeys.length > 2) {
              temp.push({
                dealerGroup: startKeys[1],
                lastEditedDate: { $gte: new Date(startKeys[2]).toISOString() },
              });
              _.set(tempLastEditedDate, '$gte', new Date(startKeys[2]).toISOString());
            }
            if (endKeys.length > 2) {
              temp.push({
                dealerGroup: endKeys[1],
                lastEditedDate: { $lte: new Date(endKeys[2]).toISOString() },
              });
              _.set(tempLastEditedDate, '$lte', new Date(endKeys[2]).toISOString());
            }
            if (startKeys.length > 2 && endKeys.length > 2) {
              temp.push({
                lastEditedDate: tempLastEditedDate,
              });
            }
            if (!_.isEmpty(temp)) {
              _.get(matchStr, '$match.$and', []).push({
                $or: temp,
              });
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
            const temp = {};
            _.set(temp, 'dealerGroup', keyItem[1]);
            if (_.isEqual(keyItem[1], 'SINGPOST')) {
              caseSingPost = true;
              if (keyItem && keyItem.length > 2) {
                singPostKeys.push(new Date(keyItem[2]).toISOString());
                _.set(temp, 'lastEditedDate', new Date(keyItem[2]).toISOString());
              }
            } else if (_.isEqual(keyItem[1], 'DIRECT')) {
              caseDirect = true;
              if (keyItem && keyItem.length > 2) {
                directKeys.push(new Date(keyItem[2]).toISOString());
                _.set(temp, 'lastEditedDate', new Date(keyItem[2]).toISOString());
              }
            }
            inArray.push(temp);
          }
        });
      }
      if (!_.isEmpty(inArray)) {
        _.get(matchStr, '$match.$and', []).push(
          { $or: inArray },
        );
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.get(matchStr, '$match.$and', []).push({
          dealerGroup: keyJson[1],
        });
        if (_.isEqual(keyJson[1], 'SINGPOST')) {
          caseSingPost = true;
          if (keyJson && keyJson.length > 2) {
            singPostKeys.push(new Date(keyJson[2]).toISOString());
            _.get(matchStr, '$match.$and', []).push({
              lastEditedDate: new Date(keyJson[2]).toISOString(),
            });
          }
        } else if (_.isEqual(keyJson[1], 'DIRECT')) {
          caseDirect = true;
          if (keyJson && keyJson.length > 2) {
            directKeys.push(new Date(keyJson[2]).toISOString());
            _.get(matchStr, '$match.$and', []).push({
              lastEditedDate: new Date(keyJson[2]).toISOString(),
            });
          }
        }
      }
    } else {
      _.get(matchStr, '$match.$and', []).push(
        { dealerGroup: { $in: ['SINGPOST', 'DIRECT'] } },
      );
      caseSingPost = true;
      caseDirect = true;
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>matchStr= ', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { dealerGroup: 1, lastEditedDate: 1 } });

    aggregateStr.push(projectStr);
    mongoose.connection.collection('approval').aggregate(aggregateStr).toArray((err, docs) => {
      if (err) {
        res.json({ status: 400, message: err.message });
      } else {
        const resultSingPost = [];
        const resultDirect = [];
        // console.log('>>>>>>docs.length= ', docs.length);
        if (docs && docs.length > 0) {
          _.forEach(docs, (item) => {
            const dealerGroup = _.get(item, 'value.dealerGroup', '');
            const lastEditedDate = _.get(item, 'value.lastEditedDate', '');
            if (caseSingPost && dealerGroup === 'SINGPOST' && (
              _.isEmpty(singPostKeys) || (!_.isEmpty(singPostKeys)
            && _.some(singPostKeys, it => (it === lastEditedDate)))
            )) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'SINGPOST', Date.parse(lastEditedDate)]);
              resultSingPost.push(doc);
            }
            if (caseDirect && item.dealerGroup === 'DIRECT' && (
              _.isEmpty(directKeys) || (!_.isEmpty(directKeys)
            && _.some(directKeys, it => (it === lastEditedDate)))
            )) {
              const doc = _.cloneDeep(item);
              _.set(doc, 'key', ['01', 'DIRECT', Date.parse(lastEditedDate)]);
              resultDirect.push(doc);
            }
          });
        }
        const result = _.concat(resultSingPost, resultDirect);
        const resultTemp = {};
        resultTemp.total_rows = result.length;
        resultTemp.rows = result;
        res.json(resultTemp);
      }
    });
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
    const matchStr = {
      $match: {
        $or: [
          {
            quickQuote: false,
          },
          {
            quickQuote: { $exists: false },
          },
        ],
      },
    };
    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        const where = {
          $or: [
            {
              quickQuote: false,
            },
            {
              quickQuote: { $exists: false },
            },
          ],
        };
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
        matchStr.$match = {
          $and: [
            {
              $or: [
                {
                  quickQuote: false,
                },
                {
                  quickQuote: { $exists: false },
                },
              ],
            },

            { $or: inArray },
          ],
        };
      }
    }
    // else if (key !== '' && key !== '[null]') {

    // }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
      aggregateStr.push({ $sort: { pCid: 1, id: 1 } });
    }
    // console.log('?????>>>>  ', matchStr);
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
  validBundleById(req, res) {
    const aggregateStr = [];
    // This is the query result and alias -> projectStr
    const projectStr = {
      $project: {
        _id: 0, // 0 is not selected
        id: '$id',
        key: ['01', '$id'],
        value: {
          id: '$id',
          fna: '$fna',
        },
      },
    };

    const startKey = req.query.startkey || '';
    const endKey = req.query.endkey || '';
    const keys = req.query.keys || '';
    const key = req.query.key || '';
    const matchStr = {
      $match: {
        isValid: true,
      },
    };

    if (startKey !== '' && endKey !== '') {
      const startKeys = JSON.parse(startKey);
      const endKeys = JSON.parse(endKey);
      if (startKeys || endKeys) {
        if (_.isEqual(startKeys, endKeys)) {
          if (startKeys.length > 1) {
            _.set(matchStr, '$match.id', startKeys[1]);
          }
        } else {
          if (startKeys && startKeys.length > 1) {
            _.set(matchStr, '$match.id.$gte', startKeys[1]);
          }

          if (endKeys && endKeys.length > 1) {
            _.set(matchStr, '$match.id.$lte', endKeys[1]);
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
        _.set(matchStr, '$match.id', { $in: inArray });
      }
    } else if (key !== '' && key !== '[null]') {
      const keyJson = JSON.parse(key);
      if (keyJson && keyJson.length > 1) {
        _.set(matchStr, '$match.id', keyJson[1]);
      }
    }
    if (!_.isEmpty(matchStr)) {
      aggregateStr.push(matchStr);
    }
    // console.log('>>>>>>  matchStr', JSON.stringify(matchStr));
    aggregateStr.push({ $sort: { id: 1 } });
    aggregateStr.push(projectStr);

    mongoose.connection.collection('fna').aggregate(aggregateStr).toArray((err, docs) => {
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
