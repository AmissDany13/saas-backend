import cloudant, { DB } from '../config/cloudant.js';
import { withRetry } from '../utils/withRetry.js';
import crypto from 'node:crypto';

export async function create({ nombre, descripcion, fecha_inicio, fecha_fin, estado = 'activo', ownerId }) {
  const _id = `project:${crypto.randomUUID()}`;
  const proyecto = {
    _id,
    nombre,
    descripcion,
    propietario_id: ownerId,
    fecha_inicio,
    fecha_fin,
    estado,
    created_at: new Date().toISOString()
  };
  await withRetry(() => cloudant.postDocument({ db: DB.projects, document: proyecto }));
  return proyecto;
}

export async function getById(id) {
  const r = await withRetry(() => cloudant.getDocument({ db: DB.projects, docId: id }));
  return r.result;
}

export async function listByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  // Cloudant Mango soporta $in para _id
  const selector = { _id: { "$in": ids } };
  const r = await withRetry(() =>
    cloudant.postFind({ db: DB.projects, selector })
  );
  return r.result?.docs || [];
}

export async function save(doc) {
  await withRetry(() => cloudant.putDocument({ db: DB.projects, docId: doc._id, document: doc }));
  return doc;
}
