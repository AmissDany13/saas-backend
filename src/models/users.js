import cloudant, { DB } from '../config/cloudant.js';
import { withRetry } from '../utils/withRetry.js';

export async function getBySub(sub) {
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.users,
      selector: { sub }
    })
  );
  return (r.result?.docs || [])[0] || null;
}

export async function getByEmail(email) {
  const r = await withRetry(() =>
    cloudant.postFind({
      db: DB.users,
      selector: { email }
    })
  );
  return (r.result?.docs || [])[0] || null;
}

export async function upsertUser({ sub, name, email }) {
    const id = sub;

    try {
        const existing = await cloudant.getDocument({ db: DB.users, docId: id });
        const doc = existing.result;

        doc.name = name || doc.name;
        doc.email = email || doc.email;
        doc.updated_at = new Date().toISOString();

        await cloudant.putDocument({ db: DB.users, docId: id, document: doc });
    } catch {
        const doc = {
            _id: id,
            sub,
            name,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await cloudant.postDocument({ db: DB.users, document: doc });
    }

    return id;
}

export async function getById(id) {
    try {
        const r = await cloudant.getDocument({ db: DB.users, docId: id });
        return r.result;
    } catch { return null; }
}

export async function upsertFromAppId({ sub, email, name, picture }) {
  if (!sub || !email) throw new Error('missing_sub_or_email');

  // 1) intenta por sub
  let doc = await getBySub(sub);

  // 2) si no hay, intenta por email (usuario ya creado antes sin sub)
  if (!doc) {
    doc = await getByEmail(email);
  }

  const now = new Date().toISOString();

  if (!doc) {
    // crear
    const _id = sub;
    const nuevo = {
      _id,
      sub,         // App ID subject
      email,
      name: name || '',
      picture: picture || '',
      created_at: now,
      updated_at: now
    };
    await withRetry(() =>
      cloudant.postDocument({ db: DB.users, document: nuevo })
    );
    return nuevo;
  } else {
    // actualizar (asegura sub y email sincronizados)
    const current = { ...doc, sub, email, name: name || doc.name || '', picture: picture || doc.picture || '', updated_at: now };
    await withRetry(() =>
      cloudant.putDocument({ db: DB.users, docId: current._id, document: current })
    );
    return current;
  }
}
