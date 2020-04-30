import express from 'express';
import indexController from '../controller/index.controller';

const router = express.Router();

router.get('/getDoc/:docId', indexController.api.getDoc);
router.get('/getDocById/:docId', indexController.api.getDocById);
router.put('/insertDoc/:docId', indexController.api.insertDoc);
router.put('/updateDoc/:docId', indexController.api.updateDoc);
router.get('/deleteDoc/:docId', indexController.api.deleteDoc);
router.get('/getAttachtment/:docType/:docId', indexController.api.getAttachtment);
router.get('/insertAttachtment/:docType/:docId', indexController.api.insertAttachtment);
router.get('/updateAttachtment/:docType/:docId', indexController.api.updateAttachtment);
router.get('/deleteAttachtment/:docType/:docId', indexController.api.deleteAttachtment);
export default router;
