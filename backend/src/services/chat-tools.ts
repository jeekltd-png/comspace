/**
 * Chat Tools — deterministic actions the chatbot can invoke.
 *
 * Each tool is exposed to the LLM via function-calling schema and
 * executed server-side with tenant / user scoping.
 */
import Product from '../models/product.model';
import Order from '../models/order.model';
import type { ToolDefinition } from '../services/chat-llm.service';
import { logger } from '../utils/logger';

// ── Tool definitions (sent to the LLM) ──────────────────────

export const CHAT_TOOLS: ToolDefinition[] = [
  {
    name: 'searchProducts',
    description:
      'Search the product catalog by keyword, category, or price range. Returns up to 5 matching products.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search query' },
        category: { type: 'string', description: 'Category slug or name to filter by' },
        minPrice: { type: 'number', description: 'Minimum price filter' },
        maxPrice: { type: 'number', description: 'Maximum price filter' },
      },
      required: [],
    },
  },
  {
    name: 'getOrderStatus',
    description:
      'Look up the current status of an order by its order number. Returns status, tracking info, and items.',
    parameters: {
      type: 'object',
      properties: {
        orderNumber: {
          type: 'string',
          description: 'The order number, e.g. ORD-ABC123',
        },
      },
      required: ['orderNumber'],
    },
  },
  {
    name: 'getProductDetails',
    description: 'Get detailed information about a specific product by its ID.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'MongoDB ObjectId of the product' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getFAQ',
    description:
      'Answer frequently asked questions about shipping, returns, payment, and store policies.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['shipping', 'returns', 'payment', 'privacy', 'general'],
          description: 'The FAQ topic to retrieve',
        },
      },
      required: ['topic'],
    },
  },
];

// ── Tool execution ───────────────────────────────────────────

interface ToolContext {
  tenant: string;
  userId?: string;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  logger.info(`Executing chat tool: ${name}`, { args, tenant: ctx.tenant });

  switch (name) {
    case 'searchProducts':
      return executeSearchProducts(args, ctx);
    case 'getOrderStatus':
      return executeGetOrderStatus(args, ctx);
    case 'getProductDetails':
      return executeGetProductDetails(args, ctx);
    case 'getFAQ':
      return executeGetFAQ(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Individual tool implementations ──────────────────────────

async function executeSearchProducts(
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  const filter: any = { tenant: ctx.tenant, isActive: true };

  if (args.query) {
    filter.$text = { $search: args.query as string };
  }
  if (args.category) {
    // Try matching by populated category name (case-insensitive)
    filter['category'] = args.category;
  }
  if (args.minPrice || args.maxPrice) {
    filter.basePrice = {};
    if (args.minPrice) filter.basePrice.$gte = Number(args.minPrice);
    if (args.maxPrice) filter.basePrice.$lte = Number(args.maxPrice);
  }

  const products = await Product.find(filter)
    .select('name shortDescription basePrice currency images rating salePrice isOnSale')
    .sort('-rating.average')
    .limit(5)
    .lean();

  return {
    count: products.length,
    products: products.map((p: any) => ({
      id: p._id,
      name: p.name,
      description: p.shortDescription,
      price: p.isOnSale && p.salePrice ? p.salePrice : p.basePrice,
      originalPrice: p.isOnSale ? p.basePrice : undefined,
      currency: p.currency,
      image: p.images?.[0]?.url,
      rating: p.rating?.average,
    })),
  };
}

async function executeGetOrderStatus(
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  const orderNumber = (args.orderNumber as string)?.toUpperCase();

  // Security Fix #6: Require authentication to look up order details
  // This prevents information leakage where any anonymous user could look up
  // any order's details, tracking info, and items.
  if (!ctx.userId) {
    return {
      found: false,
      message: 'Please log in to track your order. I can\'t look up order details for guest users for security reasons.',
    };
  }

  // Always scope to the authenticated user's orders to prevent cross-user data leakage
  const filter: any = { orderNumber, tenant: ctx.tenant, user: ctx.userId };

  const order = await Order.findOne(filter)
    .select('orderNumber status paymentStatus trackingNumber estimatedDelivery items total currency statusHistory')
    .lean();

  if (!order) {
    return { found: false, message: 'Order not found. Please check the order number and try again.' };
  }

  return {
    found: true,
    orderNumber: (order as any).orderNumber,
    status: (order as any).status,
    paymentStatus: (order as any).paymentStatus,
    trackingNumber: (order as any).trackingNumber,
    estimatedDelivery: (order as any).estimatedDelivery,
    total: (order as any).total,
    currency: (order as any).currency,
    itemCount: (order as any).items?.length,
    lastUpdate: (order as any).statusHistory?.[(order as any).statusHistory.length - 1],
  };
}

async function executeGetProductDetails(
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  const productId = args.productId as string;

  const product = await Product.findOne({ _id: productId, tenant: ctx.tenant, isActive: true })
    .select('name description shortDescription basePrice salePrice isOnSale currency stock images variants rating tags')
    .populate('category', 'name')
    .lean();

  if (!product) {
    return { found: false, message: 'Product not found.' };
  }

  return {
    found: true,
    name: (product as any).name,
    description: (product as any).shortDescription || (product as any).description,
    price: (product as any).isOnSale && (product as any).salePrice ? (product as any).salePrice : (product as any).basePrice,
    originalPrice: (product as any).isOnSale ? (product as any).basePrice : undefined,
    currency: (product as any).currency,
    inStock: (product as any).stock > 0,
    rating: (product as any).rating?.average,
    reviewCount: (product as any).rating?.count,
    category: ((product as any).category as any)?.name,
    variants: (product as any).variants,
    images: (product as any).images?.map((img: any) => img.url),
  };
}

async function executeGetFAQ(
  args: Record<string, unknown>,
  _ctx: ToolContext,
) {
  const topic = (args.topic as string) || 'general';

  const faqs: Record<string, string> = {
    shipping:
      '**Shipping Policy**\n\n• Standard shipping: 5-7 business days\n• Express shipping: 2-3 business days\n• Free shipping on orders over the free-shipping threshold\n• We ship to all supported regions\n\nTracking information is emailed once your order ships.',
    returns:
      '**Returns & Refunds**\n\n• 30-day return window from delivery date\n• Items must be unused and in original packaging\n• Refunds processed within 5-7 business days after we receive the return\n• To start a return, go to **My Orders** → select the order → **Request Return**',
    payment:
      '**Payment Methods**\n\n• Credit / Debit cards (Visa, Mastercard, Amex)\n• Digital wallets when available\n• All payments are processed securely via Stripe\n• Prices shown include applicable taxes',
    privacy:
      '**Privacy & Data**\n\n• We never sell your personal data\n• Your payment info is handled by Stripe (PCI compliant)\n• You can delete your account and data at any time from Account Settings\n• See our full Privacy Policy for details',
    general:
      "**Need Help?**\n\n• Browse products, search by category or keyword\n• Track orders from **My Orders**\n• Contact support via the store's contact page\n• Chat with me anytime for quick answers!",
  };

  return { topic, answer: faqs[topic] || faqs.general };
}
