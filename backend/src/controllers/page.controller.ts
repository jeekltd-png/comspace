import { RequestHandler } from 'express';
import Page from '../models/page.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

export const getPage: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenant = (req as any).tenant || 'default';
    const page = await Page.findOne({ tenant, slug, published: true });
    if (!page) return next(new CustomError('Page not found', 404));
    res.status(200).json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
};

export const listPages: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const pages = await Page.find({ tenant: authReq.tenant });
    res.status(200).json({ success: true, data: pages });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_PAGE_FIELDS = ['title', 'slug', 'content', 'published', 'seo', 'template'] as const;

const pickPageFields = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key of ALLOWED_PAGE_FIELDS) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
};

export const createPage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const sanitized = pickPageFields(req.body);
    sanitized.tenant = authReq.tenant;
    const page = await Page.create(sanitized);
    res.status(201).json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
};

export const updatePage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const sanitized = pickPageFields(req.body);
    const page = await Page.findOneAndUpdate({ _id: id, tenant: authReq.tenant }, sanitized, { new: true, runValidators: true });
    if (!page) return next(new CustomError('Page not found', 404));
    res.status(200).json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
};

export const deletePage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const page = await Page.findOneAndDelete({ _id: id, tenant: authReq.tenant });
    if (!page) return next(new CustomError('Page not found', 404));
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};