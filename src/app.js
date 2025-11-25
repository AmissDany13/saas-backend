import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(compression());
app.use(express.json())

app.get('/', (_req, res) => { res.send('El servidor funciona') })
app.get('/health', (_req, res) => { res.json({ ok: true }) })

app.use("/", activityRoutes);
app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/proyectos', projectsRoutes);
app.use('/', tasksRoutes)
app.use("/", filesRoutes)

export default app
