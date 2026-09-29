import { categoriesData, menuItemsData } from '../src/config/menuData.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting VGI Canteen database seeding...');

  // 1. Canteen Settings
  const canteenSettings = await prisma.canteenSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      status: 'OPEN',
      maxActiveOrders: 40,
      openTime: '08:30 AM',
      closeTime: '08:30 PM',
      contactPhone: '+91 98765 43210',
      contactWhatsapp: '+91 98765 43210',
      announcement: 'Fresh & hot meals ready for pickup at VGI Canteen counter! Avoid the queue by ordering in advance.'
    }
  });
  console.log('✅ Canteen settings seeded:', canteenSettings.status);

  // 2. Default Users
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vgi.ac.in').toLowerCase();
  const adminName = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const adminPassword = await bcrypt.hash(adminPass, 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      name: adminName
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      phone: '9876543210'
    }
  });
  console.log('✅ Admin user created:', adminUser.email, `(login with username: "${adminName}" or email: "${adminEmail}")`);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@vgi.ac.in' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'student@vgi.ac.in',
      password: studentPassword,
      role: 'STUDENT',
      phone: '9876501234'
    }
  });
  console.log('✅ Demo student user created:', studentUser.email);

  // 3. Categories
  const categoryMap = {};
  for (const cat of categoriesData) {
    let existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      existing = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder
        }
      });
    }
    categoryMap[cat.name] = existing.id;
  }
  console.log('✅ Categories seeded');

  // 4. Menu Items
  for (const item of menuItemsData) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) continue;

    let menuItem = await prisma.menuItem.findFirst({
      where: { name: item.name }
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          prepTime: item.prepTime,
          isPopular: item.isPopular,
          isFeatured: item.isFeatured,
          stockQty: 100,
          active: true,
          soldOut: false
        }
      });
    } else {
      menuItem = await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: {
          categoryId,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          prepTime: item.prepTime,
          isPopular: item.isPopular,
          isFeatured: item.isFeatured
        }
      });
    }

    const groups = item.optionGroups || [];
    for (const optGroup of groups) {
      let createdGroup = await prisma.optionGroup.findFirst({
        where: {
          menuItemId: menuItem.id,
          name: optGroup.name
        }
      });

      if (!createdGroup) {
        createdGroup = await prisma.optionGroup.create({
          data: {
            menuItemId: menuItem.id,
            name: optGroup.name,
            selectionType: optGroup.selectionType || 'SINGLE',
            required: !!optGroup.required
          }
        });
      }

      const choices = optGroup.options || optGroup.choices || [];
      for (const choice of choices) {
        const existingChoice = await prisma.option.findFirst({
          where: {
            groupId: createdGroup.id,
            name: choice.name
          }
        });

        if (!existingChoice) {
          await prisma.option.create({
            data: {
              groupId: createdGroup.id,
              name: choice.name,
              priceDelta: choice.priceDelta || 0
            }
          });
        }
      }
    }
  }
  console.log('✅ Menu items with options seeded successfully');

  // 5. Coupons
  const coupons = [
    {
      code: 'HOSTEL20',
      description: '20% off up to ₹40 on orders above ₹100 for hostel students',
      type: 'PERCENTAGE',
      value: 20,
      minOrder: 100,
      maxDiscount: 40,
      active: true
    },
    {
      code: 'WELCOME50',
      description: 'Flat ₹50 off on minimum order of ₹200',
      type: 'FIXED',
      value: 50,
      minOrder: 200,
      maxDiscount: 50,
      active: true
    },
    {
      code: 'VGICHAI',
      description: 'Flat ₹10 off on Chai & Snacks orders above ₹50',
      type: 'FIXED',
      value: 10,
      minOrder: 50,
      maxDiscount: 10,
      active: true
    }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c
    });
  }
  console.log('✅ Coupons seeded:', coupons.map(c => c.code).join(', '));

  console.log('🎉 Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
