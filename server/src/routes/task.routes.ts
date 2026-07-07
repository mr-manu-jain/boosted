import { Router } from 'express';
import { archiveTask, updateTask } from '../controllers/task.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const taskRouter = Router();

taskRouter.patch('/:id', asyncHandler(updateTask));
taskRouter.delete('/:id', asyncHandler(archiveTask));
