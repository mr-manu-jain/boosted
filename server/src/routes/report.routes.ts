import { Router } from 'express';
import { reportHeatmap, reportSummary } from '../controllers/report.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportRouter = Router();

reportRouter.get('/summary', asyncHandler(reportSummary));
reportRouter.get('/heatmap', asyncHandler(reportHeatmap));
