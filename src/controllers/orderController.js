import prisma from '../config/db.js';
import razorpayInstance, { isRazorpayLive } from '../config/razorpay.js';
import crypto from 'crypto';

// Helper to generate pickup code
const generatePickupCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `VGI-${randomNum}`;
};

// 1. Create Order Intent & Initialize Payment
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, phone, confirmPhone, couponCode, specialInstructions } = req.body;

    // 1. Phone validation
    if (!phone || !confirmPhone) {
      return res.status(400).json({ success: false, message: 'Phone number and confirmation phone number are required.' });
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanConfirmPhone = confirmPhone.trim().replace(/\D/g, '');
    if (cleanPhone !== cleanConfirmPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Phone numbers do not match or are invalid.' });
    }

    // 2. Items validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add items.' });
    }
    if (items.length > 50) {
      return res.status(400).json({ success: false, message: 'Maximum 50 items allowed per order.' });
    }

    for (const it of items) {
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q < 1 || q > 50) {
        return res.status(400).json({ success: false, message: 'Item quantities must be integers between 1 and 50.' });
      }
    }

    // 3. Canteen status & capacity check
    const canteen = await prisma.canteenSettings.findUnique({ where: { id: 'default' } });
    if (canteen && canteen.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'The canteen is currently closed. New orders cannot be placed.' });
    }

    const activeCount = await prisma.order.count({
      where: { status: { in: ['PAID', 'ACCEPTED', 'PREPARING', 'READY'] } }
    });
    if (canteen && (canteen.status === 'BUSY' || activeCount >= canteen.maxActiveOrders)) {
      return res.status(400).json({
        success: false,
        message: 'The canteen is currently busy and at peak capacity. Please wait a few minutes before placing your order.'
      });
    }

    // 4. Strict server-side recalculation of items and totals
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const dbItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
          optionGroups: {
            include: { options: true }
          }
        }
      });

      if (!dbItem || !dbItem.active) {
        return res.status(400).json({ success: false, message: `Item "${item.itemName || 'Selected item'}" is no longer available.` });
      }

      if (dbItem.soldOut) {
        return res.status(400).json({ success: false, message: `"${dbItem.name}" is currently Sold Out. Please update your cart.` });
      }

      if (dbItem.stockMode === 'QUANTITY' && dbItem.stockQty < item.quantity) {
        return res.status(400).json({ success: false, message: `Only ${dbItem.stockQty} portions of "${dbItem.name}" remain in stock.` });
      }

      // Calculate unit price including options
      let itemUnitPrice = dbItem.price;
      const processedOptions = [];

      if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
        for (const optId of item.selectedOptions) {
          // Find option in menuItem groups
          for (const group of dbItem.optionGroups) {
            const foundOpt = group.options.find(o => o.id === optId && o.active);
            if (foundOpt) {
              itemUnitPrice += foundOpt.priceDelta;
              processedOptions.push({
                optionId: foundOpt.id,
                optionName: foundOpt.name,
                priceDelta: foundOpt.priceDelta
              });
            }
          }
        }
      }

      const itemSubtotal = itemUnitPrice * item.quantity;
      calculatedSubtotal += itemSubtotal;

      processedItems.push({
        menuItemId: dbItem.id,
        itemName: dbItem.name,
        quantity: item.quantity,
        unitPrice: itemUnitPrice,
        subtotal: itemSubtotal,
        specialInstruction: item.specialInstruction ? String(item.specialInstruction).slice(0, 300).trim() : null,
        options: processedOptions
      });
    }

    // 5. Calculate Coupon Discount (Full Validation matching validateCoupon)
    let calculatedDiscount = 0;
    let validCouponCode = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const cleanCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode }
      });

      const now = new Date();
      if (
        coupon &&
        coupon.active &&
        (!coupon.startAt || now >= new Date(coupon.startAt)) &&
        (!coupon.endAt || now <= new Date(coupon.endAt)) &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        calculatedSubtotal >= coupon.minOrder
      ) {
        let perUserExceeded = false;
        if (coupon.perUserLimit) {
          const userOrdersWithCoupon = await prisma.order.count({
            where: {
              userId,
              appliedCoupon: coupon.code,
              status: { notIn: ['PAYMENT_PENDING', 'CANCELLED'] }
            }
          });
          if (userOrdersWithCoupon >= coupon.perUserLimit) {
            perUserExceeded = true;
          }
        }

        if (!perUserExceeded) {
          if (coupon.type === 'PERCENTAGE') {
            calculatedDiscount = (calculatedSubtotal * coupon.value) / 100;
            if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
              calculatedDiscount = coupon.maxDiscount;
            }
          } else {
            calculatedDiscount = coupon.value;
          }
          calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);
          calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
          validCouponCode = coupon.code;
        }
      }
    }

    const calculatedTotal = Math.max(0, Math.round((calculatedSubtotal - calculatedDiscount) * 100) / 100);
    const pickupCode = generatePickupCode();

    // 6. Save user phone to profile if not present
    await prisma.user.update({
      where: { id: userId },
      data: { phone: cleanPhone }
    });

    // 7. Create Order record in DB (PAYMENT_PENDING)
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PAYMENT_PENDING',
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        total: calculatedTotal,
        phone: cleanPhone,
        pickupCode,
        appliedCoupon: validCouponCode,
        specialInstructions: specialInstructions ? specialInstructions.trim() : null,
        items: {
          create: processedItems.map(pi => ({
            menuItemId: pi.menuItemId,
            itemName: pi.itemName,
            quantity: pi.quantity,
            unitPrice: pi.unitPrice,
            subtotal: pi.subtotal,
            specialInstruction: pi.specialInstruction,
            options: {
              create: pi.options.map(po => ({
                optionName: po.optionName,
                priceDelta: po.priceDelta
              }))
            }
          }))
        }
      },
      include: {
        items: {
          include: { options: true }
        }
      }
    });

    // Format display order number e.g. "VGI-1001"
    const displayNumber = `VGI-${1000 + order.orderNumber}`;
    await prisma.order.update({
      where: { id: order.id },
      data: { displayNumber }
    });

    // 8. Create Razorpay Payment Intent
    let razorpayOrderData = null;
    const isMock = !isRazorpayLive || process.env.RAZORPAY_TEST_MODE === 'true';

    if (!isMock && razorpayInstance) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: Math.round(calculatedTotal * 100), // in paise
          currency: 'INR',
          receipt: `rcpt_${order.id.slice(0, 10)}`,
          notes: {
            orderId: order.id,
            displayNumber,
            userId
          }
        });

        razorpayOrderData = {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          isMock: false
        };

        await prisma.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: rzpOrder.id,
            status: 'PENDING',
            amount: calculatedTotal
          }
        });
      } catch (rzpErr) {
        console.warn('⚠️ Razorpay order creation failed, falling back to mock mode:', rzpErr.message);
      }
    }

    if (!razorpayOrderData) {
      // Mock / Sandbox simulation for local development & testing
      const mockOrderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
      razorpayOrderData = {
        id: mockOrderId,
        amount: Math.round(calculatedTotal * 100),
        currency: 'INR',
        isMock: true
      };

      await prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: mockOrderId,
          status: 'PENDING',
          amount: calculatedTotal
        }
      });
    }

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber,
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        total: calculatedTotal,
        pickupCode: order.pickupCode,
        status: order.status
      },
      payment: razorpayOrderData,
      razorpayKey: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Order Details & Live Tracking
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            options: true,
            menuItem: { select: { imageUrl: true } }
          }
        },
        payment: true,
        refund: true,
        rating: true,
        user: { select: { name: true, email: true, phone: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    const canteen = await prisma.canteenSettings.findUnique({ where: { id: 'default' } });

    res.json({
      success: true,
      order,
      canteenContact: {
        phone: canteen ? canteen.contactPhone : '+91 98765 43210',
        whatsapp: canteen ? canteen.contactWhatsapp : '+91 98765 43210'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Current User Active Orders
export const getMyActiveOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        status: { in: ['PAID', 'ACCEPTED', 'PREPARING', 'READY'] }
      },
      include: {
        items: {
          include: { options: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// 4. Get Current User Order History (Active + Past)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        status: { not: 'PAYMENT_PENDING' }
      },
      include: {
        items: {
          include: { options: true }
        },
        rating: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// 5. Submit Order Rating (Post-completion)
export const submitRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stars, review } = req.body;
    const userId = req.user.id;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a star rating between 1 and 5.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'You can only rate an order once it has been picked up!' });
    }

    const rating = await prisma.rating.upsert({
      where: { orderId: id },
      update: {
        stars: parseInt(stars),
        review: review ? review.trim() : null
      },
      create: {
        orderId: id,
        userId,
        stars: parseInt(stars),
        review: review ? review.trim() : null
      }
    });

    res.json({ success: true, message: 'Thank you for rating your meal!', rating });
  } catch (error) {
    next(error);
  }
};

