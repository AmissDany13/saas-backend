import { Router } from 'express'
import { requireAuth } from '../config/auth.js'
import { whoami } from '../controllers/auth.controller.js'
import { exchangeCode } from '../controllers/oauth.controller.js'

const r = Router()

r.post('/callback', exchangeCode)
r.get('/whoami', requireAuth, whoami)

export default r
