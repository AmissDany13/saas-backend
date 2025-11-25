import dotenv from 'dotenv';
dotenv.config();

const required = ['CLOUDANT_URL', 'CLOUDANT_APIKEY', 'APPID_ISSUER', 'APPID_AUDIENCE', 'APPID_JWKS_URI'];
required.forEach((k) => {
    if (!process.env[k]) console.warn(`[warn] Missing env: ${k}`)
});
