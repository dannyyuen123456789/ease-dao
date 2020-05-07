
// const $CheckApiToken = require('../controller/checkApiToken')

const express = require('express');

const router = express.Router();

const $main = require('../controller/view/main_controller.js');
const $approval = require('../controller/view/approval_controller.js');
const $dataSync = require('../controller/view/dataSync_controller.js');
const $invalidateViews = require('../controller/view/invalidateViews_controller.js');


router.get('/main/_view/contacts', $main.api.contacts);
router.get('/main/_view/applicationsByAgent', $main.api.applicationsByAgent);


router.get('/dataSync/_view/agentDocuments', $dataSync.api.agentDocuments);
router.get('/approval/_view/approvalDetails', $approval.api.approvalDetails);


router.get('/invalidateViews/_view/quotationsByBaseProductCode', $invalidateViews.api.quotationsByBaseProductCode);
router.get('/invalidateViews/_view/quotationsByNHAFFund', $invalidateViews.api.quotationsByNHAFFund);
router.get('/invalidateViews/_view/validBundleInClient', $invalidateViews.api.validBundleInClient);

// _design/main/_view/masterApprovalDetails
// router.get('/:dName/_view/masterApprovalDetails', $main.api.masterApprovalDetails);


module.exports = router;
