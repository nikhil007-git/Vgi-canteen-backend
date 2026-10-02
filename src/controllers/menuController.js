import prisma from '../config/db.js';

// Public: Get all categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: { where: { active: true } } }
        }
      }
    });

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// Public: Get menu items with optional category filter and search
export const getMenuItems = async (req, res, next) => {
  try {
    const { categoryId, search, popular, featured } = req.query;

    const where = {
      active: true
    };

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (popular === 'true') {
      where.isPopular = true;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        optionGroups: {
          include: {
            options: {
              where: { active: true },
              orderBy: { priceDelta: 'asc' }
            }
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isPopular: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
};

// Public: Get single menu item with all option groups
export const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        optionGroups: {
          include: {
            options: {
              where: { active: true }
            }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// Admin: Create Menu Item
export const createMenuItem = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      prepTime,
      isPopular,
      isFeatured,
      stockMode,
      stockQty,
      optionGroups
    } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Category, name, and price are required.' });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: parseFloat(price),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        prepTime: prepTime ? parseInt(prepTime) : 15,
        isPopular: !!isPopular,
        isFeatured: !!isFeatured,
        stockMode: stockMode === 'QUANTITY' ? 'QUANTITY' : 'MANUAL',
        stockQty: stockQty ? parseInt(stockQty) : 100,
        active: true,
        soldOut: !!req.body.soldOut
      }
    });

    // If options were passed during creation
    if (optionGroups && Array.isArray(optionGroups)) {
      for (const group of optionGroups) {
        if (!group.name) continue;
        const createdGroup = await prisma.optionGroup.create({
          data: {
            menuItemId: newItem.id,
            name: group.name,
            selectionType: group.selectionType || 'SINGLE',
            required: !!group.required
          }
        });

        if (group.options && Array.isArray(group.options)) {
          for (const opt of group.options) {
            if (!opt.name) continue;
            await prisma.option.create({
              data: {
                groupId: createdGroup.id,
                name: opt.name,
                priceDelta: opt.priceDelta ? parseFloat(opt.priceDelta) : 0
              }
            });
          }
        }
      }
    }

    let completeItem = null;
    try {
      completeItem = await prisma.menuItem.findUnique({
        where: { id: newItem.id },
        include: {
          category: true,
          optionGroups: { include: { options: true } }
        }
      });
    } catch {
      completeItem = newItem;
    }

    res.status(201).json({ success: true, message: 'Menu item created successfully', item: completeItem || newItem });
  } catch (error) {
    next(error);
  }
};

// Admin: Update Menu Item
export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      prepTime,
      isPopular,
      isFeatured,
      soldOut,
      active,
      stockMode,
      stockQty
    } = req.body;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: categoryId || undefined,
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
        prepTime: prepTime !== undefined ? parseInt(prepTime) : undefined,
        isPopular: isPopular !== undefined ? !!isPopular : undefined,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        soldOut: soldOut !== undefined ? !!soldOut : undefined,
        active: active !== undefined ? !!active : undefined,
        stockMode: stockMode !== undefined ? stockMode : undefined,
        stockQty: stockQty !== undefined ? parseInt(stockQty) : undefined
      },
      include: {
        category: true,
        optionGroups: { include: { options: true } }
      }
    });

    res.json({ success: true, message: 'Item updated successfully', item: updated });
  } catch (error) {
    next(error);
  }
};

// Admin: Toggle Sold Out Status
export const toggleSoldOut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { soldOut: !item.soldOut }
    });

    res.json({
      success: true,
      message: `Item marked as ${updated.soldOut ? 'Sold Out' : 'Available'}`,
      item: updated
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Menu Item (Soft delete if item has order references)
export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const linkedOrdersCount = await prisma.orderItem.count({ where: { menuItemId: id } });
    if (linkedOrdersCount > 0) {
      await prisma.menuItem.update({
        where: { id },
        data: { active: false, soldOut: true }
      });
      return res.json({
        success: true,
        message: 'Item has historical order records and has been safely archived from the menu.'
      });
    }

    await prisma.menuItem.delete({ where: { id } });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Admin: Category Management
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      }
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, active } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        active: active !== undefined ? !!active : undefined
      }
    });

    res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { menuItems: { select: { id: true } } }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const itemIds = category.menuItems.map(m => m.id);
    const orderItemsCount = await prisma.orderItem.count({
      where: { menuItemId: { in: itemIds } }
    });

    if (orderItemsCount > 0) {
      await prisma.menuItem.updateMany({
        where: { categoryId: id },
        data: { active: false, soldOut: true }
      });
      await prisma.category.update({
        where: { id },
        data: { active: false }
      });
      return res.json({
        success: true,
        message: 'Category and its items have historical orders and have been safely archived.'
      });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

