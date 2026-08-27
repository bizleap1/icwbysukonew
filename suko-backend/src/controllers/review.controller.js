import prisma from '../prisma/client.js';

export const addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !comment) {
      return res.status(400).json({ message: 'Product ID and comment are required' });
    }

    // Strict rating validation: must be an integer between 1 and 5
    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    if (typeof rating !== 'number' || !Number.isInteger(rating) || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const productIdNum = parseInt(product_id, 10);
    if (isNaN(productIdNum)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Verified purchase check: only customers with paid orders can review
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        user_id: req.user.id,
        status: { in: ['paid', 'processing', 'shipped', 'delivered'] },
        items: { some: { product_id: productIdNum } }
      }
    });

    if (!verifiedOrder) {
      return res.status(403).json({
        message: 'Only verified purchasers of this item can leave a review'
      });
    }

    // Prevent duplicate reviews
    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: req.user.id,
        product_id: productIdNum
      }
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this product'
      });
    }

    const review = await prisma.review.create({
      data: {
        user_id: req.user.id,
        product_id: productIdNum,
        rating,
        comment: String(comment).trim(),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { id: true, name: true, images: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
