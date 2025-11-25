import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

// Cliente para leer la JWKS de App ID
const client = jwksClient({
  jwksUri: process.env.APPID_JWKS_URI, // p.ej. https://<region>.appid.cloud.ibm.com/oauth/v4/<TENANT>/.well-known/jwks.json
});

// Obtiene la llave pública por KID
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Middleware: valida JWT, setea req.auth y req.userId
export function requireAuth(req, res, next) {
  try {
    // Toma el header estándar
    const auth = req.headers.authorization || req.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const verifyOpts = {
      algorithms: ['RS256'],
      audience: process.env.APPID_AUDIENCE, // el Client ID de tu App (aud)
      issuer: process.env.APPID_ISSUER,     // issuer exacto de App ID
    };

    jwt.verify(token, getKey, verifyOpts, (err, payload) => {
      if (err) return res.status(401).json({ error: 'invalid_token', detail: err.message });
      req.auth = payload;
      req.userId = payload.sub || payload.uid || payload.user_id;

      req.email = payload.email || payload.preferred_username || payload.upn || null;
      req.name = payload.name || payload.given_name || payload.preferred_username || null;

      req.tokenRaw = token;
      next();
      
    });
  } catch (e) {
    next(e);
  }
}
