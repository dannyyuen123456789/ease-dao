import express from 'express';
import indexController from '../controller/index.controller';

const router = express.Router();

router.get('/getDoc/:docId', indexController.api.getDoc);
router.put('/updateDoc/:docId', indexController.api.updateDoc);
router.delete('/deleteDoc/:docId', indexController.api.deleteDoc);
router.get('/getAttachment/:docId/:attachment', indexController.api.getAttachment);
router.get('/getAttachmentUrl/:docId/:attachment', indexController.api.getAttachmentUrl);
router.put('/uploadAttachmentByBase64/:docId/:attachment', indexController.api.uploadAttachmentByBase64);
router.delete('/delAttachment/:docId/:attachment', indexController.api.delAttachment);

export default router;
