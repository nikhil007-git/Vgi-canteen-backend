import prisma from '../config/db.js';

// Public: Get canteen status and operational settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.canteenSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.canteenSettings.create({
        data: {
          id: 'default',
          status: 'OPEN',
          maxActiveOrders: 40,
          openTime: '08:30 AM',
          closeTime: '08:30 PM',
          contactPhone: '+91 98765 43210',
          contactWhatsapp: '+91 98765 43210',
          announcement: 'Fresh & hot meals ready for pickup at VGI Canteen counter!'
        }
      });
    }

    // Count currently active orders (PAID, ACCEPTED, PREPARING, READY)
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { in: ['PAID', 'ACCEPTED', 'PREPARING', 'READY'] }
      }
    });

    // Check if max capacity is exceeded
    const isAtCapacity = activeOrdersCount >= settings.maxActiveOrders;

    res.json({
      success: true,
      settings: {
        ...settings,
        activeOrdersCount,
        isAtCapacity,
        isAcceptingOrders: settings.status === 'OPEN' && !isAtCapacity
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update canteen status and settings
export const updateSettings = async (req, res, next) => {
  try {
    const {
      status,
      maxActiveOrders,
      openTime,
      closeTime,
      contactPhone,
      contactWhatsapp,
      announcement
    } = req.body;

    const settings = await prisma.canteenSettings.upsert({
      where: { id: 'default' },
      update: {
        status: status || undefined,
        maxActiveOrders: maxActiveOrders !== undefined ? parseInt(maxActiveOrders) : undefined,
        openTime: openTime !== undefined ? openTime : undefined,
        closeTime: closeTime !== undefined ? closeTime : undefined,
        contactPhone: contactPhone !== undefined ? contactPhone : undefined,
        contactWhatsapp: contactWhatsapp !== undefined ? contactWhatsapp : undefined,
        announcement: announcement !== undefined ? announcement : undefined
      },
      create: {
        id: 'default',
        status: status || 'OPEN',
        maxActiveOrders: maxActiveOrders ? parseInt(maxActiveOrders) : 40,
        openTime: openTime || '08:30 AM',
        closeTime: closeTime || '08:30 PM',
        contactPhone: contactPhone || '+91 98765 43210',
        contactWhatsapp: contactWhatsapp || '+91 98765 43210',
        announcement: announcement || 'Welcome to VGI Canteen!'
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'UPDATE_CANTEEN_SETTINGS',
        entityType: 'CANTEEN',
        entityId: 'default',
        metadata: JSON.stringify({ status, maxActiveOrders })
      }
    });

    // Broadcast status change via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('canteen_status_change', {
        status: settings.status,
        announcement: settings.announcement
      });
    }

    res.json({
      success: true,
      message: 'Canteen settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
};

