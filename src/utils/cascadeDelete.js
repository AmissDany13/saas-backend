import cloudant, { DB } from "../config/cloudant.js";
import { cos, BUCKET } from "../config/cos.js";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";

/* ==========================
   BORRADO DE ARCHIVOS EN COS (AWS SDK v3)
   ========================== */
export async function deleteCOSFolder(prefix) {
  try {
    // 1. Listar objetos
    const list = await cos.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix
      })
    );

    if (!list.Contents || list.Contents.length === 0) return;

    // 2. Crear lista de objetos a eliminar
    const objects = list.Contents.map((item) => ({
      Key: item.Key,
    }));

    // 3. Eliminar todos los objetos
    await cos.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects }
      })
    );

  } catch (err) {
    console.error("Error deleting COS folder:", prefix, err);
  }
}

/* ==========================
   BORRA TODOS LOS DOCUMENTOS DE UNA BD
   ========================== */
export async function deleteDocsBySelector(dbName, selector) {
  try {
    const result = await cloudant.postFind({
      db: dbName,
      selector
    });

    for (const doc of result.result.docs) {
      await cloudant.deleteDocument({
        db: dbName,
        docId: doc._id,
        rev: doc._rev
      });
    }
  } catch (err) {
    console.error("Error deleting docs:", dbName, selector, err);
  }
}
