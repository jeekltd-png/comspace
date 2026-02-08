import { RequestHandler } from 'express';
import Stripe from 'stripe';
import MembershipPlan from '../models/membershipPlan.model';
import Membership from '../models/membership.model';
import MemberDues from '../models/memberDues.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia' as any,
});

// ─── PLAN MANAGEMENT (Admin) ───────────────────────────

/** Create a membership plan */
export const createPlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowed = ['name', 'description', 'amount', 'currency', 'interval', 'features', 'maxMembers'];
    const data: Record<string, any> = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    data.tenant = authReq.tenant;

    const plan = await MembershipPlan.create(data);
    res.status(201).json({ success: true, data: { plan } });
  } catch (error) {
    next(error);
  }
};

/** List all plans for the tenant */
export const getPlans: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const plans = await MembershipPlan.find({
      tenant: authReq.tenant,
      isActive: true,
    }).sort({ amount: 1 });

    res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
};

/** Update a plan (admin) */
export const updatePlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowed = ['name', 'description', 'amount', 'currency', 'interval', 'features', 'isActive', 'maxMembers'];
    const updates: Record<string, any> = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      updates,
      { new: true, runValidators: true }
    );

    if (!plan) return next(new CustomError('Plan not found', 404));
    res.status(200).json({ success: true, data: { plan } });
  } catch (error) {
    next(error);
  }
};

/** Delete (deactivate) a plan */
export const deletePlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { isActive: false },
      { new: true }
    );
    if (!plan) return next(new CustomError('Plan not found', 404));
    res.status(200).json({ success: true, data: { plan } });
  } catch (error) {
    next(error);
  }
};

// ─── MEMBER SUBSCRIPTION ──────────────────────────────

/** Subscribe the current user to a plan */
export const subscribe: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { planId } = req.body;
    const userId = authReq.user!._id;
    const tenant = authReq.tenant!;

    // Check plan exists
    const plan = await MembershipPlan.findOne({ _id: planId, tenant, isActive: true });
    if (!plan) return next(new CustomError('Membership plan not found', 404));

    // Check if already subscribed
    const existing = await Membership.findOne({ user: userId, tenant });
    if (existing && existing.status === 'active') {
      return next(new CustomError('You already have an active membership', 400));
    }

    // Calculate dates
    const now = new Date();
    const nextDue = new Date(now);
    if (plan.interval === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
    else if (plan.interval === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
    else nextDue.setFullYear(nextDue.getFullYear() + 1);

    let membership;
    if (existing) {
      // Reactivate
      existing.plan = plan._id as any;
      existing.status = 'active';
      existing.joinDate = now;
      existing.nextDueDate = nextDue;
      existing.lastPaymentDate = now;
      existing.autoRenew = true;
      membership = await existing.save();
    } else {
      membership = await Membership.create({
        user: userId,
        plan: plan._id,
        status: 'active',
        joinDate: now,
        nextDueDate: nextDue,
        lastPaymentDate: now,
        autoRenew: true,
        tenant,
      });
    }

    // Create initial dues record (first payment)
    const periodEnd = new Date(nextDue);
    await MemberDues.create({
      membership: membership._id,
      user: userId,
      plan: plan._id,
      amount: plan.amount,
      currency: plan.currency,
      status: 'paid',
      dueDate: now,
      paidDate: now,
      periodStart: now,
      periodEnd,
      paymentMethod: 'manual', // first payment recorded as manual (or via Stripe below)
      tenant,
    });

    const populated = await Membership.findById(membership._id)
      .populate('plan', 'name amount currency interval')
      .populate('user', 'firstName lastName email');

    res.status(201).json({ success: true, data: { membership: populated } });
  } catch (error) {
    next(error);
  }
};

/** Get the current user's membership */
export const getMyMembership: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const membership = await Membership.findOne({
      user: authReq.user!._id,
      tenant: authReq.tenant,
    })
      .populate('plan', 'name description amount currency interval features')
      .populate('user', 'firstName lastName email');

    res.status(200).json({ success: true, data: { membership } });
  } catch (error) {
    next(error);
  }
};

/** Get the current user's dues history */
export const getMyDues: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [dues, total] = await Promise.all([
      MemberDues.find({
        user: authReq.user!._id,
        tenant: authReq.tenant,
      })
        .populate('plan', 'name interval')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limit),
      MemberDues.countDocuments({
        user: authReq.user!._id,
        tenant: authReq.tenant,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dues,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Create a Stripe PaymentIntent for dues */
export const payDues: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!._id;
    const tenant = authReq.tenant!;

    const membership = await Membership.findOne({ user: userId, tenant }).populate('plan');
    if (!membership) return next(new CustomError('No membership found', 404));
    if (membership.status === 'cancelled') return next(new CustomError('Membership is cancelled', 400));

    const plan = membership.plan as any;
    if (!plan) return next(new CustomError('Membership plan not found', 404));

    // Create a pending dues record
    const now = new Date();
    const periodStart = membership.nextDueDate || now;
    const periodEnd = new Date(periodStart);
    if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.interval === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const duesRecord = await MemberDues.create({
      membership: membership._id,
      user: userId,
      plan: plan._id,
      amount: plan.amount,
      currency: plan.currency,
      status: 'pending',
      dueDate: periodStart,
      periodStart,
      periodEnd,
      paymentMethod: 'stripe',
      tenant,
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.amount * 100),
      currency: plan.currency.toLowerCase(),
      metadata: {
        duesId: duesRecord._id.toString(),
        membershipId: membership._id.toString(),
        userId: userId.toString(),
        tenant,
        type: 'membership_dues',
      },
      automatic_payment_methods: { enabled: true },
    });

    duesRecord.stripePaymentIntentId = paymentIntent.id;
    await duesRecord.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        duesId: duesRecord._id,
        amount: plan.amount,
        currency: plan.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Confirm dues payment (webhook or manual) */
export const confirmDuesPayment: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { duesId, paymentIntentId } = req.body;
    const tenant = authReq.tenant!;

    const duesRecord = await MemberDues.findOne({ _id: duesId, tenant });
    if (!duesRecord) return next(new CustomError('Dues record not found', 404));

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return next(new CustomError('Payment has not succeeded', 400));
      }
      duesRecord.stripePaymentIntentId = paymentIntentId;
      duesRecord.receiptUrl = (paymentIntent as any).charges?.data?.[0]?.receipt_url || undefined;
    }

    duesRecord.status = 'paid';
    duesRecord.paidDate = new Date();
    await duesRecord.save();

    // Update membership
    const membership = await Membership.findById(duesRecord.membership);
    if (membership) {
      membership.status = 'active';
      membership.lastPaymentDate = new Date();
      // Advance next due date
      const plan = await MembershipPlan.findById(duesRecord.plan);
      if (plan) {
        const nextDue = new Date(duesRecord.periodEnd);
        membership.nextDueDate = nextDue;
      }
      await membership.save();
    }

    res.status(200).json({ success: true, data: { dues: duesRecord } });
  } catch (error) {
    next(error);
  }
};

/** Cancel membership */
export const cancelMembership: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const membership = await Membership.findOne({
      user: authReq.user!._id,
      tenant: authReq.tenant,
    });
    if (!membership) return next(new CustomError('No membership found', 404));

    membership.status = 'cancelled';
    membership.autoRenew = false;
    await membership.save();

    res.status(200).json({ success: true, data: { membership } });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: MEMBER MANAGEMENT ─────────────────────────

/** List all members in the association */
export const listMembers: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const filter: Record<string, any> = { tenant: authReq.tenant };
    if (status) filter.status = status;

    const [memberships, total] = await Promise.all([
      Membership.find(filter)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('plan', 'name amount currency interval')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Membership.countDocuments(filter),
    ]);

    // If search, filter in-app (populated fields aren't queryable directly)
    let result = memberships;
    if (search) {
      const q = search.toLowerCase();
      result = memberships.filter((m) => {
        const u = m.user as any;
        if (!u) return false;
        return (
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          m.memberNumber?.toLowerCase().includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      data: {
        members: result,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Update a member's status (admin) */
export const updateMemberStatus: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'lapsed', 'suspended', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new CustomError('Invalid status', 400));
    }

    const membership = await Membership.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { status },
      { new: true }
    )
      .populate('user', 'firstName lastName email')
      .populate('plan', 'name amount currency interval');

    if (!membership) return next(new CustomError('Membership not found', 404));
    res.status(200).json({ success: true, data: { membership } });
  } catch (error) {
    next(error);
  }
};

/** Record a manual payment for a member (admin) */
export const recordManualPayment: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { membershipId, amount, paymentMethod, notes } = req.body;
    const tenant = authReq.tenant!;

    const membership = await Membership.findOne({ _id: membershipId, tenant }).populate('plan');
    if (!membership) return next(new CustomError('Membership not found', 404));

    const plan = membership.plan as any;
    const now = new Date();
    const periodStart = membership.nextDueDate || now;
    const periodEnd = new Date(periodStart);
    if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.interval === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const duesRecord = await MemberDues.create({
      membership: membership._id,
      user: membership.user,
      plan: plan._id,
      amount: amount || plan.amount,
      currency: plan.currency,
      status: 'paid',
      dueDate: periodStart,
      paidDate: now,
      periodStart,
      periodEnd,
      paymentMethod: paymentMethod || 'manual',
      notes,
      recordedBy: authReq.user!._id,
      tenant,
    });

    // Update membership
    membership.status = 'active';
    membership.lastPaymentDate = now;
    membership.nextDueDate = periodEnd;
    await membership.save();

    res.status(201).json({ success: true, data: { dues: duesRecord } });
  } catch (error) {
    next(error);
  }
};

/** Admin dashboard: dues overview stats */
export const getDuesDashboard: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant!;

    const [
      totalMembers,
      activeMembers,
      lapsedMembers,
      suspendedMembers,
      totalCollected,
      pendingDues,
      overdueDues,
      recentPayments,
    ] = await Promise.all([
      Membership.countDocuments({ tenant }),
      Membership.countDocuments({ tenant, status: 'active' }),
      Membership.countDocuments({ tenant, status: 'lapsed' }),
      Membership.countDocuments({ tenant, status: 'suspended' }),
      MemberDues.aggregate([
        { $match: { tenant, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      MemberDues.countDocuments({ tenant, status: 'pending' }),
      MemberDues.countDocuments({ tenant, status: 'overdue' }),
      MemberDues.find({ tenant, status: 'paid' })
        .populate('user', 'firstName lastName email')
        .populate('plan', 'name')
        .sort({ paidDate: -1 })
        .limit(10),
    ]);

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await MemberDues.aggregate([
      {
        $match: {
          tenant,
          status: 'paid',
          paidDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMembers,
          activeMembers,
          lapsedMembers,
          suspendedMembers,
          totalCollected: totalCollected[0]?.total || 0,
          pendingDues,
          overdueDues,
        },
        monthlyRevenue,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Admin: Get all dues records with filters */
export const getAllDues: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter: Record<string, any> = { tenant: authReq.tenant };
    if (status) filter.status = status;

    const [dues, total] = await Promise.all([
      MemberDues.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('plan', 'name amount interval')
        .populate('membership', 'memberNumber status')
        .populate('recordedBy', 'firstName lastName')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limit),
      MemberDues.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dues,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Admin: Export dues to CSV */
export const exportDues: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant!;
    const status = req.query.status as string;

    const filter: Record<string, any> = { tenant };
    if (status) filter.status = status;

    const dues = await MemberDues.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('plan', 'name amount interval')
      .populate('membership', 'memberNumber')
      .sort({ dueDate: -1 });

    // Build CSV
    const header = 'Member Number,Name,Email,Plan,Amount,Currency,Status,Due Date,Paid Date,Payment Method\n';
    const rows = dues.map((d) => {
      const u = d.user as any;
      const p = d.plan as any;
      const m = d.membership as any;
      return [
        m?.memberNumber || '',
        `${u?.firstName || ''} ${u?.lastName || ''}`.trim(),
        u?.email || '',
        p?.name || '',
        d.amount,
        d.currency,
        d.status,
        d.dueDate?.toISOString().split('T')[0] || '',
        d.paidDate?.toISOString().split('T')[0] || '',
        d.paymentMethod,
      ].join(',');
    });

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=dues-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
