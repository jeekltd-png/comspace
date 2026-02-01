import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const saveLocalFile = async (buffer: Buffer, destPath: string): Promise<string> => {
  const fullPath = path.join(process.cwd(), destPath);
  ensureDir(path.dirname(fullPath));
  await fs.promises.writeFile(fullPath, buffer);
  // return a path that is web-accessible (served at /uploads)
  const publicPath = `/uploads/${path.relative(path.join(process.cwd(), 'uploads'), fullPath).replace(/\\/g, '/')}`;
  return publicPath;
};

export const uploadToS3 = async (buffer: Buffer, key: string, contentType: string) => {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  if (!bucket || !region) throw new Error('S3_BUCKET and S3_REGION must be set');

  const client = new S3Client({ region });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));

  // public URL
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return url;
};

export const storeFile = async (buffer: Buffer, opts: { tenant: string; filename: string; contentType: string }) => {
  // If S3 is configured, upload to S3, otherwise save locally under uploads/
  if (process.env.S3_BUCKET && process.env.S3_REGION) {
    const key = `white-label/${opts.tenant}/${opts.filename}`;
    const url = await uploadToS3(buffer, key, opts.contentType);
    return { url, storage: 's3' };
  }

  const dest = `uploads/white-label/${opts.tenant}/${opts.filename}`;
  const url = await saveLocalFile(buffer, dest);
  return { url, storage: 'local' };
};