import mongoose from 'mongoose';

const _ = require('lodash');

exports.api = {
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
        quotType: '$quotType',
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
    const masterApplicationResult = await mongoose.connection.collection('masterApplication').aggregate(aggregateStr).toArray();
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
};
