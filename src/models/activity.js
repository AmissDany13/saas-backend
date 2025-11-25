import cloudant, { DB } from "../config/cloudant.js";
import crypto from "crypto";
import { withRetry } from "../utils/withRetry.js";

export async function logActivity({
  project_id,
  task_id = null,
  user_id,
  action,
  description,
  metadata = {}
}) {
  const doc = {
    _id: `act:${crypto.randomUUID()}`,
    project_id,
    task_id,
    user_id,
    action,
    description,
    metadata,
    created_at: new Date().toISOString()
  };

  await withRetry(() =>
    cloudant.postDocument({ db: DB.activity, document: doc })
  );

  return doc;
}

// 🔹 Obtener historial completo de un proyecto
export async function listProjectActivity(project_id) {
  const selector = { project_id };
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.activity,
      selector,
    })
  );

  return r.result.docs || [];
}

// 🔹 Obtener historial de una tarea
export async function listTaskActivity(task_id) {
  const selector = { task_id };
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.activity,
      selector,
    })
  );

  return r.result.docs || [];
}
