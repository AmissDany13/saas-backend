import * as projects from '../models/projects.js';
import * as memberships from '../models/memberships.js';
import cloudant, { DB } from "../config/cloudant.js";
import { withRetry } from "../utils/withRetry.js";
import { deleteDocsBySelector, deleteCOSFolder } from "../utils/cascadeDelete.js";
import { deleteTaskCascade } from "./tasks.controller.js";

export async function listMyProjects(req, res) {
  try {
    const mems = await memberships.listByUser(req.userId);
    const ids = mems.map((m) => m.project_id);
    const docs = await projects.listByIds(ids); // <- ya implementado
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: 'list_projects_failed' });
  }
}

export async function createProject(req, res) {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body;
    const proyecto = await projects.create({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado,
      ownerId: req.userId
    });
    await memberships.addOwner(proyecto._id, req.userId, req.email, req.name);
    res.status(201).json(proyecto);
  } catch (e) {
    res.status(500).json({ error: 'create_project_failed' });
  }
}

export async function getProject(req, res) {
  try {
    const proyecto = await projects.getById(req.params.id);
    res.json(proyecto);
  } catch (e) {
    res.status(404).json({ error: 'project_not_found' });
  }
}

export async function inviteMember(req, res) {
  try {
    const { email } = req.body;
    const projectId = req.params.id;
    const doc = await memberships.invite(projectId, email);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: 'invite_failed' });
  }
}

export async function patchProject(req, res) {
  try {
    const id = req.params.id;
    const { estado, fecha_inicio, fecha_fin } = req.body || {};
    const patch = {};
    if (estado !== undefined) patch.estado = estado;
    if (fecha_inicio !== undefined) patch.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) patch.fecha_fin = fecha_fin;

    const doc = await projects.getById(id);
    const updated = { ...doc, ...patch, updated_at: new Date().toISOString() };
    await projects.save(updated); // <- usa el model, no cloudant directo
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: 'patch_project_failed' });
  }
}

export async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    await deleteProjectCascade(id);

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error_deleting_project" });
  }
}


export async function deleteProjectCascade(projectId) {

  // 1. Obtener todas las tareas del proyecto
  const tasks = await cloudant.postFind({
    db: DB.tasks,
    selector: { project_id: projectId }
  });

  // 2. Eliminar cada tarea en cascada
  await Promise.all(tasks.result.docs.map(t => 
    deleteTaskCascade(t._id, projectId)
  ));

  // 3. Eliminar archivos propios del proyecto (por si quedó alguno)
  await deleteCOSFolder(`${projectId}/`);

  // 4. Eliminar memberships
  await deleteDocsBySelector(DB.memberships, {
    _id: { "$regex": `^memb:${projectId}:` }
  });


  // 5. Eliminar activity logs globales del proyecto
  await deleteDocsBySelector(DB.activity, { project_id: projectId });

  // 6. Por último, eliminar el proyecto
  const doc = await cloudant.getDocument({
    db: DB.projects,
    docId: projectId
  });

  await cloudant.deleteDocument({
    db: DB.projects,
    docId: projectId,
    rev: doc.result._rev
  });
}
