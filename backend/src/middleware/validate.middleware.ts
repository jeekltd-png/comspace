import { Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';

/**
 * Runs an array of express-validator chains and returns 400
 * with the list of errors if any fail.
 */
export const validate = (validations: ValidationChain[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: (e as any).path || (e as any).param,
        message: e.msg,
      })),
    });
  };
};

// ─── Auth Validators ────────────────────────────────────────────────────────

export const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .escape(),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('A valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('A valid email is required'),
];

export const resetPasswordValidation = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .escape(),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
];

// ─── Product Validators ─────────────────────────────────────────────────────

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name must be less than 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
];

export const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Product name must be less than 200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
];

// ─── Cart Validators ────────────────────────────────────────────────────────

export const addToCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
];

export const updateCartItemValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
];

// ─── Order Validators ───────────────────────────────────────────────────────

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID in items'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object'),
];

export const updateOrderStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

// ─── Review Validators ──────────────────────────────────────────────────────

export const createReviewValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters')
    .escape(),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comment must be less than 2000 characters'),
];

export const updateReviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters')
    .escape(),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comment must be less than 2000 characters'),
];

// ─── Newsletter Validators ──────────────────────────────────────────────────

export const newsletterSubscribeValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('A valid email is required'),
];

// ─── Payment Validators ─────────────────────────────────────────────────────

export const createPaymentIntentValidation = [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least 0.50'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
];

// ─── White Label Validators ─────────────────────────────────────────────────

export const createWhiteLabelValidation = [
  body('tenantId')
    .trim()
    .notEmpty()
    .withMessage('Tenant ID is required')
    .isAlphanumeric()
    .withMessage('Tenant ID must be alphanumeric')
    .isLength({ max: 50 })
    .withMessage('Tenant ID must be less than 50 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain is required')
    .isFQDN()
    .withMessage('Domain must be a valid fully qualified domain name'),
  body('contact.email')
    .trim()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('A valid contact email is required'),
];

// ─── Common Param Validators ────────────────────────────────────────────────

export const mongoIdParam = (paramName: string = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
];
