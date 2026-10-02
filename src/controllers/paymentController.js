import crypto from 'crypto';
import prisma from '../config/db.js';

export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { options: true } },
        user: { select: { id: true, name: true, phone: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization: User must own the order or have ADMIN role
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      console.warn(`[Security Alert] User ${req.user.id} attempted to verify payment for foreign order ${orderId}`);
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot verify payment for another user\'s order.' });
    }

    // Idempotency check: if order already paid, return success immediately
    if (order.status !== 'PAYMENT_PENDING') {
      return res.json({
        success: true,
        message: 'Order already verified and paid',
        order: {
          id: order.id,
          displayNumber: order.displayNumber,
          status: order.status
        }
      });
    }

    // Signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = razorpay_order_id && typeof razorpay_order_id === 'string' && razorpay_order_id.startsWith('order_mock_');

    // In production, reject simulated mock payments
    if (process.env.NODE_ENV === 'production' && isMock) {
      return res.status(400).json({ success: false, message: 'Simulated mock payments are disabled in production.' });
    }

    if (!isMock && secret) {
      if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.'
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
      const receivedBuffer = Buffer.from(String(razorpay_signature), 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        console.warn(`[Security Alert] Invalid payment signature for order: ${orderId}`);
        return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed.' });
      }
    }

    // Process payment success inside transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID'
        },
        include: {
          items: { include: { options: true } },
          user: { select: { id: true, name: true, phone: true, email: true } }
        }
      });

      // 2. Update payment record
      await tx.payment.upsert({
        where: { orderId },
        update: {
          razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
          razorpaySignature: razorpay_signature || 'verified',
          status: 'SUCCESS'
        },
        create: {
          orderId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
          razorpaySignature: razorpay_signature || 'verified',
          status: 'SUCCESS',
          amount: order.total
        }
      });

      // 3. Decrement stock for QUANTITY mode items
      for (const item of order.items) {
        const menuItem = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
        if (menuItem && menuItem.stockMode === 'QUANTITY') {
          const newQty = Math.max(0, menuItem.stockQty - item.quantity);
          await tx.menuItem.update({
            where: { id: menuItem.id },
            data: {
              stockQty: newQty,
              soldOut: newQty === 0
            }
          });
        }
      }

      // 4. Update coupon usage
      if (order.appliedCoupon) {
        await tx.coupon.updateMany({
          where: { code: order.appliedCoupon },
          data: { usedCount: { increment: 1 } }
        });
      }

      // 5. Create in-app notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: 'ORDER_PLACED',
          title: 'Payment Successful!',
          body: `Order ${order.displayNumber || order.id.slice(0, 6)} placed successfully. The canteen counter has received your order.`
        }
      });

      return ord;
    });

    // 6. Broadcast Real-time socket events
    const io = req.app.get('io');
    if (io) {
      // Notify Admin Room
      io.to('admin_room').emit('new_order', {
        order: updatedOrder,
        message: `New paid order #${updatedOrder.displayNumber || updatedOrder.orderNumber} received!`
      });

      // Notify specific User Room
      io.to(`user_${order.userId}`).emit('order_updated', {
        orderId: updatedOrder.id,
        status: 'PAID',
        displayNumber: updatedOrder.displayNumber,
        message: 'Payment confirmed! Order sent to canteen kitchen.'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and order successfully placed!',
      order: {
        id: updatedOrder.id,
        displayNumber: updatedOrder.displayNumber,
        status: updatedOrder.status,
        total: updatedOrder.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Razorpay Webhook Endpoint
export const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // If webhook secret is configured, signature is MANDATORY
    if (webhookSecret) {
      if (!signature) {
        console.warn('[Security Alert] Razorpay webhook received without x-razorpay-signature header');
        return res.status(400).json({ status: 'Signature missing' });
      }

      const bodyData = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(bodyData);
      const digest = shasum.digest('hex');

      const expectedBuffer = Buffer.from(digest, 'utf8');
      const receivedBuffer = Buffer.from(String(signature), 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        console.warn('[Security Alert] Razorpay webhook signature verification failed');
        return res.status(400).json({ status: 'Invalid signature' });
      }
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        const paymentRecord = await prisma.payment.findFirst({
          where: { razorpayOrderId },
          include: {
            order: {
              include: {
                items: true,
                user: { select: { id: true, name: true, phone: true } }
              }
            }
          }
        });

        if (paymentRecord && paymentRecord.order.status === 'PAYMENT_PENDING') {
          const updatedOrder = await prisma.$transaction(async (tx) => {
            const ord = await tx.order.update({
              where: { id: paymentRecord.orderId },
              data: { status: 'PAID' },
              include: {
                items: { include: { options: true } },
                user: { select: { id: true, name: true, phone: true, email: true } }
              }
            });

            await tx.payment.update({
              where: { id: paymentRecord.id },
              data: {
                status: 'SUCCESS',
                razorpayPaymentId: paymentEntity?.id || paymentRecord.razorpayPaymentId
              }
            });

            // Decrement inventory
            for (const item of paymentRecord.order.items) {
              const menuItem = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
              if (menuItem && menuItem.stockMode === 'QUANTITY') {
                const newQty = Math.max(0, menuItem.stockQty - item.quantity);
                await tx.menuItem.update({
                  where: { id: menuItem.id },
                  data: {
                    stockQty: newQty,
                    soldOut: newQty === 0
                  }
                });
              }
            }

            // Increment coupon usage
            if (paymentRecord.order.appliedCoupon) {
              await tx.coupon.updateMany({
                where: { code: paymentRecord.order.appliedCoupon },
                data: { usedCount: { increment: 1 } }
              });
            }

            // Send notification
            await tx.notification.create({
              data: {
                userId: paymentRecord.order.userId,
                orderId: paymentRecord.order.id,
                type: 'ORDER_PLACED',
                title: 'Payment Successful!',
                body: `Order ${ord.displayNumber || ord.id.slice(0, 6)} confirmed via payment webhook.`
              }
            });

            return ord;
          });

          const io = req.app.get('io');
          if (io) {
            io.to('admin_room').emit('new_order', {
              order: updatedOrder,
              message: `New paid order #${updatedOrder.displayNumber || updatedOrder.orderNumber} confirmed!`
            });
            io.to(`user_${paymentRecord.order.userId}`).emit('order_updated', {
              orderId: updatedOrder.id,
              status: 'PAID',
              displayNumber: updatedOrder.displayNumber,
              message: 'Payment confirmed! Order sent to canteen kitchen.'
            });
          }
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};


