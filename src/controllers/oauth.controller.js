import axios from 'axios'
import qs from 'qs'

export async function exchangeCode(req, res) {
  try {
    const { code, redirect_uri } = req.body || {}
    if (!code || !redirect_uri) {
      return res.status(400).json({ error: 'missing code/redirect_uri' })
    }

    // Necesitas estas envs:
    // APPID_ISSUER = https://<region>.appid.cloud.ibm.com/oauth/v4/<tenant>
    // APPID_CLIENT_ID
    // APPID_CLIENT_SECRET
    const tokenUrl = `${process.env.APPID_ISSUER}/token`

    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: process.env.APPID_CLIENT_ID,
      client_secret: process.env.APPID_CLIENT_SECRET
    })

    const { data: tokens } = await axios.post(tokenUrl, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    // Devuelve tal cual al front; tu AuthContext usa access_token/id_token
    res.json(tokens)
  } catch (e) {
    res.status(500).json({ error: 'token_exchange_failed', detail: e.response?.data || e.message })
  }
}
