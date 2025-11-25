import { CloudantV1 } from "@ibm-cloud/cloudant";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import dotenv from "dotenv";

dotenv.config();

const authenticator = new IamAuthenticator({
  apikey: process.env.CLOUDANT_APIKEY,
});

// Si usas newInstance sin .env service binding, puedes pasar vacío y setear después:
const cloudant = CloudantV1.newInstance({ authenticator });

// Asegura la URL del servicio
if (process.env.CLOUDANT_URL) {
  cloudant.setServiceUrl(process.env.CLOUDANT_URL);
}
try {
  cloudant.enableRetries({ maxRetries: 6, retryInterval: 0.5 }); // retryInterval en segundos en versiones nuevas
} catch {
  try {
    cloudant.enableRetries(); // fallback (usa defaults del SDK)
  } catch {
    // si tu versión fuera muy vieja, lo ignoramos silenciosamente
  }
}

// ✅ Compresión para payloads grandes (reduce ancho de banda y tiempo)
try {
  cloudant.setEnableGzipCompression(true);
} catch { /* no-op */ }

export const DB = {
  users: process.env.CLOUDANT_DB_USERS || "usuarios",
  projects: process.env.CLOUDANT_DB_PROJECTS || "proyectos",
  tasks: process.env.CLOUDANT_DB_TASKS || "tareas",
  memberships: process.env.CLOUDANT_DB_MEMBERSHIPS || "memberships",
  files: process.env.CLOUDANT_DB_FILES || "files",
  activity: process.env.CLOUDANT_DB_ACTIVITY || "activity",

};

export default cloudant;
