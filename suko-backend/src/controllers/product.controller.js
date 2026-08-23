const prisma = require('../prisma/client');

async function getAllProducts(req, res) {
  try {
    const { search, category, gender, sub_category, minPrice, maxPrice, sort } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      const catId = parseInt(category);
      if (!isNaN(catId)) {
        where.category_id = catId;
      } else {
        where.category = { name: { equals: category, mode: 'insensitive' } };
      }
    }

    if (gender) {
      where.sub_category = { equals: gender, mode: 'insensitive' };
    } else if (sub_category) {
      where.sub_category = { equals: sub_category, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy = { created_at: 'desc' };
    if (sort === 'low') orderBy = { price: 'asc' };
    else if (sort === 'high') orderBy = { price: 'desc' };

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy
    });

    res.json(products);
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function getProductById(req, res) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, stock, image_url, category_id } = req.body;

    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: 'name, price, and stock are required' });
    }

    const product = await prisma.product.create({
      data: { name, description, price, stock, image_url, category_id }
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function createProductWithImage(req, res) {
  try {
    const { name, description, price, stock, category_id, sub_category, size_stock } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    let parsedSizeStock = {};
    if (size_stock) {
      try {
        parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        parsedSizeStock = {};
      }
    }

    const sizes = Object.keys(parsedSizeStock);
    const calculatedStock = sizes.length > 0 
      ? Object.values(parsedSizeStock).reduce((acc, val) => acc + (Number(val) || 0), 0)
      : parseInt(stock || 0);

    // Primary & Gallery Images
    const primaryFile = req.files?.image?.[0] || req.file;
    const primary_image_url = primaryFile ? `http://localhost:5000/uploads/${primaryFile.filename}` : null;

    const galleryFiles = req.files?.images || [];
    const gallery_urls = galleryFiles.map(f => `http://localhost:5000/uploads/${f.filename}`);
    
    const allImages = primary_image_url 
      ? [primary_image_url, ...gallery_urls.filter(u => u !== primary_image_url)]
      : gallery_urls;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: calculatedStock,
        image_url: primary_image_url || allImages[0] || null,
        images: allImages,
        category_id: category_id ? parseInt(category_id) : null,
        sub_category: sub_category || null,
        sizes,
        size_stock: parsedSizeStock
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function updateProduct(req, res) {
  try {
    const { name, description, price, stock, category_id, sub_category, size_stock, existing_images } = req.body;
    const updateData = {};

    if (name !== undefined && name !== "") updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined && price !== "") updateData.price = parseFloat(price);
    if (category_id !== undefined) updateData.category_id = category_id ? parseInt(category_id) : null;
    if (sub_category !== undefined) updateData.sub_category = sub_category || null;

    if (size_stock !== undefined) {
      let parsedSizeStock = {};
      try {
        parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        parsedSizeStock = {};
      }
      updateData.size_stock = parsedSizeStock;
      updateData.sizes = Object.keys(parsedSizeStock);
      updateData.stock = Object.values(parsedSizeStock).reduce((acc, val) => acc + (Number(val) || 0), 0);
    } else if (stock !== undefined && stock !== "") {
      updateData.stock = parseInt(stock);
    }

    const primaryFile = req.files?.image?.[0] || req.file;
    const galleryFiles = req.files?.images || [];
    
    let currentImages = [];
    if (existing_images) {
      try {
        currentImages = typeof existing_images === 'string' ? JSON.parse(existing_images) : existing_images;
      } catch (e) {
        currentImages = Array.isArray(existing_images) ? existing_images : [];
      }
    }

    const newUploadedUrls = galleryFiles.map(f => `http://localhost:5000/uploads/${f.filename}`);
    let updatedImages = [...currentImages, ...newUploadedUrls];

    if (primaryFile) {
      const primaryUrl = `http://localhost:5000/uploads/${primaryFile.filename}`;
      updateData.image_url = primaryUrl;
      updatedImages = [primaryUrl, ...updatedImages.filter(u => u !== primaryUrl)];
    } else if (updatedImages.length > 0) {
      updateData.image_url = updatedImages[0];
    }

    if (updatedImages.length > 0) {
      updateData.images = updatedImages;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function deleteProduct(req, res) {
  try {
    const productId = parseInt(req.params.id);

    // Clean up foreign key dependencies in CartItem, OrderItem, Wishlist, Review, StockNotification
    await prisma.cartItem.deleteMany({ where: { product_id: productId } });
    await prisma.orderItem.deleteMany({ where: { product_id: productId } });
    await prisma.wishlist.deleteMany({ where: { product_id: productId } });
    await prisma.review.deleteMany({ where: { product_id: productId } });
    await prisma.stockNotification.deleteMany({ where: { product_id: productId } });

    // Now delete the product
    await prisma.product.delete({ where: { id: productId } });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
}

module.exports = { getAllProducts, getProductById, createProduct, createProductWithImage, updateProduct, deleteProduct };
