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
    if (redisClient) {
      try {
        const cached = await redisClient.get(`product:${id}`);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: { product: JSON.parse(cached) },
          });
        }
      } catch (_) { /* Redis unavailable, skip cache */ }
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
    if (redisClient) {
      try { await redisClient.setEx(`product:${id}`, 300, JSON.stringify(product)); } catch (_) { /* skip */ }
    }

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
    // Whitelist allowed product fields to prevent injection
    const allowedFields = [
      'name', 'description', 'shortDescription', 'sku', 'category', 'subcategory',
      'basePrice', 'currency', 'prices', 'images', 'stock', 'lowStockThreshold',
      'isUnlimited', 'dimensions', 'tags', 'variants', 'seo',
      'isFeatured', 'isOnSale', 'salePrice', 'saleStartDate', 'saleEndDate',
    ];
    const productData: Record<string, any> = {
      tenant: authReq.tenant,
      createdBy: authReq.user!._id,
    };
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        productData[key] = req.body[key];
      }
    }

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

    // Whitelist allowed update fields
    const allowedFields = [
      'name', 'description', 'shortDescription', 'sku', 'category', 'subcategory',
      'basePrice', 'currency', 'prices', 'images', 'stock', 'lowStockThreshold',
      'isUnlimited', 'dimensions', 'tags', 'variants', 'seo',
      'isActive', 'isFeatured', 'isOnSale', 'salePrice', 'saleStartDate', 'saleEndDate',
    ];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return next(new CustomError('Product not found', 404));
    }

    // Invalidate cache
    if (redisClient) {
      try { await redisClient.del(`product:${id}`); } catch (_) { /* skip */ }
    }

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

    if (redisClient) {
      try { await redisClient.del(`product:${id}`); } catch (_) { /* skip */ }
    }

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
