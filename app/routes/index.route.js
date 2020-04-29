import express from 'express';
import indexController from '../controller/index.controller';

const router = express.Router();

router.get('/getDoc/:docType/:docId', indexController.api.getDoc);
router.get('/getDocById/:docType/:docId', indexController.api.getDoc);
router.get('/insertDoc/:docType/:docId', indexController.api.getDoc);
router.get('/updateDoc/:docType/:docId', indexController.api.getDoc);
router.get('/deleteDoc/:docType/:docId', indexController.api.getDoc);
router.get('/getAttachtment/:docType/:docId', indexController.api.getDoc);
router.get('/insertAttachtment/:docType/:docId', indexController.api.getDoc);
router.get('/updateAttachtment/:docType/:docId', indexController.api.getDoc);
router.get('/deleteAttachtment/:docType/:docId', indexController.api.getDoc);
export default router;
