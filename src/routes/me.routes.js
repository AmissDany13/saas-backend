import { Router } from 'express';
import { requireAuth } from '../config/auth.js';
import { me } from '../controllers/me.controller.js';
const r = Router();

r.get('/', requireAuth, me);
export default r;
