import { upsertUser } from '../models/users.js';
import * as users from '../models/users.js';
import * as memberships from '../models/memberships.js';

export async function whoami(req, res) {
  try {
    const { sub } = req.auth || {};
    if (!sub) return res.status(401).json({ error: 'no_auth' });

    let { email, name } = req.auth || {};

    if (!email && req.tokenRaw) {
      try {
        const r = await fetch(`${process.env.APPID_ISSUER}/userinfo`, {
          headers: { Authorization: `Bearer ${req.tokenRaw}` },
        });
        if (r.ok) {
          const ui = await r.json();
          email = ui.email || email;
          name  = ui.name || ui.given_name || ui.preferred_username || name;
        }
      } catch {}
    }

    // 1) crear/actualizar usuario
    const userDoc = await upsertUser({ sub, name, email });

    // 2) ACTIVAR invitaciones en pending
    if (email) {
      await memberships.activatePendingForEmail(email, sub);
    }

    // 3) respuesta final
    return res.json({ sub, email, name });

  } catch (e) {
    return res.status(500).json({ error: 'whoami_failed' });
  }
}


export async function authCallback(req, res) {
  try {
    const { sub, email, name, picture } = req.appIdClaims;

    // 1) upsert usuario
    const userDoc = await users.upsertFromAppId({ sub, email, name, picture });

    // ID real del usuario en Cloudant
    const realUserId = userDoc._id || sub;

    // 2) activar membresías pendientes
    await memberships.activatePendingForEmail(email, userDoc._id);

    // 3) devuelve lo que necesite tu login
    // res.json(...)
  } catch (e) {
    return res.status(400).json({ error: 'auth_callback_failed' });
  }
}
