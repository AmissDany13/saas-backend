import { getById } from '../models/users.js';

export async function me(req, res) {
    const u = await getById(req.userId);
    res.json({ auth: req.auth, profile: u });
}
