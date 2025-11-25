import { logActivity } from "../models/activity.js";

// obtiene diferencias entre objeto antes y después
function diff(oldDoc, newDoc) {
  const changes = {};
  for (const key of Object.keys(newDoc)) {
    if (newDoc[key] !== oldDoc[key]) {
      changes[key] = {
        before: oldDoc[key],
        after: newDoc[key]
      };
    }
  }
  return changes;
}

export function registerAction(action) {
  return async (req, res, next) => {

    // Para eliminaciones → registrar ANTES
    if (action === "PROJECT_DELETED" || action === "TASK_DELETED") {
      try {
        await logActivity({
          project_id: req.params.id || req.body.project_id,
          task_id: req.params.taskId || null,
          user_id: req.userId,
          action,
          description: `${action} by ${req.email}`,
          metadata: {}
        });
      } catch (err) {
        console.error("Error logging delete activity:", err);
      }
      return next();
    }

    // Para todo lo demás → registrar DESPUÉS
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await logActivity({
            project_id: req.params.id || req.body.project_id,
            task_id: req.params.taskId || null,
            user_id: req.userId,
            action,
            description: `${action} by ${req.email}`,
            metadata: req.body || {}
          });
        } catch (err) {
          console.error("Error logging activity:", err);
        }
      }
    });

    next();
  };
}
