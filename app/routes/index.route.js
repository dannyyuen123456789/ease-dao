import express from 'express';
import indexController from '../controller/index.controller';

const router = express.Router();

router.get('/getDoc/:docId', indexController.api.getDoc);
router.put('/insertDoc/:docId', indexController.api.insertDoc);
router.put('/updateDoc/:docId', indexController.api.updateDoc);
router.delete('/deleteDoc/:docId', indexController.api.deleteDoc);
router.get('/getAttachtment/:docId/:attachment', indexController.api.getAttachtment);
router.get('/getAttachtmentUrl/:docId/:attachment', indexController.api.getAttachtmentUrl);
router.put('/uploadAttachmentByBase64/:docId/:attachment', indexController.api.uploadAttachmentByBase64);
router.put('/uploadAttachment/:docId/:attchId', indexController.api.uploadAttachment);
router.get('/delAttachment/:docId/:attchId', indexController.api.delAttachment);
export default router;
