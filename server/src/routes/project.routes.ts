import { Router } from 'express';
import {
  archiveProject,
  createProject,
  listProjects,
  projectStats,
  updateProject,
} from '../controllers/project.controller.js';
import { createTask, listTasks } from '../controllers/task.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const projectRouter = Router();

projectRouter.get('/', asyncHandler(listProjects));
projectRouter.post('/', asyncHandler(createProject));
projectRouter.patch('/:id', asyncHandler(updateProject));
projectRouter.delete('/:id', asyncHandler(archiveProject));

projectRouter.get('/:projectId/tasks', asyncHandler(listTasks));
projectRouter.get('/:projectId/stats', asyncHandler(projectStats));
projectRouter.post('/:projectId/tasks', asyncHandler(createTask));
