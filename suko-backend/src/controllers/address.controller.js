const prisma = require('../prisma/client');
const { validateIntegerId, rejectForbiddenFields } = require('../utils/validator');

async function getAddresses(req, res) {
  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: req.user.userId }
    });
    res.json(addresses);
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
}

async function addAddress(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { line1, city, state, pincode, phone } = req.body;

    if (!line1 || !city || !state || !pincode || !phone) {
      return res.status(400).json({ error: 'line1, city, state, pincode, and phone are required' });
    }

    const address = await prisma.address.create({
      data: {
        user_id: req.user.userId,
        line1,
        city,
        state,
        pincode,
        phone
      }
    });

    // Auto update user phone in User table if currently null
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (currentUser && !currentUser.phone) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { phone }
      });
    }

    res.status(201).json(address);
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ error: 'Failed to create address' });
  }
}

async function updateAddress(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const addressId = validateIntegerId(req.params.id, 'address ID');
    const { line1, city, state, pincode, phone } = req.body;

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...(line1 && { line1 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(phone && { phone })
      }
    });

    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Update address error:", err);
    res.status(500).json({ error: 'Failed to update address' });
  }
}

async function deleteAddress(req, res) {
  try {
    const addressId = validateIntegerId(req.params.id, 'address ID');

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id: addressId } });
    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Delete address error:", err);
    res.status(500).json({ error: 'Failed to delete address' });
  }
}

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
