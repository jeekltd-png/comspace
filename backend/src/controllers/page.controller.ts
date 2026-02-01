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

export const createPage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const body = req.body;
    body.tenant = authReq.tenant;
    const page = await Page.create(body);
    res.status(201).json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
};

export const updatePage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const page = await Page.findOneAndUpdate({ _id: id, tenant: authReq.tenant }, req.body, { new: true, runValidators: true });
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