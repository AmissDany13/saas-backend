import { S3 } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

export const cos = new S3({
  region: process.env.COS_REGION, 
  endpoint: process.env.COS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.COS_HMAC_KEY_ID,
    secretAccessKey: process.env.COS_HMAC_KEY_SECRET
  }
});

export const BUCKET = process.env.COS_BUCKET;
