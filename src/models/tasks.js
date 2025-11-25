import crypto from 'crypto';
import cloudant, { DB } from '../config/cloudant.js';
import { withRetry } from '../utils/withRetry.js'; 

export async function create({ project_id, titulo, descripcion, estado = 'pendiente', responsables = [], fecha_inicio, fecha_fin }) {
    const _id = `task:${project_id}:${crypto.randomUUID()}`;
    const tarea = {
        _id, project_id, titulo, descripcion,
        estado, responsables, fecha_inicio, fecha_fin,
        created_at: new Date().toISOString(),
    };
    await withRetry(() => cloudant.postDocument({ db: DB.tasks, document: tarea }));
    return tarea;
}

export async function listByProject(project_id, { estado, responsable } = {}) {
    const selector = { project_id };
    if (estado) selector.estado = estado;
    if (responsable) selector.responsables = { "$elemMatch": responsable }; // o {$in:[responsable]}
    const r = await withRetry(() => cloudant.postFind({ db: DB.tasks, selector }));
    return r.result?.docs || [];
}

export async function patch(taskId, patch) {
     const get = await withRetry(() => cloudant.getDocument({ db: DB.tasks, docId: taskId }));
    const doc = { ...get.result, ...patch, updated_at: new Date().toISOString() };
    await withRetry(() => cloudant.putDocument({ db: DB.tasks, docId: taskId, document: doc }));
    return doc;
}
