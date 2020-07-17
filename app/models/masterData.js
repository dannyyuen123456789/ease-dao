const mongoose = require('mongoose');

const testDataModel = new mongoose.Schema({
  id: {
    type: String,
  },
  planInd: {
    type: String,
  },
  compCode: {
    type: String,
  },
  covCode: {
    type: String,
  },
  covName: {
    type: Object,
  },
  version: {
    type: Number,
  },
  planCode: {
    type: String,
  },
  productLine: {
    type: String,
  },
  productCategory: {
    type: String,
  },
  smokeInd: {
    type: String,
  },
  genderInd: {
    type: String,
  },
  ctyGroup: {
    type: Array,
  },
  entryAge: {
    type: Array,
  },
  currencies: {
    type: Array,
  },
  quotForm: {
    type: String,
  },
  effDate: {
    type: String,
  },
  expDate: {
    type: String,
  },
  prodFeature: {
    type: Object,
  },
  keyRisk: {
    type: String,
  },
  insuredAgeDesc: {
    type: Object,
  },
  payModeDesc: {
    type: Object,
  },
  polTermDesc: {
    type: Object,
  },
  premTermDesc: {
    type: Object,
  },
  illustrationInd: {
    type: String,
  },
  scrOrderSeq: {
    type: Number,
  },
  tnc: {
    type: String,
  },
}, { collection: 'masterData', strict: false, minimize: false });

module.exports = mongoose.model('masterData', testDataModel);
