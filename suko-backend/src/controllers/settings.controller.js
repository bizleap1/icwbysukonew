import prisma from '../prisma/client.js';

// Get or auto-create default store settings
export async function getSettings(req, res) {
  try {
    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          store_online: true,
          online_payments: true,
          cod_enabled: true,
          new_orders_enabled: true,
          whatsapp_number: '+919271218156',
          announcement_text: null,
          announcement_active: false,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('[Settings] getSettings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

// Update store settings (admin only)
export async function updateSettings(req, res) {
  try {
    const {
      store_online,
      online_payments,
      cod_enabled,
      new_orders_enabled,
      whatsapp_number,
      support_phone,
      support_email,
      atelier_address,
      instagram_url,
      facebook_url,
      google_review_url,
      announcement_text,
      announcement_active,
    } = req.body;

    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          store_online: store_online ?? true,
          online_payments: online_payments ?? true,
          cod_enabled: cod_enabled ?? true,
          new_orders_enabled: new_orders_enabled ?? true,
          whatsapp_number: whatsapp_number ?? '+919271218156',
          support_phone: support_phone ?? '+919271218156',
          support_email: support_email ?? 'sukoofficial.in@gmail.com',
          atelier_address: atelier_address ?? 'Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033',
          instagram_url: instagram_url ?? 'https://www.instagram.com/icwbysuko/',
          facebook_url: facebook_url ?? 'https://www.facebook.com/profile.php?id=61591287333326',
          google_review_url: google_review_url ?? 'https://g.page/r/icwbysuko',
          announcement_text: announcement_text ?? null,
          announcement_active: announcement_active ?? false,
        },
      });
    } else {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          ...(store_online !== undefined && { store_online }),
          ...(online_payments !== undefined && { online_payments }),
          ...(cod_enabled !== undefined && { cod_enabled }),
          ...(new_orders_enabled !== undefined && { new_orders_enabled }),
          ...(whatsapp_number !== undefined && { whatsapp_number }),
          ...(support_phone !== undefined && { support_phone }),
          ...(support_email !== undefined && { support_email }),
          ...(atelier_address !== undefined && { atelier_address }),
          ...(instagram_url !== undefined && { instagram_url }),
          ...(facebook_url !== undefined && { facebook_url }),
          ...(google_review_url !== undefined && { google_review_url }),
          ...(announcement_text !== undefined && { announcement_text }),
          ...(announcement_active !== undefined && { announcement_active }),
        },
      });
    }

    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: req.user?.id || null,
          actor_email: req.user?.email || 'admin',
          action: 'settings.updated',
          entity: 'StoreSettings',
          entity_id: String(settings.id),
          metadata: req.body,
        },
      });
    } catch (_) {}

    res.json({ success: true, settings });
  } catch (error) {
    console.error('[Settings] updateSettings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}
