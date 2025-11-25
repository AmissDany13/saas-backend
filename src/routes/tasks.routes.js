import { Router } from 'express';
import { requireAuth } from '../config/auth.js';
import { checkProjectAccess, requireOwner, requireWriter, requireEditorOrOwner } from '../middleware/authz.js';
import { registerAction } from '../middleware/activityLogger.js';
import { listTasks, createTask, patchTask } from '../controllers/tasks.controller.js';
import { deleteTask } from "../controllers/tasks.controller.js";

const r = Router();

r.get('/proyectos/:id/tareas', 
    requireAuth, 
    checkProjectAccess, 
    listTasks);

r.post('/proyectos/:id/tareas', 
    requireAuth, 
    checkProjectAccess, 
    requireWriter,
    registerAction("TASK_CREATED"),
    createTask);

r.patch('/proyectos/:id/tareas/:taskId',
    requireAuth, 
    checkProjectAccess,
    requireWriter,
    registerAction("TASK_UPDATED"),
    patchTask);

r.delete('/proyectos/:id/tareas/:taskId',
  requireAuth,
  checkProjectAccess,
  requireWriter,
  deleteTask,
  registerAction("TASK_DELETED")
);

export default r;
