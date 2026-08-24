const prisma = require('../prisma/client');
const { 
  uploadBuffer, 
  uploadProductMediaAtomic,
  safeDeleteAsset, 
  extractCloudinaryPublicId 
} = require('../utils/media.service');

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
      const catId = parseInt(category, 10);
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
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, stock, image_url, category_id, sub_category, size_stock } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number greater than zero' });
    }

    let parsedSizeStock = {};
    if (size_stock) {
      try {
        parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        parsedSizeStock = {};
      }
    }

    // Validate size stock values
    for (const [sz, qty] of Object.entries(parsedSizeStock)) {
      const numQty = parseInt(qty, 10);
      if (isNaN(numQty) || numQty < 0) {
        return res.status(400).json({ error: `Size "${sz}" must have a non-negative inventory quantity` });
      }
    }

    const sizes = Object.keys(parsedSizeStock);
    const calculatedStock = sizes.length > 0 
      ? Object.values(parsedSizeStock).reduce((acc, val) => acc + (Number(val) || 0), 0)
      : parseInt(stock || 0, 10);

    if (calculatedStock < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    const publicId = image_url ? extractCloudinaryPublicId(image_url) : null;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: numPrice,
        stock: calculatedStock,
        image_url: image_url || null,
        images: image_url ? [image_url] : [],
        cloudinary_public_id: publicId,
        cloudinary_public_ids: publicId ? [publicId] : [],
        category_id: category_id ? parseInt(category_id, 10) : null,
        sub_category: sub_category || null,
        sizes,
        size_stock: parsedSizeStock
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function createProductWithImage(req, res) {
  try {
    const { name, description, price, stock, category_id, sub_category, size_stock } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number greater than zero' });
    }

    let parsedSizeStock = {};
    if (size_stock) {
      try {
        parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        parsedSizeStock = {};
      }
    }

    // Validate size stock values
    for (const [sz, qty] of Object.entries(parsedSizeStock)) {
      const numQty = parseInt(qty, 10);
      if (isNaN(numQty) || numQty < 0) {
        return res.status(400).json({ error: `Size "${sz}" must have a non-negative inventory quantity` });
      }
    }

    const sizes = Object.keys(parsedSizeStock);
    const calculatedStock = sizes.length > 0 
      ? Object.values(parsedSizeStock).reduce((acc, val) => acc + (Number(val) || 0), 0)
      : parseInt(stock || 0, 10);

    if (calculatedStock < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    // Process file uploads atomically
    const primaryFile = req.files?.image?.[0] || req.file;
    const galleryFiles = req.files?.images || [];

    const { primaryResult, allUrls, allPublicIds } = await uploadProductMediaAtomic({
      primaryFile,
      galleryFiles
    });

    const primaryUrl = primaryResult ? primaryResult.url : (allUrls[0] || null);
    const primaryPublicId = primaryResult ? primaryResult.public_id : (allPublicIds[0] || null);

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: numPrice,
        stock: calculatedStock,
        image_url: primaryUrl,
        images: allUrls,
        cloudinary_public_id: primaryPublicId,
        cloudinary_public_ids: allPublicIds,
        category_id: category_id ? parseInt(category_id, 10) : null,
        sub_category: sub_category || null,
        sizes,
        size_stock: parsedSizeStock
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProductWithImage error:", err.message);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    const { name, description, price, stock, category_id, sub_category, size_stock, existing_images } = req.body;
    const updateData = {};

    if (name !== undefined && name !== "") {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (price !== undefined && price !== "") {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number greater than zero' });
      }
      updateData.price = numPrice;
    }
    if (category_id !== undefined) {
      updateData.category_id = category_id ? parseInt(category_id, 10) : null;
    }
    if (sub_category !== undefined) {
      updateData.sub_category = sub_category || null;
    }

    if (size_stock !== undefined) {
      let parsedSizeStock = {};
      try {
        parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        parsedSizeStock = {};
      }

      // Validate size quantities
      for (const [sz, qty] of Object.entries(parsedSizeStock)) {
        const numQty = parseInt(qty, 10);
        if (isNaN(numQty) || numQty < 0) {
          return res.status(400).json({ error: `Size "${sz}" must have a non-negative inventory quantity` });
        }
      }

      updateData.size_stock = parsedSizeStock;
      updateData.sizes = Object.keys(parsedSizeStock);
      updateData.stock = Object.values(parsedSizeStock).reduce((acc, val) => acc + (Number(val) || 0), 0);
    } else if (stock !== undefined && stock !== "") {
      const numStock = parseInt(stock, 10);
      if (isNaN(numStock) || numStock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
      }
      updateData.stock = numStock;
    }

    // Process new image uploads atomically
    const primaryFile = req.files?.image?.[0] || req.file;
    const galleryFiles = req.files?.images || [];

    const { primaryResult, galleryResults } = await uploadProductMediaAtomic({
      primaryFile,
      galleryFiles
    });

    let keptExistingUrls = [];
    if (existing_images) {
      try {
        keptExistingUrls = typeof existing_images === 'string' ? JSON.parse(existing_images) : existing_images;
      } catch (e) {
        keptExistingUrls = Array.isArray(existing_images) ? existing_images : [];
      }
    } else {
      keptExistingUrls = existingProduct.images || (existingProduct.image_url ? [existingProduct.image_url] : []);
    }

    const newUploadedUrls = galleryResults.map(o => o.url);
    let finalImages = [...keptExistingUrls, ...newUploadedUrls];

    if (primaryResult) {
      finalImages = [primaryResult.url, ...finalImages.filter(u => u !== primaryResult.url)];
      updateData.image_url = primaryResult.url;
      updateData.cloudinary_public_id = primaryResult.public_id || extractCloudinaryPublicId(primaryResult.url);
    } else if (finalImages.length > 0) {
      updateData.image_url = finalImages[0];
      updateData.cloudinary_public_id = extractCloudinaryPublicId(finalImages[0]) || existingProduct.cloudinary_public_id;
    }

    updateData.images = finalImages;
    updateData.cloudinary_public_ids = finalImages.map(u => extractCloudinaryPublicId(u)).filter(Boolean);

    // Apply database update first
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    // Detect removed images and safely clean up Cloudinary assets in background (only if not referenced elsewhere)
    const originalUrls = existingProduct.images || (existingProduct.image_url ? [existingProduct.image_url] : []);
    const removedUrls = originalUrls.filter(u => !finalImages.includes(u));

    for (const removedUrl of removedUrls) {
      safeDeleteAsset(removedUrl, prisma).catch(err => {
        console.error("Background media cleanup error:", err.message);
      });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update product error:", err.message);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function deleteProduct(req, res) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    // SAFETY CHECK: Check if historical order items exist for this product
    const orderItemsCount = await prisma.orderItem.count({
      where: { product_id: productId }
    });

    if (orderItemsCount > 0) {
      return res.status(409).json({
        error: `Cannot delete product #${productId} as it is referenced in ${orderItemsCount} client order(s). Set stock to 0 to remove from active display without corrupting historical order records.`
      });
    }

    const imagesToClean = existingProduct.images || (existingProduct.image_url ? [existingProduct.image_url] : []);

    // Clean up non-historical transient dependencies safely
    await prisma.cartItem.deleteMany({ where: { product_id: productId } });
    await prisma.wishlist.deleteMany({ where: { product_id: productId } });
    await prisma.review.deleteMany({ where: { product_id: productId } });
    await prisma.stockNotification.deleteMany({ where: { product_id: productId } });

    // Now delete the unreferenced product from the database
    await prisma.product.delete({ where: { id: productId } });

    // After database deletion succeeds, clean up Cloudinary/local images that are not shared
    for (const imgUrl of imagesToClean) {
      safeDeleteAsset(imgUrl, prisma).catch(err => {
        console.error("Post-delete media cleanup warning:", err.message);
      });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  createProductWithImage,
  updateProduct,
  deleteProduct
};
