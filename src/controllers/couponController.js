import prisma from '../config/db.js';

// Public: Validate coupon against cart subtotal
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!code || subtotal === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and subtotal are required.' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!coupon || !coupon.active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    // Check date validity
    const now = new Date();
    if (coupon.startAt && now < new Date(coupon.startAt)) {
      return res.status(400).json({ success: false, message: 'This coupon offer has not started yet.' });
    }
    if (coupon.endAt && now > new Date(coupon.endAt)) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    // Check minimum order value
    if (subtotal < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrder} required to use this coupon.`
      });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
    }

    // Check per-user limit if user logged in
    if (userId && coupon.perUserLimit) {
      const userOrdersWithCoupon = await prisma.order.count({
        where: {
          userId,
          appliedCoupon: coupon.code,
          status: { notIn: ['PAYMENT_PENDING', 'CANCELLED'] }
        }
      });
      if (userOrdersWithCoupon >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already used this coupon maximum (${coupon.perUserLimit}) time(s).`
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    res.json({
      success: true,
      valid: true,
      message: `Coupon "${coupon.code}" applied! You save ₹${discount}`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Public: Get active offers
export const getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { active: true },
      select: {
        code: true,
        description: true,
        type: true,
        value: true,
        minOrder: true,
        maxDiscount: true
      },
      orderBy: { minOrder: 'asc' }
    });

    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all coupons
export const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

// Admin: Create coupon
export const createCoupon = async (req, res, next) => {
  try {
    const { code, description, type, value, minOrder, maxDiscount, startAt, endAt, usageLimit, perUserLimit } = req.body;

    if (!code || value === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description ? description.trim() : null,
        type: type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        active: true
      }
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    next(error);
  }
};

// Admin: Update coupon
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, description, type, value, minOrder, maxDiscount, startAt, endAt, usageLimit, perUserLimit, active } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase().trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        type: type !== undefined ? type : undefined,
        value: value !== undefined ? parseFloat(value) : undefined,
        minOrder: minOrder !== undefined ? parseFloat(minOrder) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : undefined,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : undefined,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : undefined,
        perUserLimit: perUserLimit !== undefined ? parseInt(perUserLimit) : undefined,
        active: active !== undefined ? !!active : undefined
      }
    });

    res.json({ success: true, message: 'Coupon updated successfully', coupon });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete coupon
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

