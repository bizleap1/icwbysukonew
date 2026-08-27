import prisma from '../prisma/client.js';
import { sendEmail } from '../utils/email.service.js';

export const subscribeStockNotification = async (req, res) => {
  try {
    const { email, product_id, size } = req.body;

    if (!email || !product_id) {
      return res.status(400).json({ message: 'Email and product_id are required' });
    }

    const notification = await prisma.stockNotification.create({
      data: {
        email,
        product_id: parseInt(product_id),
        size: size || null,
        user_id: req.user ? req.user.id : null,
      },
    });

    res.status(201).json({ message: 'Subscribed to stock notification', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing to notification', error: error.message });
  }
};

export const sendAdminBroadcastEmail = async (req, res) => {
  try {
    const { subject, message, recipientEmail } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (recipientEmail) {
      await sendEmail({ to: recipientEmail, subject, html: `<p>${message}</p>` });
      return res.json({ message: `Email sent to ${recipientEmail}` });
    }

    const users = await prisma.user.findMany({ select: { email: true } });
    for (const user of users) {
      if (user.email) {
        await sendEmail({ to: user.email, subject, html: `<p>${message}</p>` });
      }
    }

    res.json({ message: `Broadcast email sent to ${users.length} registered customers` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending broadcast email', error: error.message });
  }
};
