import prisma from '../prisma/client.js';

export const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      const catLower = category.toLowerCase().trim();
      if (catLower.includes('coord') || catLower.includes('co-ord')) {
        where.category = { name: { contains: 'Co-ord', mode: 'insensitive' } };
      } else if (catLower.includes('indo')) {
        where.category = { name: { contains: 'Indo', mode: 'insensitive' } };
      } else if (catLower.includes('drape') || catLower.includes('saree')) {
        where.category = { name: { contains: 'Drape', mode: 'insensitive' } };
      } else if (catLower.includes('designer') || catLower.includes('suit')) {
        where.category = { name: { contains: 'Designer', mode: 'insensitive' } };
      } else if (catLower.includes('premium') || catLower.includes('material')) {
        where.category = { name: { contains: 'Premium', mode: 'insensitive' } };
      } else {
        const altName = category.replace(/-/g, ' ');
        where.category = {
          name: { contains: altName, mode: 'insensitive' }
        };
      }
    }

    let orderBy = { created_at: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };

    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || (isPaginated ? 24 : 100)));
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          variants: {
            orderBy: { size: 'asc' },
          },
          reviews: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.set('X-Total-Count', total.toString());
    res.set('X-Total-Pages', totalPages.toString());

    if (isPaginated) {
      return res.json({
        products,
        pagination: { page, limit, total, totalPages }
      });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();

    let product = null;
    const numId = parseInt(cleanId, 10);

    // 1. If cleanId is purely numeric, find by primary key
    if (!isNaN(numId) && String(numId) === cleanId) {
      product = await prisma.product.findUnique({
        where: { id: numId },
        include: {
          category: true,
          variants: {
            orderBy: { size: 'asc' },
          },
          reviews: { include: { user: { select: { name: true } } } },
        },
      });
    }

    // 2. If not found, map catalog IDs (e.g. "iw-1", "ds-2", "coord-3", "dress-5")
    if (!product) {
      const catalogIdMap = {
        'iw-1': 1, 'iw-2': 2, 'iw-3': 3, 'iw-4': 4,
        'ds-1': 5, 'ds-2': 6, 'ds-3': 7,
        'suit-1': 8, 'suit-2': 9, 'suit-3': 10, 'suit-4': 11,
        'psm-1': 12, 'psm-2': 13,
        'coord-1': 14, 'coord-2': 15, 'coord-3': 16, 'coord-4': 17,
        'coord-5': 18, 'coord-6': 19, 'coord-7': 20, 'coord-8': 21, 'coord-9': 22,
        'dress-1': 23, 'dress-2': 24, 'dress-3': 25, 'dress-4': 26,
        'dress-5': 27, 'dress-6': 28, 'dress-7': 29, 'dress-8': 30,
        'dress-9': 31, 'dress-10': 32, 'dress-11': 33, 'dress-12': 34,
        'dress-13': 35, 'dress-14': 36, 'dress-15': 37, 'dress-16': 38,
      };

      const lowerId = cleanId.toLowerCase();
      const matchedCatalogKey = Object.keys(catalogIdMap).find(k => lowerId === k || lowerId.endsWith(`-${k}`));

      if (matchedCatalogKey) {
        const mappedDbId = catalogIdMap[matchedCatalogKey];
        product = await prisma.product.findUnique({
          where: { id: mappedDbId },
          include: {
            category: true,
            variants: {
              orderBy: { size: 'asc' },
            },
            reviews: { include: { user: { select: { name: true } } } },
          },
        });
      }
    }

    // 3. If still not found, search by name, image_url, or variant SKU
    if (!product) {
      const cleanName = cleanId.replace(/[-_]+/g, ' ').trim();
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: cleanName, mode: 'insensitive' } },
            { image_url: { contains: cleanId, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: cleanId, mode: 'insensitive' } } } }
          ]
        },
        include: {
          category: true,
          variants: {
            orderBy: { size: 'asc' },
          },
          reviews: { include: { user: { select: { name: true } } } },
        },
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id, sub_category, sizes, size_stock, color, variants: explicitVariants } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
      let existing = [];
      if (req.body.existing_images) {
        try {
          existing = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        } catch (_) {}
      }
      images = [...existing, ...uploaded];
    } else if (req.body.images) {
      images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
    } else if (req.body.image_url) {
      images = [req.body.image_url];
    }

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes || [];
    const parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock || {};
    const parsedExplicitVariants = typeof explicitVariants === 'string' ? JSON.parse(explicitVariants) : explicitVariants;

    const numPrice = parseFloat(price);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Determine sizes & variant structure
      const targetSizes = Array.isArray(parsedSizes) && parsedSizes.length > 0
        ? parsedSizes
        : (Object.keys(parsedSizeStock).length > 0 ? Object.keys(parsedSizeStock) : ['Free Size']);

      const totalStock = Object.keys(parsedSizeStock).length > 0
        ? Object.values(parsedSizeStock).reduce((a, b) => a + Number(b || 0), 0)
        : parseInt(stock || 0, 10);

      // Create base product
      const product = await tx.product.create({
        data: {
          name,
          description,
          price: numPrice,
          stock: totalStock,
          image_url: images[0] || null,
          images,
          category_id: category_id ? parseInt(category_id, 10) : null,
          sub_category,
          sizes: targetSizes,
          size_stock: parsedSizeStock,
          whatsapp_inquiry: req.body.whatsapp_inquiry === 'true' || req.body.whatsapp_inquiry === true || false,
        },
      });

      // 2. Create authoritative ProductVariants
      const skuPrefix = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MIR';
      const createdVariants = [];

      if (Array.isArray(parsedExplicitVariants) && parsedExplicitVariants.length > 0) {
        for (const ev of parsedExplicitVariants) {
          const vSku = ev.sku || `MIR-${skuPrefix}-${product.id}-${(ev.size || 'M').toUpperCase()}`;
          const vStock = parseInt(ev.stock || 0, 10);
          const v = await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: vSku,
              barcode: ev.barcode || `BAR-${product.id}-${ev.size || 'M'}`,
              size: ev.size || 'Free Size',
              color: ev.color || color || 'Default',
              price: ev.price !== undefined ? parseFloat(ev.price) : numPrice,
              stock: vStock,
              is_active: ev.is_active !== undefined ? ev.is_active : true,
            },
          });
          createdVariants.push(v);
        }
      } else {
        for (const sz of targetSizes) {
          const vStock = parsedSizeStock[sz] !== undefined ? parseInt(parsedSizeStock[sz], 10) : Math.max(0, Math.floor(totalStock / targetSizes.length));
          const vSku = `MIR-${skuPrefix}-${product.id}-${sz.toUpperCase()}`;
          const v = await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: vSku,
              barcode: `BAR-${product.id}-${sz.toUpperCase()}`,
              size: sz,
              color: color || 'Default',
              price: numPrice,
              stock: vStock,
              is_active: true,
            },
          });
          createdVariants.push(v);
        }
      }

      // Sync computed product.stock and size_stock
      const realTotalStock = createdVariants.reduce((sum, v) => sum + v.stock, 0);
      const computedSizeStock = {};
      createdVariants.forEach(v => { computedSizeStock[v.size] = (computedSizeStock[v.size] || 0) + v.stock; });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          stock: realTotalStock,
          size_stock: computedSizeStock,
        },
        include: {
          category: true,
          variants: true,
        },
      });

      return updatedProduct;
    });

    res.status(201).json({ success: true, message: 'Product and authoritative variants created successfully', product: result });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, sub_category, sizes, size_stock, variants } = req.body;

    const productId = parseInt(id, 10);
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (price) data.price = parseFloat(price);
    if (category_id) data.category_id = parseInt(category_id, 10);
    if (sub_category) data.sub_category = sub_category;
    if (req.body.whatsapp_inquiry !== undefined) {
      data.whatsapp_inquiry = req.body.whatsapp_inquiry === 'true' || req.body.whatsapp_inquiry === true;
    }

    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
      let existing = [];
      if (req.body.existing_images) {
        try {
          existing = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        } catch (_) {}
      }
      const allImgs = [...existing, ...uploaded];
      data.images = allImgs;
      data.image_url = allImgs[0] || null;
    } else if (req.body.images) {
      const parsedImgs = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      if (Array.isArray(parsedImgs)) {
        data.images = parsedImgs;
        data.image_url = parsedImgs[0] || null;
      }
    } else if (req.body.image_url) {
      data.image_url = req.body.image_url;
      data.images = [req.body.image_url];
    }

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    const parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;

    if (parsedSizes) data.sizes = parsedSizes;
    if (parsedSizeStock) data.size_stock = parsedSizeStock;

    const updated = await prisma.$transaction(async (tx) => {
      // If explicit variants provided or size_stock updated, sync variants
      if (parsedSizeStock && typeof parsedSizeStock === 'object') {
        for (const [sz, st] of Object.entries(parsedSizeStock)) {
          const existingVariant = existing.variants.find(v => v.size.toLowerCase() === sz.toLowerCase());
          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                stock: parseInt(st, 10),
                ...(price ? { price: parseFloat(price) } : {}),
                ...(req.body.color ? { color: req.body.color } : {}),
              },
            });
          } else {
            const skuPrefix = (name || existing.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MIR';
            await tx.productVariant.create({
              data: {
                product_id: productId,
                sku: `MIR-${skuPrefix}-${productId}-${sz.toUpperCase()}`,
                barcode: `BAR-${productId}-${sz.toUpperCase()}`,
                size: sz,
                color: req.body.color || 'Default',
                price: price ? parseFloat(price) : existing.price,
                stock: parseInt(st, 10),
                is_active: true,
              },
            });
          }
        }
      }

      // Recompute Product total stock from variants
      const allVariants = await tx.productVariant.findMany({ where: { product_id: productId } });
      const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
      const computedSizeStock = {};
      allVariants.forEach(v => { computedSizeStock[v.size] = (computedSizeStock[v.size] || 0) + v.stock; });

      data.stock = totalStock;
      data.size_stock = computedSizeStock;

      const product = await tx.product.update({
        where: { id: productId },
        data,
        include: { category: true, variants: true },
      });

      return product;
    });

    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    await prisma.$transaction(async (tx) => {
      // 1. Delete Wishlist items
      await tx.wishlist?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 2. Delete Cart items
      await tx.cartItem?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 3. Delete Stock notifications & Reviews
      await tx.stockNotification?.deleteMany({ where: { product_id: productId } }).catch(() => {});
      await tx.review?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 4. Delete Return requests referencing this product
      await tx.returnRequest?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 5. Delete OrderItems referencing this product
      await tx.orderItem?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 6. Delete SaleItems referencing this product
      await tx.saleItem?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 7. Find variants and clean movements/purchase items
      const variants = await tx.productVariant.findMany({
        where: { product_id: productId },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      if (variantIds.length > 0) {
        await tx.purchaseItem?.deleteMany({ where: { variant_id: { in: variantIds } } }).catch(() => {});
        await tx.inventoryMovement?.deleteMany({ where: { variant_id: { in: variantIds } } }).catch(() => {});
        await tx.productVariant.deleteMany({ where: { product_id: productId } });
      }

      await tx.inventoryMovement?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      // 8. Delete the product
      await tx.product.delete({ where: { id: productId } });
    });

    res.json({ success: true, message: 'Product and all associated records deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error deleting product: ' + error.message, error: error.message });
  }
};
