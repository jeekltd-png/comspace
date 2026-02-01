import { RequestHandler } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { CustomError } from '../middleware/error.middleware';

const ADMIN_DOCS_DIR = path.join(__dirname, '../../..', 'docs', 'ADMIN_ONLY');

export const listAdminDocs: RequestHandler = async (_req, res, next) => {
  try {
    const files = await fs.readdir(ADMIN_DOCS_DIR);
    const md = files.filter((f) => f.endsWith('.md'));
    res.status(200).json({ success: true, data: md });
  } catch (err) {
    next(err);
  }
};

export const getAdminDoc: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!name || name.includes('..') || !name.endsWith('.md')) {
      return next(new CustomError('Invalid document name', 400));
    }

    const filePath = path.join(ADMIN_DOCS_DIR, name);
    const content = await fs.readFile(filePath, 'utf8');
    res.status(200).json({ success: true, data: { name, content } });
  } catch (err) {
    next(err);
  }
};
