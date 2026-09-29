import { categoriesData, menuItemsData } from './menuData.js';
import bcrypt from 'bcryptjs';

// Pre-hashed passwords for instant login in fallback mode
const ADMIN_PASS_HASH = bcrypt.hashSync('admin123', 10);
const getAdminUsername = () => (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
const getAdminEmail = () => (process.env.ADMIN_EMAIL || 'admin@vgi.ac.in').toLowerCase();
const getAdminPassHash = () => bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
const STUDENT_PASS_HASH = bcrypt.hashSync('student123', 10);

class MockDbStore {
  constructor() {
    this.adminUsername = getAdminUsername();
    this.users = [
      {
        id: 'usr_admin_1',
        name: 'VGI Canteen Admin',
        username: getAdminUsername(),
        email: getAdminEmail(),
        password: getAdminPassHash(),
        role: 'ADMIN',
        phone: '9876543210',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'usr_student_1',
        name: 'Rahul Sharma',
        username: 'student',
        email: 'student@vgi.ac.in',
        password: STUDENT_PASS_HASH,
        role: 'STUDENT',
        phone: '9876501234',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.categories = categoriesData.map(c => ({ ...c }));
    this.menuItems = menuItemsData.map(m => ({
      ...m,
      optionGroups: (m.optionGroups || []).map(og => ({
        ...og,
        options: (og.options || []).map(opt => ({ ...opt }))
      }))
    }));

    this.coupons = [
      {
        id: 'cp_1',
        code: 'HOSTEL20',
        description: '20% off up to ₹40 on orders above ₹100 for hostel students',
        type: 'PERCENTAGE',
        value: 20,
        minOrder: 100,
        maxDiscount: 40,
        active: true,
        usedCount: 0,
        usageLimit: 100,
        perUserLimit: 2
      },
      {
        id: 'cp_2',
        code: 'WELCOME50',
        description: 'Flat ₹50 off on minimum order of ₹200',
        type: 'FIXED',
        value: 50,
        minOrder: 200,
        maxDiscount: 50,
        active: true,
        usedCount: 0,
        usageLimit: 100,
        perUserLimit: 1
      },
      {
        id: 'cp_3',
        code: 'VGICHAI',
        description: 'Flat ₹10 off on Chai & Snacks orders above ₹50',
        type: 'FIXED',
        value: 10,
        minOrder: 50,
        maxDiscount: 10,
        active: true,
        usedCount: 0,
        usageLimit: 100,
        perUserLimit: 5
      }
    ];

    this.canteenSettings = {
      id: 'default',
      status: 'OPEN',
      maxActiveOrders: 40,
      openTime: '08:30 AM',
      closeTime: '08:30 PM',
      contactPhone: '+91 98765 43210',
      contactWhatsapp: '+91 98765 43210',
      announcement: 'Fresh & hot meals ready for pickup at VGI Canteen counter!'
    };

    this.orders = [];
    this.notifications = [];
    this.ratings = [];
    this.orderCounter = 1001;
  }

  // User collection helpers
  getUserRepository() {
    return {
      findUnique: async ({ where }) => {
        if (!where) return null;
        if (where.id) return this.users.find(u => u.id === where.id) || null;
        if (where.clerkId) return this.users.find(u => u.clerkId === where.clerkId) || null;
        if (where.email) {
          const target = where.email.toLowerCase().trim();
          return this.users.find(u =>
            (u.email && u.email.toLowerCase() === target) ||
            (u.username && u.username.toLowerCase() === target) ||
            (u.role === "ADMIN" && (target === "admin" || target === (process.env.ADMIN_USERNAME || "admin").toLowerCase()))
          ) || null;
        }
        return null;
      },
      findFirst: async ({ where } = {}) => {
        if (!where) return this.users[0] || null;
        return this.users.find(u => {
          if (where.clerkId !== undefined && u.clerkId !== where.clerkId) return false;
          if (where.id !== undefined && u.id !== where.id) return false;
          if (where.role && u.role !== where.role) return false;
          if (where.email) {
            const target = where.email.toLowerCase().trim();
            const matches = (u.email && u.email.toLowerCase() === target) ||
              (u.username && u.username.toLowerCase() === target) ||
              (u.role === "ADMIN" && (target === "admin" || target === (process.env.ADMIN_USERNAME || "admin").toLowerCase()));
            if (!matches) return false;
          }
          if (where.OR && Array.isArray(where.OR)) {
            const orMatches = where.OR.some(cond => {
              if (cond.clerkId) return u.clerkId === cond.clerkId;
              if (cond.email) {
                const target = cond.email.toLowerCase().trim();
                return (u.email && u.email.toLowerCase() === target) ||
                  (u.username && u.username.toLowerCase() === target) ||
                  (u.role === "ADMIN" && (target === "admin" || target === (process.env.ADMIN_USERNAME || "admin").toLowerCase()));
              }
              if (cond.name) return u.name && u.name.toLowerCase() === cond.name.toLowerCase();
              return false;
            });
            if (!orMatches) return false;
          }
          return true;
        }) || null;
      },
      create: async ({ data, select }) => {
        const newUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          clerkId: data.clerkId || null,
          name: data.name || (data.email ? data.email.split("@")[0] : "Student"),
          username: data.username || (data.email ? data.email.split("@")[0] : "student"),
          email: data.email ? data.email.toLowerCase().trim() : "",
          password: data.password || null,
          phone: data.phone || null,
          role: data.role || "STUDENT",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.users.push(newUser);
        return newUser;
      },
      update: async ({ where, data, select }) => {
        const user = this.users.find(u =>
          (where.id && u.id === where.id) ||
          (where.email && u.email && u.email.toLowerCase() === where.email.toLowerCase()) ||
          (where.clerkId && u.clerkId === where.clerkId)
        );
        if (user) {
          if (data.clerkId !== undefined) user.clerkId = data.clerkId;
          if (data.name !== undefined) user.name = data.name;
          if (data.username !== undefined) user.username = data.username.toLowerCase().trim();
          if (data.email !== undefined) user.email = data.email.toLowerCase().trim();
          if (data.password !== undefined) user.password = data.password;
          if (data.phone !== undefined) user.phone = data.phone;
          if (data.role !== undefined) user.role = data.role;
          user.updatedAt = new Date();
          return { ...user };
        }
        return null;
      },
      count: async () => this.users.length
    };
  }

  // Category collection helpers
  getCategoryRepository() {
    return {
      findMany: async ({ where, orderBy } = {}) => {
        let list = [...this.categories];
        if (where?.active !== undefined) list = list.filter(c => c.active === where.active);
        return list.map(c => ({
          ...c,
          _count: {
            menuItems: this.menuItems.filter(m => m.categoryId === c.id && m.active).length
          }
        }));
      },
      findFirst: async ({ where }) => {
        return this.categories.find(c => !where.name || c.name === where.name) || null;
      },
      create: async ({ data }) => {
        const newCat = { id: `cat_${Date.now()}`, ...data, active: true };
        this.categories.push(newCat);
        return newCat;
      },
      update: async ({ where, data }) => {
        const cat = this.categories.find(c => c.id === where.id);
        if (cat) Object.assign(cat, data);
        return cat;
      },
      delete: async ({ where }) => {
        this.categories = this.categories.filter(c => c.id !== where.id);
        return true;
      }
    };
  }

  // MenuItem collection helpers
  getMenuItemRepository() {
    return {
      findMany: async ({ where } = {}) => {
        let list = [...this.menuItems];
        if (where?.active !== undefined) list = list.filter(m => m.active === where.active);
        if (where?.categoryId) list = list.filter(m => m.categoryId === where.categoryId);
        if (where?.isPopular) list = list.filter(m => m.isPopular);
        if (where?.isFeatured) list = list.filter(m => m.isFeatured);
        if (where?.OR) {
          const search = where.OR[0].name.contains.toLowerCase();
          list = list.filter(m => m.name.toLowerCase().includes(search) || (m.description && m.description.toLowerCase().includes(search)));
        }
        return list.map(item => ({
          ...item,
          category: this.categories.find(c => c.id === item.categoryId) || null
        }));
      },
      findUnique: async ({ where }) => {
        const item = this.menuItems.find(m => m.id === where.id);
        if (!item) return null;
        return {
          ...item,
          category: this.categories.find(c => c.id === item.categoryId) || null
        };
      },
      create: async ({ data }) => {
        const newItem = {
          id: `item_${Date.now()}`,
          ...data,
          optionGroups: []
        };
        this.menuItems.push(newItem);
        return newItem;
      },
      update: async ({ where, data }) => {
        const item = this.menuItems.find(m => m.id === where.id);
        if (item) Object.assign(item, data);
        return item;
      },
      delete: async ({ where }) => {
        this.menuItems = this.menuItems.filter(m => m.id !== where.id);
        return true;
      }
    };
  }

  // Coupon collection helpers
  getCouponRepository() {
    return {
      findUnique: async ({ where }) => {
        return this.coupons.find(c => c.code === where.code.toUpperCase()) || null;
      },
      findMany: async ({ where } = {}) => {
        let list = [...this.coupons];
        if (where?.active !== undefined) list = list.filter(c => c.active === where.active);
        return list;
      },
      create: async ({ data }) => {
        const newCp = { id: `cp_${Date.now()}`, ...data, usedCount: 0 };
        this.coupons.push(newCp);
        return newCp;
      },
      update: async ({ where, data }) => {
        const cp = this.coupons.find(c => c.id === where.id);
        if (cp) Object.assign(cp, data);
        return cp;
      },
      updateMany: async ({ where, data }) => {
        this.coupons.forEach(c => {
          if (!where.code || c.code === where.code) {
            if (data.usedCount?.increment) c.usedCount += data.usedCount.increment;
          }
        });
      },
      delete: async ({ where }) => {
        this.coupons = this.coupons.filter(c => c.id !== where.id);
        return true;
      }
    };
  }

  // Order collection helpers
  getOrderRepository() {
    return {
      create: async ({ data, include }) => {
        const num = this.orderCounter++;
        const newOrder = {
          id: `ord_${Date.now()}`,
          orderNumber: num,
          displayNumber: `VGI-${num}`,
          userId: data.userId,
          status: data.status || 'PAYMENT_PENDING',
          subtotal: data.subtotal,
          discount: data.discount || 0,
          total: data.total,
          phone: data.phone,
          pickupCode: data.pickupCode,
          appliedCoupon: data.appliedCoupon || null,
          specialInstructions: data.specialInstructions || null,
          prepTimeMinutes: null,
          prepStartTime: null,
          estimatedReadyTime: null,
          readyAt: null,
          completedAt: null,
          cancelledAt: null,
          cancelReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: data.items?.create ? data.items.create.map((it, idx) => ({
            id: `oi_${Date.now()}_${idx}`,
            ...it,
            options: it.options?.create || []
          })) : []
        };
        this.orders.unshift(newOrder);
        return newOrder;
      },
      findUnique: async ({ where }) => {
        const ord = this.orders.find(o => o.id === where.id);
        if (!ord) return null;
        const user = this.users.find(u => u.id === ord.userId);
        const rating = this.ratings.find(r => r.orderId === ord.id);
        return {
          ...ord,
          user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
          rating: rating || null
        };
      },
      findFirst: async ({ where }) => {
        return this.orders.find(o => {
          if (where.pickupCode && o.pickupCode !== where.pickupCode) return false;
          if (where.id && o.id !== where.id) return false;
          return true;
        }) || null;
      },
      findMany: async ({ where = {}, orderBy = {} } = {}) => {
        let list = [...this.orders];
        if (where.userId) list = list.filter(o => o.userId === where.userId);
        if (where.status) {
          if (typeof where.status === 'string') list = list.filter(o => o.status === where.status);
          else if (where.status.in) list = list.filter(o => where.status.in.includes(o.status));
          else if (where.status.not) list = list.filter(o => o.status !== where.status.not);
          else if (where.status.notIn) list = list.filter(o => !where.status.notIn.includes(o.status));
        }
        return list.map(o => {
          const user = this.users.find(u => u.id === o.userId);
          const rating = this.ratings.find(r => r.orderId === o.id);
          return {
            ...o,
            user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
            rating: rating || null
          };
        });
      },
      count: async ({ where = {} } = {}) => {
        let list = [...this.orders];
        if (where.status) {
          if (typeof where.status === 'string') list = list.filter(o => o.status === where.status);
          else if (where.status.in) list = list.filter(o => where.status.in.includes(o.status));
          else if (where.status.notIn) list = list.filter(o => !where.status.notIn.includes(o.status));
        }
        return list.length;
      },
      update: async ({ where, data }) => {
        const order = this.orders.find(o => o.id === where.id);
        if (order) {
          Object.assign(order, data);
          order.updatedAt = new Date();
          const user = this.users.find(u => u.id === order.userId);
          return {
            ...order,
            user: user ? { name: user.name, email: user.email, phone: user.phone } : null
          };
        }
        return null;
      }
    };
  }

  // CanteenSettings collection helpers
  getCanteenSettingsRepository() {
    return {
      findUnique: async () => this.canteenSettings,
      create: async ({ data }) => {
        this.canteenSettings = { ...this.canteenSettings, ...data };
        return this.canteenSettings;
      },
      upsert: async ({ update }) => {
        Object.assign(this.canteenSettings, update);
        return this.canteenSettings;
      }
    };
  }

  // Notifications
  getNotificationRepository() {
    return {
      create: async ({ data }) => {
        const notif = { id: `notif_${Date.now()}`, ...data, read: false, createdAt: new Date() };
        this.notifications.unshift(notif);
        return notif;
      },
      findMany: async ({ where } = {}) => {
        let list = [...this.notifications];
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        return list;
      },
      count: async ({ where } = {}) => {
        let list = [...this.notifications];
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        if (where?.read !== undefined) list = list.filter(n => n.read === where.read);
        return list.length;
      },
      updateMany: async ({ where, data }) => {
        this.notifications.forEach(n => {
          if (!where.userId || n.userId === where.userId) {
            if (data.read !== undefined) n.read = data.read;
          }
        });
      }
    };
  }

  // Ratings
  getRatingRepository() {
    return {
      upsert: async ({ where, update, create }) => {
        let rating = this.ratings.find(r => r.orderId === where.orderId);
        if (rating) {
          Object.assign(rating, update);
        } else {
          rating = { id: `rate_${Date.now()}`, ...create, createdAt: new Date() };
          this.ratings.push(rating);
        }
        return rating;
      },
      findMany: async () => {
        return this.ratings.map(r => ({
          ...r,
          user: this.users.find(u => u.id === r.userId) || { name: 'Student' },
          order: this.orders.find(o => o.id === r.orderId) || { displayNumber: 'VGI-Order' }
        }));
      }
    };
  }

  // Payment
  getPaymentRepository() {
    return {
      create: async ({ data }) => ({ id: `pay_${Date.now()}`, ...data }),
      upsert: async ({ update, create }) => ({ id: `pay_${Date.now()}`, ...update, ...create }),
      findFirst: async () => null,
      update: async () => true
    };
  }

  // Refund
  getRefundRepository() {
    return {
      upsert: async ({ update, create }) => ({ id: `ref_${Date.now()}`, ...update, ...create }),
      create: async ({ data }) => ({ id: `ref_${Date.now()}`, ...data })
    };
  }

  getOptionGroupRepository() {
    return {
      create: async ({ data }) => {
        return { id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...data, options: [] };
      },
      findMany: async () => []
    };
  }

  getOptionRepository() {
    return {
      create: async ({ data }) => {
        return { id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...data };
      },
      findMany: async () => []
    };
  }

  // AuditLog
  getAuditLogRepository() {
    return {
      create: async () => true
    };
  }

  // OrderItem groupBy for reports
  getOrderItemRepository() {
    return {
      groupBy: async () => [
        { itemName: 'Crispy Punjabi Samosa (2 pcs)', _sum: { quantity: 42, subtotal: 1260 } },
        { itemName: 'Amritsari Chole Bhature (2 pcs)', _sum: { quantity: 28, subtotal: 2520 } },
        { itemName: 'Special Adrak Elaichi Kulhad Chai', _sum: { quantity: 56, subtotal: 1120 } },
        { itemName: 'Classic Butter Cheese Maggi', _sum: { quantity: 24, subtotal: 1440 } }
      ]
    };
  }

  // Build client proxy
  getClient() {
    const self = this;
    const client = {
      user: this.getUserRepository(),
      optionGroup: this.getOptionGroupRepository(),
      option: this.getOptionRepository(),
      category: this.getCategoryRepository(),
      menuItem: this.getMenuItemRepository(),
      coupon: this.getCouponRepository(),
      order: this.getOrderRepository(),
      orderItem: this.getOrderItemRepository(),
      canteenSettings: this.getCanteenSettingsRepository(),
      notification: this.getNotificationRepository(),
      rating: this.getRatingRepository(),
      payment: this.getPaymentRepository(),
      refund: this.getRefundRepository(),
      auditLog: this.getAuditLogRepository(),
      $transaction: async (fn) => {
        if (typeof fn === 'function') return fn(client);
        return [];
      }
    };
    return client;
  }
}

export const mockDbStore = new MockDbStore();
export const mockPrismaClient = mockDbStore.getClient();

