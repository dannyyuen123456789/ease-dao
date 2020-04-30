import mongoose from 'mongoose';

const _ = require('lodash');

exports.api = {
  contacts(req, res, next) {
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
          'fullName ': '$fullName',
          nameOrder: '$nameOrder',
          mobileNo: '$mobileNo',
          email: '$email',
          photo: '$photo',
          applicationCount: { $cond: { if: '$applicationCount', then: '$applicationCount', else: 0 } },
          //  "applicationCount": {"$max": ["$applicationCount", 0]}}
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
      if (startkeys.length > 1 && endkeys.length > 1) {
        if (_.isEqual(startkeys, endkeys)) {
          matchStr.$match = { agentId: startkeys[1] };
        } else {
          matchStr.$match = { agentId: { $gte: startkeys[1], $lte: endkeys[1] } };
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
    //  console.log(" >>>>> aggregateStr=", JSON.stringify(aggregateStr));
    aggregateStr.push(projectStr);
    mongoose.connection.collection('cust').aggregate(aggregateStr).toArray((err, docs) => {
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
