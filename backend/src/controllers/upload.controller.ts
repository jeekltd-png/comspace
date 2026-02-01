import { RequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { storeFile } from '../utils/storage';
import { CustomError } from '../middleware/error.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

export const uploadFile: RequestHandler = async (req, res, next) => {
  try {
    const tenant = (req as any).tenant || 'default';
    if (!req.file) {
      return next(new CustomError('No file uploaded', 400));
    }

    // Validate mimetype
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
      return next(new CustomError('Unsupported file type', 400));
    }

    // Optionally process image (resize max width 1200)
    const buffer = await sharp(req.file.buffer).resize({ width: 1200, withoutEnlargement: true }).toBuffer();

    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const { url, storage } = await storeFile(buffer, { tenant, filename, contentType: req.file.mimetype });

    res.status(200).json({ success: true, data: { url, storage, filename } });
  } catch (err) {
    next(err);
  }
};
