import * as memberships from '../models/memberships.js';
import { getById as getUser } from '../models/users.js';

export async function listMembers(req, res) {
    const project_id = req.params.id;
    const docs = await memberships.listByProject(project_id);
    res.json(docs);
}

export async function addMemberByEmail(req, res) {
    const project_id = req.params.id;
    const { email, rol } = req.body || {};
    if (!email) return res.status(400).json({ error: 'missing_email' });

    const roleToAssign = rol || "viewer";  // 👈 nuevo
    const doc = await memberships.invite(project_id, email, roleToAssign);
    res.status(201).json(doc);
}

export async function removeMember(req, res) {
    const project_id = req.params.id;
    const user_id = req.params.userId;
    await memberships.remove(project_id, user_id);
    res.status(204).end();
}

export async function updateRole(req, res) {
    const project_id = req.params.id;
    const user_id_or_email = req.params.userId;   // puede ser email
    const { rol } = req.body;

    if (!rol || !["viewer", "editor", "owner"].includes(rol)) {
        return res.status(400).json({ error: "invalid_role" });
    }

    try {
        const updated = await memberships.updateRole(project_id, user_id_or_email, rol);
        if (!updated) {
            return res.status(404).json({ error: "membership_not_found" });
        }
        res.json({ ok: true, rol });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "update_role_failed" });
    }
}
