import { Router } from 'express';
import {
  createManualEntry,
  deleteEntry,
  getRunning,
  listEntries,
  startEntry,
  stopEntry,
  updateEntry,
} from '../controllers/entry.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const entryRouter = Router();

entryRouter.get('/running', asyncHandler(getRunning));
entryRouter.post('/start', asyncHandler(startEntry));
entryRouter.post('/:id/stop', asyncHandler(stopEntry));
entryRouter.get('/', asyncHandler(listEntries));
entryRouter.post('/', asyncHandler(createManualEntry));
entryRouter.patch('/:id', asyncHandler(updateEntry));
entryRouter.delete('/:id', asyncHandler(deleteEntry));
