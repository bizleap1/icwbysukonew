const prisma = require('../prisma/client');

// Get all reviews for a specific product
async function getProductReviews(req, res) {
  try {
    const productId = parseInt(req.params.productId);
    const reviews = await prisma.review.findMany({
      where: { product_id: productId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { created_at: 'desc' }
    });

    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 5.0;

    res.json({
      total: reviews.length,
      averageRating: parseFloat(averageRating),
      reviews
    });
  } catch (err) {
    console.error("Get product reviews error:", err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

const { ORDER_STATUS } = require('../utils/orderStateMachine');

// Add a review for a product (Verified purchase only)
async function addReview(req, res) {
  try {
    const { product_id, rating, comment } = req.body;
    const userId = req.user.userId;

    // 1. Strict Rating Validation
    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: 'Rating is required.' });
    }
    if (typeof rating !== 'number' || !Number.isInteger(rating) || Number.isNaN(rating)) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // 2. Product ID and Comment validation
    const productId = parseInt(product_id, 10);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Valid product_id is required.' });
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required.' });
    }
    const cleanComment = comment.trim();
    if (cleanComment.length > 2000) {
      return res.status(400).json({ error: 'Review comment exceeds maximum allowed limit of 2000 characters.' });
    }

    // 3. Ensure product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // 4. Verified Purchase Check: User must have a paid/completed order containing this product
    const verifiedPurchase = await prisma.order.findFirst({
      where: {
        user_id: userId,
        status: {
          in: [
            ORDER_STATUS.PAID,
            ORDER_STATUS.PROCESSING,
            ORDER_STATUS.SHIPPED,
            ORDER_STATUS.DELIVERED
          ]
        },
        items: {
          some: { product_id: productId }
        }
      }
    });

    if (!verifiedPurchase) {
      return res.status(403).json({
        error: 'Verified purchase required. You can only review products that you have purchased and paid for.'
      });
    }

    // 5. Prevent duplicate reviews for the same product by the same user
    const existingReview = await prisma.review.findFirst({
      where: { user_id: userId, product_id: productId }
    });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this product.' });
    }

    const review = await prisma.review.create({
      data: {
        user_id: userId,
        product_id: productId,
        rating,
        comment: cleanComment
      },
      include: { user: { select: { name: true, email: true } } }
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ error: 'Failed to add review' });
  }
}

// Get all reviews for Admin moderation
async function getAllReviews(req, res) {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { id: true, name: true, images: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) {
    console.error("Get all reviews error:", err);
    res.status(500).json({ error: 'Failed to fetch all reviews' });
  }
}

// Delete a review (Admin)
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}

module.exports = { getProductReviews, addReview, getAllReviews, deleteReview };
