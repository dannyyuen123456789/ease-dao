const express = require('express');

const router = express.Router();

const $check = require('../controller/view/checkConnection_controller.js');
const $main = require('../controller/view/main_controller.js');
const $approval = require('../controller/view/approval_controller.js');
const $dataAnalyze = require('../controller/view/dataAnalyze_controller.js');

const $dataSync = require('../controller/view/dataSync_controller.js');
const $invalidateViews = require('../controller/view/invalidateViews_controller.js');
const $report = require('../controller/view/report_controller.js');

router.get('/main/_view/contacts', $check.api.check, $main.api.contacts);
router.get('/main/_view/applicationsByAgent', $check.api.check, $main.api.applicationsByAgent);
router.get('/main/_view/approvalDetails', $check.api.check, $main.api.approvalDetails);
router.get('/main/_view/directorDownline', $check.api.check, $main.api.directorDownline);
router.get('/main/_view/downloadMaterial', $check.api.check, $main.api.downloadMaterial);
router.get('/main/_view/funds', $check.api.check, $main.api.funds);
router.get('/main/_view/healthDeclarationNotification', $check.api.check, $main.api.healthDeclarationNotification);
router.get('/main/_view/inProgressQuotFunds', $check.api.check, $main.api.inProgressQuotFunds);
router.get('/main/_view/managerDownline', $check.api.check, $main.api.managerDownline);
router.get('/main/_view/masterApprovalDetails', $check.api.check, $main.api.masterApprovalDetails);
router.get('/main/_view/pdfTemplates', $check.api.check, $main.api.pdfTemplates);
router.get('/main/_view/quickQuotes', $check.api.check, $main.api.quickQuotes);
router.get('/main/_view/quotationByAgent', $check.api.check, $main.api.quotationByAgent);
router.get('/main/_view/quotationCampaign', $check.api.check, $main.api.quotationCampaign);
router.get('/main/_view/summaryApps', $check.api.check, $main.api.summaryApps);
router.get('/main/_view/summaryQuots', $check.api.check, $main.api.summaryQuots);
router.get('/main/_view/systemNotification', $check.api.check, $main.api.systemNotification);
router.get('/main/_view/validbundleApplicationsByAgent', $check.api.check, $main.api.validbundleApplicationsByAgent);
router.get('/main/_view/agentDetails', $check.api.check, $main.api.agentDetails);
router.get('/main/_view/agentWithDescendingOrder', $check.api.check, $main.api.agentWithDescendingOrder);
router.get('/main/_view/agents', $check.api.check, $main.api.agents);
router.get('/main/_view/allChannelApprovalCases', $check.api.check, $main.api.allChannelApprovalCases);
router.get('/main/_view/appByPolNum', $check.api.check, $main.api.appByPolNum);
router.get('/main/_view/appWithSubmitDate', $check.api.check, $main.api.appWithSubmitDate);
router.get('/main/_view/appWithoutSubmitDate', $check.api.check, $main.api.appWithoutSubmitDate);
router.get('/main/_view/approvalApp', $check.api.check, $main.api.approvalApp);
router.get('/main/_view/approvalCases', $check.api.check, $main.api.approvalCases);
router.get('/main/_view/approvalDateCases', $check.api.check, $main.api.approvalDateCases);
router.get('/main/_view/bundleApp', $check.api.check, $main.api.bundleApp);
router.get('/main/_view/bundleApplications', $check.api.check, $main.api.bundleApplications);
router.get('/main/_view/cpfApps', $check.api.check, $main.api.cpfApps);
router.get('/main/_view/naById', $check.api.check, $main.api.naById);
router.get('/main/_view/onlinePayment', $check.api.check, $main.api.onlinePayment);
router.get('/main/_view/products', $check.api.check, $main.api.products);
router.get('/main/_view/signatureExpire', $check.api.check, $main.api.signatureExpire);
router.get('/main/_view/submission', $check.api.check, $main.api.submission);
router.get('/main/_view/submissionRptApps', $check.api.check, $main.api.submissionRptApps);
router.get('/main/_view/submissionRptPendingDetails', $check.api.check, $main.api.submissionRptPendingDetails);
router.get('/main/_view/validBundleById', $check.api.check, $main.api.validBundleById);


router.get('/dataSync/_view/agentDocuments', $check.api.check, $dataSync.api.agentDocuments);
router.get('/approval/_view/approvalDetails', $check.api.check, $approval.api.approvalDetails);

router.get('/dataAnalyze/_view/documentByLstChgDate', $check.api.check, $dataAnalyze.api.documentByLstChgDate);
router.get('/dataAnalyze/_view/documentsWithoutLstChgDate', $check.api.check, $dataAnalyze.api.documentsWithoutLstChgDate);


router.get('/invalidateViews/_view/quotationsByBaseProductCode', $check.api.check, $invalidateViews.api.quotationsByBaseProductCode);
router.get('/invalidateViews/_view/quotationsByNHAFFund', $check.api.check, $invalidateViews.api.quotationsByNHAFFund);
router.get('/invalidateViews/_view/validBundleInClient', $check.api.check, $invalidateViews.api.validBundleInClient);


router.get('/report/_view/agentsDetail', $check.api.check, $report.api.agentsDetail);
router.get('/report/_view/allChannelAppCases', $check.api.check, $report.api.allChannelAppCases);
router.get('/report/_view/allChannelPolicyCases', $check.api.check, $report.api.allChannelPolicyCases);
router.get('/report/_view/webvsiosReport', $check.api.check, $report.api.webvsiosReport);


module.exports = router;
