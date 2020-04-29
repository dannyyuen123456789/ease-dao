import express from 'express';
import {
  generalSuccessResponse,
  generalBadRequestResponse,
  generalInternalServerErrorResponse,
  customResponse,
} from '../utils/response.util';

const router = express.Router();

router.get('/200', (req, res) => {
  generalSuccessResponse(res, '200 test successfully');
});

router.get('/400', (req, res) => {
  generalBadRequestResponse(res, '400 test successfully');
});

router.get('/500', (req, res) => {
  generalInternalServerErrorResponse(res, '500 test successfully');
});

router.get('/201', (req, res) => {
  customResponse(res, '201', 'custom status test successfully');
});

export default router;
