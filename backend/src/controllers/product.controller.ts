import { RequestHandler } from 'express';
import Product from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { redisClient } from '../server';

export const getProducts: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      search,
    } = req.query;

    const query: any = {
      tenant: authReq.tenant,
      isActive: true,
    };

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug'),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await redisClient.get(`product:${id}`);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: { product: JSON.parse(cached) },
      });
    }

    const product = await Product.findOne({
      _id: id,
      tenant: authReq.tenant,
      isActive: true,
    }).populate('category reviews');

    if (!product) {
      return next(new CustomError('Product not found', 404));
    }

    // Cache for 5 minutes
    await redisClient.setEx(`product:${id}`, 300, JSON.stringify(product));

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const productData = {
      ...req.body,
      tenant: authReq.tenant,
      createdBy: authReq.user!._id,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return next(new CustomError('Product not found', 404));
    }

    // Invalidate cache
    await redisClient.del(`product:${id}`);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return next(new CustomError('Product not found', 404));
    }

    await redisClient.del(`product:${id}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return next(new CustomError('Search query is required', 400));
    }

    const products = await Product.find({
      $text: { $search: q as string },
      tenant: authReq.tenant,
      isActive: true,
    })
      .limit(Number(limit))
      .select('name shortDescription basePrice images');

    res.status(200).json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};
