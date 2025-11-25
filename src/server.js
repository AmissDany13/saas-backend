// server.js
import { createServer } from 'http'
import app from './app.js'

const PORT = process.env.PORT || 8080
const server = createServer(app)
server.listen(PORT, () => console.log(`[backend] listening on :${PORT}`))
