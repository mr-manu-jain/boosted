import { Router } from 'express';
import { glanceDay, glanceWeek } from '../controllers/glance.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const glanceRouter = Router();

glanceRouter.get('/day', asyncHandler(glanceDay));
glanceRouter.get('/week', asyncHandler(glanceWeek));
