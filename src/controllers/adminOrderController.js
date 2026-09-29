import prisma from '../config/db.js';

// 1. Get All Orders for Admin Queue
export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    } else {
      // Exclude abandoned unverified payment attempts from main operational queue
      where.status = { not: 'PAYMENT_PENDING' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { displayNumber: { contains: q, mode: 'insensitive' } },
        { pickupCode: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { user: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: { options: true }
        },
        user: { select: { id: true, name: true, phone: true, email: true } },
        payment: true,
        refund: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// 2. Update Order Status (Accept, Prep Time, Ready, Cancel)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, prepTimeMinutes, cancelReason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updateData = { status };
    let notificationTitle = '';
    let notificationBody = '';
    let isHighPriority = false;

    const now = new Date();

    if (status === 'ACCEPTED') {
      notificationTitle = 'Order Accepted!';
      notificationBody = 'Canteen staff has accepted your order and will begin preparation shortly.';
    } else if (status === 'PREPARING') {
      const prepMins = prepTimeMinutes ? parseInt(prepTimeMinutes) : (order.prepTimeMinutes || 15);
      const estReady = new Date(now.getTime() + prepMins * 60000);
      updateData.prepTimeMinutes = prepMins;
      updateData.prepStartTime = now;
      updateData.estimatedReadyTime = estReady;

      notificationTitle = 'Order is Being Prepared!';
      notificationBody = `Estimated preparation time: ${prepMins} minutes. We will notify you when it's ready for pickup.`;
    } else if (status === 'READY') {
      updateData.readyAt = now;
      notificationTitle = 'Your Order is Ready for Pickup! 🔔';
      notificationBody = `Order #${order.displayNumber || order.orderNumber} is ready at the canteen counter. Show your QR or code ${order.pickupCode} to collect.`;
      isHighPriority = true;
    } else if (status === 'CANCELLED') {
      if (!cancelReason) {
        return res.status(400).json({ success: false, message: 'A cancellation reason is required.' });
      }
      updateData.cancelledAt = now;
      updateData.cancelReason = cancelReason;

      // Create refund record
      await prisma.refund.upsert({
        where: { orderId: id },
        update: {
          status: 'PROCESSED',
          reason: cancelReason,
          amount: order.total
        },
        create: {
          orderId: id,
          status: 'PROCESSED',
          reason: cancelReason,
          amount: order.total
        }
      });

      notificationTitle = 'Order Cancelled & Refund Initiated';
      notificationBody = `Order #${order.displayNumber} was cancelled: ${cancelReason}. Refund of ₹${order.total} has been initiated.`;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { options: true } },
        payment: true,
        refund: true,
        user: { select: { id: true, name: true, phone: true } }
      }
    });

    // Create Notification
    if (notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: status,
          title: notificationTitle,
          body: notificationBody
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `ORDER_${status}`,
        entityType: 'ORDER',
        entityId: order.id,
        metadata: JSON.stringify({ status, prepTimeMinutes, cancelReason })
      }
    });

    // Realtime Broadcast
    const io = req.app.get('io');
    if (io) {
      // User room
      io.to(`user_${order.userId}`).emit('order_status_updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        prepTimeMinutes: updatedOrder.prepTimeMinutes,
        estimatedReadyTime: updatedOrder.estimatedReadyTime,
        pickupCode: updatedOrder.pickupCode,
        isHighPriority,
        title: notificationTitle,
        message: notificationBody
      });

      // Admin room update
      io.to('admin_room').emit('admin_order_updated', {
        order: updatedOrder
      });
    }

    res.json({
      success: true,
      message: `Order marked as ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// 3. Verify Pickup (QR scan or Pickup Token match)
export const verifyPickup = async (req, res, next) => {
  try {
    const { pickupCode, orderId } = req.body;

    if (!pickupCode && !orderId) {
      return res.status(400).json({ success: false, message: 'Please provide either a pickup code or order ID.' });
    }

    const where = {};
    if (pickupCode) {
      where.pickupCode = pickupCode.trim().toUpperCase();
    } else if (orderId) {
      where.id = orderId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: { include: { options: true } },
        user: { select: { name: true, phone: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'No matching order found for this pickup code.' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'This order has already been picked up and completed.' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot complete pickup: this order was cancelled.' });
    }

    const now = new Date();
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        completedAt: now
      },
      include: {
        items: { include: { options: true } },
        user: { select: { name: true, phone: true } }
      }
    });

    // Notify User
    await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        type: 'COMPLETED',
        title: 'Order Picked Up!',
        body: `Hope you enjoy your meal! Please take a moment to rate your food.`
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'ORDER_PICKED_UP',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: JSON.stringify({ pickupCode: order.pickupCode })
      }
    });

    // Realtime Broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.userId}`).emit('order_completed', {
        orderId: order.id,
        status: 'COMPLETED',
        message: 'Order completed! You can now rate your meal.'
      });
      io.to('admin_room').emit('admin_order_updated', {
        order: updatedOrder
      });
    }

    res.json({
      success: true,
      message: `Pickup verified! Order #${updatedOrder.displayNumber || updatedOrder.orderNumber} is now Completed.`,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// 4. Admin Dashboard Metrics & KPIs
export const getDashboardKPIs = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Counts by status
    const [
      newPaidCount,
      preparingCount,
      readyCount,
      completedTodayCount,
      todayOrders
    ] = await Promise.all([
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: { in: ['ACCEPTED', 'PREPARING'] } } }),
      prisma.order.count({ where: { status: 'READY' } }),
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: todayStart }
        }
      }),
      prisma.order.findMany({
        where: {
          status: { notIn: ['PAYMENT_PENDING', 'CANCELLED'] },
          createdAt: { gte: todayStart }
        },
        select: { total: true }
      })
    ]);

    const todaySales = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    const activeOrdersCount = newPaidCount + preparingCount + readyCount;

    res.json({
      success: true,
      kpis: {
        newPaidOrders: newPaidCount,
        preparingOrders: preparingCount,
        readyOrders: readyCount,
        completedToday: completedTodayCount,
        todaySales: Math.round(todaySales),
        activeOrders: activeOrdersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

