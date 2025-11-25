import { Router } from "express";
import { requireAuth } from "../config/auth.js";
import { checkProjectAccess } from "../middleware/authz.js";
import { listProjectActivity, listTaskActivity } from "../models/activity.js";

const r = Router();

r.get(
  "/proyectos/:id/activity",
  requireAuth,
  checkProjectAccess,
  async (req, res) => {
    const docs = await listProjectActivity(req.params.id);
    res.json(docs);
  }
);

r.get(
  "/proyectos/:id/tareas/:taskId/activity",
  requireAuth,
  checkProjectAccess,
  async (req, res) => {
    const docs = await listTaskActivity(req.params.taskId);
    res.json(docs);
  }
);

export default r;
