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

// Add a review for a product
async function addReview(req, res) {
  try {
    const { product_id, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!product_id || !comment) {
      return res.status(400).json({ error: 'product_id and comment are required' });
    }

    const review = await prisma.review.create({
      data: {
        user_id: userId,
        product_id: parseInt(product_id),
        rating: rating ? parseInt(rating) : 5,
        comment
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
        product: { select: { id: true, name: true, slug: true, images: true } },
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
