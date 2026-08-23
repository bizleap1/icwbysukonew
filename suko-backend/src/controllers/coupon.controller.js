const prisma = require('../prisma/client');

// Validate a coupon code at checkout
async function validateCoupon(req, res) {
  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!coupon || !coupon.is_active) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    const total = parseFloat(orderTotal || 0);
    const minOrderVal = parseFloat(coupon.min_order_value || 0);

    if (total < minOrderVal) {
      return res.status(400).json({
        error: `Minimum order total of ₹${minOrderVal} required for coupon ${coupon.code}`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_percent) {
      discountAmount = (total * coupon.discount_percent) / 100;
    } else if (coupon.discount_flat) {
      discountAmount = parseFloat(coupon.discount_flat);
    }

    // Ensure discount does not exceed order total
    discountAmount = Math.min(discountAmount, total);

    res.json({
      valid: true,
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      discount_flat: coupon.discount_flat,
      discountAmount: Math.round(discountAmount * 100) / 100
    });
  } catch (err) {
    console.error("Validate coupon error:", err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
}

// Get all active coupons for display/admin
async function getAllCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(coupons);
  } catch (err) {
    console.error("Get coupons error:", err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
}

// Create new coupon (Admin)
async function createCoupon(req, res) {
  try {
    const { code, discount_percent, discount_flat, min_order_value } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discount_percent: discount_percent ? parseInt(discount_percent) : null,
        discount_flat: discount_flat ? parseFloat(discount_flat) : null,
        min_order_value: min_order_value ? parseFloat(min_order_value) : 0
      }
    });

    res.status(201).json(coupon);
  } catch (err) {
    console.error("Create coupon error:", err);
    res.status(500).json({ error: err.message || 'Failed to create coupon' });
  }
}

// Delete coupon (Admin)
async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error("Delete coupon error:", err);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
}

module.exports = { validateCoupon, getAllCoupons, createCoupon, deleteCoupon };
