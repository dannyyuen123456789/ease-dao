
// const $CheckApiToken = require('../controller/checkApiToken')

var express = require('express');
var router = express.Router();
 
var $main = require('../controller/view/main_controller.js');
var $approval = require('../controller/view/approval_controller.js');



router.get('/main/_view/contacts', $main.api.contacts);

router.get('/approval/_view/approvalDetails', $approval.api.approvalDetails);
// _design/main/_view/masterApprovalDetails
// router.get('/:dName/_view/masterApprovalDetails', $main.api.masterApprovalDetails);


module.exports = router;
