import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'             // <--- NUEVO
import { fileURLToPath } from 'url' // <--- NUEVO
import cloudant from './config/cloudant.js'
import { requireAuth } from './config/auth.js'
import authRoutes from './routes/auth.routes.js'
import meRoutes from './routes/me.routes.js'
import projectsRoutes from './routes/projects.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import filesRoutes from "./routes/files.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import compression from 'compression';

dotenv.config()

// --- CONFIGURACIÓN PARA ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// El asterisco significa "permitir a todos"
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(compression());
app.use(express.json())

// --- 1. SERVIR ARCHIVOS ESTÁTICOS (FRONTEND) ---
// Buscamos la carpeta 'dist' subiendo un nivel desde 'src'
app.use(express.static(path.join(__dirname, '../dist')));


// --- RUTAS DE API (Backend) ---
app.get('/health', (_req, res) => { res.json({ ok: true }) })

app.use("/", activityRoutes);
app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/proyectos', projectsRoutes);
app.use('/', tasksRoutes)
app.use("/", filesRoutes)

// --- 2. CATCH-ALL ROUTE (Para React Router) ---
// Cualquier ruta que no sea API, devuelve el index.html de React
// IMPORTANTE: Esto debe ir AL FINAL de todo
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

export default app