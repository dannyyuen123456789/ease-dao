
// const $CheckApiToken = require('../controller/checkApiToken')

const express = require('express');

const router = express.Router();

const $main = require('../controller/view/main_controller.js');
const $approval = require('../controller/view/approval_controller.js');
const $dataAnalyze = require('../controller/view/dataAnalyze_controller.js');

const $dataSync = require('../controller/view/dataSync_controller.js');
const $invalidateViews = require('../controller/view/invalidateViews_controller.js');


router.get('/main/_view/contacts', $main.api.contacts);
router.get('/main/_view/applicationsByAgent', $main.api.applicationsByAgent);
router.get('/main/_view/approvalDetails', $main.api.approvalDetails);
router.get('/main/_view/directorDownline', $main.api.directorDownline);
router.get('/main/_view/inProgressQuotFunds', $main.api.inProgressQuotFunds);
router.get('/main/_view/managerDownline', $main.api.managerDownline);
router.get('/main/_view/masterApprovalDetails', $main.api.masterApprovalDetails);
router.get('/main/_view/pdfTemplates', $main.api.pdfTemplates);
router.get('/main/_view/quickQuotes', $main.api.quickQuotes);
router.get('/main/_view/quotationByAgent', $main.api.quotationByAgent);
router.get('/main/_view/quotationCampaign', $main.api.quotationCampaign);
router.get('/main/_view/summaryApps', $main.api.summaryApps);
router.get('/main/_view/summaryQuots', $main.api.summaryQuots);
router.get('/main/_view/systemNotification', $main.api.systemNotification);
router.get('/main/_view/validbundleApplicationsByAgent', $main.api.validbundleApplicationsByAgent);
router.get('/main/_view/agentDetails', $main.api.agentDetails);
router.get('/main/_view/agentWithDescendingOrder', $main.api.agentWithDescendingOrder);
router.get('/main/_view/agents', $main.api.agents);
router.get('/main/_view/allChannelApprovalCases', $main.api.allChannelApprovalCases);
router.get('/main/_view/appByPolNum', $main.api.appByPolNum);
router.get('/main/_view/appWithSubmitDate', $main.api.appWithSubmitDate);
router.get('/main/_view/appWithoutSubmitDate', $main.api.appWithoutSubmitDate);
router.get('/main/_view/approvalApp', $main.api.approvalApp);
router.get('/main/_view/approvalCases', $main.api.approvalCases);
router.get('/main/_view/approvalDateCases', $main.api.approvalDateCases);
router.get('/main/_view/bundleApp', $main.api.bundleApp);
router.get('/main/_view/bundleApplications', $main.api.bundleApplications);
router.get('/main/_view/cpfApps', $main.api.cpfApps);


router.get('/dataSync/_view/agentDocuments', $dataSync.api.agentDocuments);
router.get('/approval/_view/approvalDetails', $approval.api.approvalDetails);

router.get('/dataAnalyze/_view/documentByLstChgDate', $dataAnalyze.api.documentByLstChgDate);
router.get('/dataAnalyze/_view/documentsWithoutLstChgDate', $dataAnalyze.api.documentsWithoutLstChgDate);


router.get('/invalidateViews/_view/quotationsByBaseProductCode', $invalidateViews.api.quotationsByBaseProductCode);
router.get('/invalidateViews/_view/quotationsByNHAFFund', $invalidateViews.api.quotationsByNHAFFund);
router.get('/invalidateViews/_view/validBundleInClient', $invalidateViews.api.validBundleInClient);

// _design/main/_view/masterApprovalDetails
// router.get('/:dName/_view/masterApprovalDetails', $main.api.masterApprovalDetails);


module.exports = router;
