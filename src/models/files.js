import cloudant, { DB } from "../config/cloudant.js";
import crypto from "crypto";
import { withRetry } from "../utils/withRetry.js";

export async function addFile({
  project_id,
  task_id,
  filename,
  mime,
  size,
  url,
  key
}) {
  const _id = `file:${project_id}:${task_id}:${crypto.randomUUID()}`;
  const doc = {
    _id,
    project_id,
    task_id,
    filename,
    mime,
    size,
    url,
    key,
    created_at: new Date().toISOString()
  };
  await withRetry(() =>
    cloudant.postDocument({ db: DB.files, document: doc })
  );
  return doc;
}

export async function listFiles(task_id) {
  const selector = { task_id };
  const r = await withRetry(() =>
    cloudant.postFind({ db: DB.files, selector })
  );
  return r.result?.docs || [];
}

export async function deleteFile(fileId) {
  const get = await withRetry(() =>
    cloudant.getDocument({ db: DB.files, docId: fileId })
  );
  await withRetry(() =>
    cloudant.deleteDocument({
      db: DB.files,
      docId: fileId,
      rev: get.result._rev
    })
  );
  return true;
}

export async function getFile(fileId) {
  const r = await withRetry(() =>
    cloudant.getDocument({ db: DB.files, docId: fileId })
  );
  return r.result;
}
