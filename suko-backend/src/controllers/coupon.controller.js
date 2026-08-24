const prisma = require('../prisma/client');

// Validate a coupon code at checkout
async function validateCoupon(req, res) {
  try {
    const { code, orderTotal } = req.body;

    if (!code || typeof code !== 'string' || code.trim() === '') {
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

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    let percentNum = null;
    let flatNum = null;
    let minOrderNum = 0;

    if (discount_percent !== undefined && discount_percent !== '' && discount_percent !== null) {
      percentNum = parseInt(discount_percent, 10);
      if (isNaN(percentNum) || percentNum < 1 || percentNum > 100) {
        return res.status(400).json({ error: 'Discount percent must be an integer between 1 and 100' });
      }
    }

    if (discount_flat !== undefined && discount_flat !== '' && discount_flat !== null) {
      flatNum = parseFloat(discount_flat);
      if (isNaN(flatNum) || flatNum <= 0) {
        return res.status(400).json({ error: 'Flat discount must be a positive number greater than zero' });
      }
    }

    if (percentNum === null && flatNum === null) {
      return res.status(400).json({ error: 'Please specify either a discount percentage (1-100) or flat discount amount' });
    }

    if (min_order_value !== undefined && min_order_value !== '' && min_order_value !== null) {
      minOrderNum = parseFloat(min_order_value);
      if (isNaN(minOrderNum) || minOrderNum < 0) {
        return res.status(400).json({ error: 'Minimum order value cannot be negative' });
      }
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(409).json({ error: `Coupon code "${cleanCode}" already exists` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discount_percent: percentNum,
        discount_flat: flatNum,
        min_order_value: minOrderNum
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
    const couponId = parseInt(req.params.id, 10);
    if (isNaN(couponId)) return res.status(400).json({ error: 'Invalid coupon ID' });

    await prisma.coupon.delete({
      where: { id: couponId }
    });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error("Delete coupon error:", err);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
}

module.exports = { validateCoupon, getAllCoupons, createCoupon, deleteCoupon };
