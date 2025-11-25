import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../config/auth.js";
import { checkProjectAccess, requireOwner, requireWriter, requireEditorOrOwner} from '../middleware/authz.js';
import { uploadFile, listFiles, removeFile } from "../controllers/files.controller.js";
import { registerAction } from "../middleware/activityLogger.js";

const upload = multer(); // buffer en memoria
const r = Router();

r.post(
  "/proyectos/:id/tareas/:taskId/files",
  requireAuth,
  checkProjectAccess,
  requireWriter,
  upload.single("file"),
  registerAction("FILE_UPLOADED"),
  uploadFile,
);

r.get(
  "/proyectos/:id/tareas/:taskId/files",
  requireAuth,
  checkProjectAccess,
  listFiles
);

r.delete(
  "/proyectos/:id/tareas/:taskId/files/:fileId",
  requireAuth,
  checkProjectAccess,
  requireWriter,
  registerAction("FILE_DELETED"),
  removeFile
);

export default r;
