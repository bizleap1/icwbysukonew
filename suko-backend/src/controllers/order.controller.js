const prisma = require('../prisma/client');
const { sendOrderConfirmationEmail, sendOrderCancellationEmail } = require('../utils/email.service');

async function createOrder(req, res) {
  try {
    const userId = req.user.userId;
    const { items: bodyItems, total: bodyTotal, name: bodyName, phone: bodyPhone } = req.body || {};

    // Auto-update user name & phone in User table if provided from checkout form
    if (bodyName || bodyPhone) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(bodyName && bodyName.trim() && { name: bodyName.trim() }),
            ...(bodyPhone && bodyPhone.trim() && { phone: bodyPhone.trim() })
          }
        });
      } catch (uErr) {
        console.error("Auto update user profile error:", uErr);
      }
    }

    let cartItems = await prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { product: true }
    });

    // If backend DB cart is empty, construct cart items from body payload if provided
    if (cartItems.length === 0 && Array.isArray(bodyItems) && bodyItems.length > 0) {
      for (const bItem of bodyItems) {
        const product = await prisma.product.findUnique({ where: { id: parseInt(bItem.product_id) } });
        if (product) {
          cartItems.push({
            product_id: product.id,
            quantity: parseInt(bItem.quantity || 1),
            size: bItem.size || null,
            product
          });
        }
      }
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Add items before placing an order.' });
    }

    // Check stock availability before creating the order
    for (const item of cartItems) {
      if (item.product && item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for ${item.product.name}. Available: ${item.product.stock}`
        });
      }
    }

    // Use total provided by frontend (discounted) or calculate from cart item prices
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const finalTotal = bodyTotal != null ? parseFloat(bodyTotal) : calculatedTotal;

    // Use a transaction so order creation + stock update + cart clearing all succeed or all fail together
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total: finalTotal,
          status: 'pending',
          items: {
            create: cartItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              size: item.size || null,
              price_at_purchase: item.product ? item.product.price : 0
            }))
          }
        },
        include: { items: { include: { product: true } } }
      });

      // Reduce stock for each product
      for (const item of cartItems) {
        if (item.product_id) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { user_id: userId } });

      return newOrder;
    });

    // Fetch user details for email (prioritize email entered in Checkout Contact Form)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const recipientEmail = (req.body && req.body.email && req.body.email.trim()) || (user && user.email);
    if (recipientEmail) {
      sendOrderConfirmationEmail(recipientEmail, order);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.userId },
      include: { items: { include: { product: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: { include: { product: true } } }
    });

    if (!order || (req.user.role !== 'admin' && order.user_id !== req.user.userId)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      include: { 
        items: { include: { product: true } },
        user: { 
          select: { 
            id: true, 
            email: true, 
            name: true, 
            phone: true,
            addresses: true
          } 
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancel_requested', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, user: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      // If status changed to cancelled and wasn't already cancelled, restore product stock
      if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      return updated;
    });

    // If order was in cancel_requested and admin changed it to cancelled or processing
    if (existingOrder.status === 'cancel_requested' && existingOrder.user && existingOrder.user.email) {
      const statusType = status === 'cancelled' ? 'approved' : 'rejected';
      sendOrderCancellationEmail(existingOrder.user.email, updatedOrder, statusType);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, user: true }
    });

    if (!order || order.user_id !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'completed' || order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot request cancellation for an order that is already ${order.status}` });
    }

    if (order.status === 'cancel_requested') {
      return res.status(400).json({ error: 'Cancellation request is already pending Admin approval' });
    }

    const { reason } = req.body;
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancel_requested',
        cancel_reason: reason ? reason.trim() : 'Customer requested cancellation'
      }
    });

    if (order.user && order.user.email) {
      sendOrderCancellationEmail(order.user.email, updatedOrder, 'requested');
    }

    res.json({ message: 'Cancellation request submitted successfully. Awaiting Admin Approval.', order: updatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request order cancellation' });
  }
}

// Admin Delete Order
async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete associated OrderItems first
    await prisma.orderItem.deleteMany({ where: { order_id: orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    res.json({ message: `Order #SUKO-${1000 + orderId} deleted successfully` });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
}

// Admin Modify / Edit Order
async function editOrderAdmin(req, res) {
  try {
    const { id } = req.params;
    const { status, total, cancel_reason } = req.body;
    const orderId = parseInt(id);

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(total !== undefined && { total: parseFloat(total) }),
        ...(cancel_reason !== undefined && { cancel_reason })
      },
      include: { items: { include: { product: true } }, user: true }
    });

    res.json({ message: 'Order updated successfully', order: updated });
  } catch (err) {
    console.error("Edit order admin error:", err);
    res.status(500).json({ error: 'Failed to modify order' });
  }
}

module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getAllOrders, 
  updateOrderStatus, 
  cancelOrder,
  deleteOrder,
  editOrderAdmin
};
