import { RequestHandler } from 'express';
import VendorProfile from '../models/vendor-profile.model';
import Product from '../models/product.model';
import Order from '../models/order.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

// ─── Public endpoints ─────────────────────────────────────────────────────

/** GET /api/vendors — list all approved vendors on this tenant */
export const getVendors: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query: any = {
      tenant: authReq.tenant,
      isApproved: true,
      isActive: true,
    };

    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vendors, total] = await Promise.all([
      VendorProfile.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName avatar'),
      VendorProfile.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vendors,
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

/** GET /api/vendors/:slug — public vendor profile */
export const getVendorBySlug: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { slug } = req.params;

    const vendor = await VendorProfile.findOne({
      slug,
      tenant: authReq.tenant,
      isActive: true,
    }).populate('userId', 'firstName lastName avatar email');

    if (!vendor) {
      return next(new CustomError('Vendor not found', 404));
    }

    // Also fetch their products
    const products = await Product.find({
      createdBy: vendor.userId,
      tenant: authReq.tenant,
      isActive: true,
    })
      .sort('-createdAt')
      .limit(20)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: { vendor, products },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Merchant endpoints (own profile) ─────────────────────────────────────

/** GET /api/vendors/me — current merchant's profile */
export const getMyVendorProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const vendor = await VendorProfile.findOne({
      userId: authReq.user!._id,
      tenant: authReq.tenant,
    });

    if (!vendor) {
      return res.status(200).json({
        success: true,
        data: { vendor: null },
      });
    }

    return res.status(200).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/vendors/me — create vendor profile for current merchant */
export const createMyVendorProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    // Check if vendor profile already exists
    const existing = await VendorProfile.findOne({
      userId: authReq.user!._id,
      tenant: authReq.tenant,
    });

    if (existing) {
      return next(new CustomError('Vendor profile already exists', 400));
    }

    const {
      storeName, description, shortDescription, logo, banner,
      contactEmail, contactPhone, address, socialLinks, policies,
    } = req.body;

    if (!storeName) {
      return next(new CustomError('Store name is required', 400));
    }

    // Generate slug
    const baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);

    // Ensure slug uniqueness within tenant
    let slug = baseSlug;
    let counter = 0;
    while (await VendorProfile.findOne({ slug, tenant: authReq.tenant })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const vendor = await VendorProfile.create({
      userId: authReq.user!._id,
      storeName,
      slug,
      description,
      shortDescription,
      logo,
      banner,
      contactEmail: contactEmail || authReq.user!.email,
      contactPhone,
      address,
      socialLinks,
      policies,
      tenant: authReq.tenant,
      isApproved: false, // requires admin approval
    });

    res.status(201).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/vendors/me — update own vendor profile */
export const updateMyVendorProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowedFields = [
      'storeName', 'description', 'shortDescription', 'logo', 'banner',
      'contactEmail', 'contactPhone', 'address', 'socialLinks', 'policies',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // If storeName changed, regenerate slug
    if (updates.storeName) {
      const baseSlug = updates.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
      let slug = baseSlug;
      let counter = 0;
      while (await VendorProfile.findOne({
        slug,
        tenant: authReq.tenant,
        userId: { $ne: authReq.user!._id },
      })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      updates.slug = slug;
    }

    const vendor = await VendorProfile.findOneAndUpdate(
      { userId: authReq.user!._id, tenant: authReq.tenant },
      updates,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return next(new CustomError('Vendor profile not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Merchant dashboard stats ─────────────────────────────────────────────

/** GET /api/vendors/me/stats — merchant dashboard statistics */
export const getMyVendorStats: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const merchantId = authReq.user!._id;
    const tenant = authReq.tenant;

    // Get product count
    const totalProducts = await Product.countDocuments({
      createdBy: merchantId,
      tenant,
    });

    const activeProducts = await Product.countDocuments({
      createdBy: merchantId,
      tenant,
      isActive: true,
    });

    // Get products created by this merchant
    const myProductIds = await Product.find({
      createdBy: merchantId,
      tenant,
    }).distinct('_id');

    // Get orders containing my products
    const orders = await Order.find({
      tenant,
      'items.product': { $in: myProductIds },
    });

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const orderCount = orders.length;

    for (const order of orders) {
      for (const item of order.items) {
        if (myProductIds.some((pid: any) => pid.equals(item.product))) {
          totalRevenue += item.price * item.quantity;
          totalItemsSold += item.quantity;
        }
      }
    }

    // Low stock products
    const lowStockProducts = await Product.find({
      createdBy: merchantId,
      tenant,
      isActive: true,
      isUnlimited: { $ne: true },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).select('name stock lowStockThreshold');

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalItemsSold,
        orderCount,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/vendors/me/orders — orders containing merchant's products */
export const getMyVendorOrders: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20, status } = req.query;
    const merchantId = authReq.user!._id;
    const tenant = authReq.tenant;

    const myProductIds = await Product.find({
      createdBy: merchantId,
      tenant,
    }).distinct('_id');

    const query: any = {
      tenant,
      'items.product': { $in: myProductIds },
    };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'firstName lastName email'),
      Order.countDocuments(query),
    ]);

    // Filter items to only include this merchant's products
    const merchantOrders = orders.map((order) => {
      const myItems = order.items.filter((item: any) =>
        myProductIds.some((pid: any) => pid.equals(item.product))
      );
      return {
        ...order.toObject(),
        items: myItems,
        merchantSubtotal: myItems.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        orders: merchantOrders,
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

// ─── Admin endpoints ──────────────────────────────────────────────────────

/** GET /api/vendors/admin/all — all vendors (admin view) */
export const adminGetAllVendors: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = { tenant: authReq.tenant };

    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vendors, total] = await Promise.all([
      VendorProfile.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email avatar'),
      VendorProfile.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vendors,
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

/** PATCH /api/vendors/admin/:id/approve — approve or reject a vendor */
export const adminApproveVendor: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const vendor = await VendorProfile.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      { isApproved: !!approved },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!vendor) {
      return next(new CustomError('Vendor not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { vendor },
      message: approved ? 'Vendor approved' : 'Vendor approval revoked',
    });
  } catch (error) {
    next(error);
  }
};
