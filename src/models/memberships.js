import cloudant, { DB } from '../config/cloudant.js';
import { withRetry } from '../utils/withRetry.js';
import { getById as getUser } from './users.js';

export async function listByProject(project_id) {
    const selector = { project_id, status: { "$in": ["active", "pending"] } };
    const r = await withRetry(() =>
        cloudant.postFind({ db: DB.memberships, selector })
    );
    return r.result?.docs || [];
}

export async function addOwner(project_id, user_id, email, name) {
    const doc = { _id: `memb:${project_id}:${user_id}`, project_id, user_id, email, name: name || null, rol: 'owner', status: 'active', created_at: new Date().toISOString() };
    await cloudant.postDocument({ db: DB.memberships, document: doc });
    return doc;
}

export async function activatePendingForEmail(email, user_id) {
  const user = await getUser(user_id); 
  const realName = user?.name || null;
  const realEmail = user?.email || null;
  if (!email || !user_id) return 0;

  // 1) Trae TODAS las pending por ese email
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.memberships,
      selector: { invited_email: email, status: 'pending' }
    })
  );
  const pendings = r.result?.docs || [];
  if (pendings.length === 0) return 0;

  let activated = 0;

  for (const p of pendings) {
    const project_id = p.project_id;
    const roleToAssign = p.rol || "viewer";

    // 2) Construye el _id "activo" determinístico por usuario
    const activeId = `memb:${project_id}:${user_id}`;

    // 3) upsert del activo (por si ya existe)
    try {
      // ¿ya existe activo?
      const ex = await withRetry(() =>
        cloudant.getDocument({ db: DB.memberships, docId: activeId })
      );
      // actualizar a status active
      const activeDoc = {
        ...ex.result,
        status: 'active',
        user_id,
        project_id,
        rol: roleToAssign,  
        email: realEmail,
        name: realName,            
        updated_at: new Date().toISOString()
      };
      await withRetry(() =>
        cloudant.putDocument({
          db: DB.memberships,
          docId: activeId,
          document: activeDoc
        })
      );
    } catch {
      // no existe -> crear
      const activeDoc = {
        _id: activeId,
        project_id,
        user_id,
        rol: roleToAssign,
        status: 'active',
        email: realEmail,
        name: realName,
        created_at: new Date().toISOString()
      };
      await withRetry(() =>
        cloudant.postDocument({ db: DB.memberships, document: activeDoc })
      );
    }

    // 4) borra la pending por email (para no duplicar)
    try {
      const getP = await withRetry(() =>
        cloudant.getDocument({ db: DB.memberships, docId: p._id })
      );
      await withRetry(() =>
        cloudant.deleteDocument({
          db: DB.memberships,
          docId: p._id,
          rev: getP.result._rev
        })
      );
    } catch {
      // ya no existe / no importa
    }

    activated++;
  }

  return activated;
}

export async function invite(project_id, email, rol = "viewer") {
  const doc = {
    _id: `memb:${project_id}:email:${email}`,
    project_id,
    invited_email: email,
    rol,                   // <--- NUEVO
    status: 'pending',
    created_at: new Date().toISOString()
  };

  await cloudant.postDocument({ db: DB.memberships, document: doc });
  return doc;
}

export async function findOne(selector) {
    const r = await cloudant.postFind({ db: DB.memberships, selector, limit: 1 });
    return (r.result.docs || [])[0] || null;
}

export async function listByUser(user_id) {
    const r = await cloudant.postFind({ db: DB.memberships, selector: { user_id, status: 'active' } });
    return r.result.docs || [];
}

export async function remove(project_id, user_id_or_email) {
  // Normalizar project_id (ya viene con "project:")
  const pid = project_id.replace(/^project:/, "");

  // 1. IDs posibles generados por tu sistema REAL
  const candidates = [
    `memb:project:${pid}:${user_id_or_email}`,           // activo estándar
    `memb:project:${pid}:email:${user_id_or_email}`,     // invitado / activo email
    `memb:${project_id}:${user_id_or_email}`,            // fallback sin prefix
    `memb:${project_id}:email:${user_id_or_email}`,      // fallback sin prefix email
  ];

  // 2. Intentar borrar con los IDs conocidos
  for (const docId of candidates) {
    try {
      const get = await withRetry(() =>
        cloudant.getDocument({ db: DB.memberships, docId })
      );

      await withRetry(() =>
        cloudant.deleteDocument({
          db: DB.memberships,
          docId,
          rev: get.result._rev,
        })
      );

      return;
    } catch {}
  }

  // 3. Si no se encontró → buscar documentos por project_id que coincidan con user_id O email
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.memberships,
      selector: {
        project_id,
        "$or": [
          { user_id: user_id_or_email },
          { invited_email: user_id_or_email },
          { email: user_id_or_email }
        ]
      }
    })
  );

  const docs = r.result?.docs || [];

  if (docs.length === 0) {
    console.log("No se encontró membership para borrar", user_id_or_email);
    return;
  }

  // 4. Borrar TODOS los documents encontrados (normalmente 1)
  for (const d of docs) {
    await withRetry(() =>
      cloudant.deleteDocument({
        db: DB.memberships,
        docId: d._id,
        rev: d._rev,
      })
    );
  }
}

export async function updateRole(project_id, user_id_or_email, newRole) {
  const pid = project_id.replace(/^project:/, "");

  const candidates = [
    `memb:project:${pid}:${user_id_or_email}`,
    `memb:project:${pid}:email:${user_id_or_email}`,
    `memb:${project_id}:${user_id_or_email}`,
    `memb:${project_id}:email:${user_id_or_email}`,
  ];

  for (const docId of candidates) {
    try {
      const get = await withRetry(() =>
        cloudant.getDocument({ db: DB.memberships, docId })
      );

      const updated = {
        ...get.result,
        rol: newRole,
        updated_at: new Date().toISOString()
      };

      await withRetry(() =>
        cloudant.putDocument({
          db: DB.memberships,
          docId,
          document: updated,
        })
      );

      return updated;
    } catch {}
  }

  // fallback búsqueda por selector (por si IDs raros)
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.memberships,
      selector: {
        project_id,
        "$or": [
          { user_id: user_id_or_email },
          { invited_email: user_id_or_email },
          { email: user_id_or_email }
        ]
      }
    })
  );

  const [doc] = r.result?.docs || [];
  if (!doc) return null;

  const updatedDoc = {
    ...doc,
    rol: newRole,
    updated_at: new Date().toISOString(),
  };

  await withRetry(() =>
    cloudant.putDocument({
      db: DB.memberships,
      docId: doc._id,
      document: updatedDoc,
    })
  );

  return updatedDoc;
}
