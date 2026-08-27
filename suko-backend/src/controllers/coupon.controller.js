import prisma from '../prisma/client.js';

export const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ message: 'Invalid or inactive coupon code' });
    }

    const total = parseFloat(cartTotal || 0);
    if (coupon.min_order_value && total < Number(coupon.min_order_value)) {
      return res.status(400).json({
        message: `Minimum order value of Rs. ${coupon.min_order_value} required for this coupon`,
      });
    }

    let discountAmount = 0;
    if (coupon.discount_percent) {
      discountAmount = (total * coupon.discount_percent) / 100;
    } else if (coupon.discount_flat) {
      discountAmount = Number(coupon.discount_flat);
    }

    const finalTotal = Math.max(0, total - discountAmount);

    res.json({
      message: 'Coupon applied successfully',
      couponCode: coupon.code,
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { created_at: 'desc' } });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discount_percent, discount_flat, discount_value, discount_type, min_order_value } = req.body;

    const val = discount_value ? parseFloat(discount_value) : 0;
    const isPercent = discount_type === 'PERCENTAGE' || discount_percent !== undefined;
    const percent = discount_percent ? parseInt(discount_percent, 10) : (isPercent ? Math.round(val) : null);
    const flat = discount_flat ? parseFloat(discount_flat) : (!isPercent ? val : null);

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount_percent: percent,
        discount_flat: flat,
        min_order_value: min_order_value ? parseFloat(min_order_value) : 0,
      },
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};
