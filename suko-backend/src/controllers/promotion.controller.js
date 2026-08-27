import prisma from '../prisma/client.js';

// GET all promotion campaigns and sale stats
export async function getPromotions(req, res) {
  try {
    const campaigns = await prisma.promotionCampaign.findMany({
      orderBy: { created_at: 'desc' },
    });

    const onSaleCount = await prisma.product.count({
      where: { is_on_sale: true },
    });

    res.json({
      success: true,
      campaigns,
      onSaleCount,
    });
  } catch (error) {
    console.error('[Promotions] getPromotions error:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
}

// APPLY a promotion campaign (single product, bulk, category, or store-wide)
export async function applyPromotion(req, res) {
  try {
    const {
      title,
      discount_type, // 'percentage' | 'markup_strikethrough' | 'flat'
      discount_value = 0,
      markup_value = 0,
      target_type, // 'all' | 'category' | 'products'
      target_ids = [],
      promo_label,
    } = req.body;

    if (!title || !discount_type || !target_type) {
      return res.status(400).json({ error: 'Missing required promotion fields' });
    }

    // Build product filter
    let whereClause = {};
    if (target_type === 'category' && Array.isArray(target_ids) && target_ids.length > 0) {
      whereClause = { category_id: { in: target_ids.map(Number) } };
    } else if (target_type === 'products' && Array.isArray(target_ids) && target_ids.length > 0) {
      whereClause = { id: { in: target_ids.map(Number) } };
    }

    const targetedProducts = await prisma.product.findMany({
      where: whereClause,
      include: { variants: true },
    });

    if (targetedProducts.length === 0) {
      return res.status(400).json({ error: 'No matching products found for this target criteria' });
    }

    const backupPrices = {};
    const discNum = Number(discount_value) || 0;
    const markupNum = Number(markup_value) || 0;

    for (const prod of targetedProducts) {
      const basePrice = Number(prod.price) || 0;
      backupPrices[prod.id] = {
        price: basePrice,
        mrp_price: prod.mrp_price ? Number(prod.mrp_price) : null,
        discount_percent: prod.discount_percent,
        is_on_sale: prod.is_on_sale,
        promo_label: prod.promo_label,
        variants: prod.variants.map(v => ({ id: v.id, price: Number(v.price), mrp_price: v.mrp_price ? Number(v.mrp_price) : null })),
      };

      let newSellingPrice = basePrice;
      let newMrpPrice = basePrice;
      let calcPercent = 0;

      if (discount_type === 'markup_strikethrough') {
        // Psychological Strikethrough Pricing: Selling price stays same, MRP is marked up
        newSellingPrice = basePrice;
        const rawMrp = markupNum > 0 ? basePrice * (1 + markupNum / 100) : (discNum > 0 ? basePrice / (1 - discNum / 100) : basePrice * 1.15);
        newMrpPrice = Math.round(rawMrp / 10) * 10; // Clean rounded MRP
        calcPercent = Math.round(((newMrpPrice - newSellingPrice) / newMrpPrice) * 100);
      } else if (discount_type === 'percentage') {
        // Direct Percentage Discount
        newMrpPrice = basePrice;
        newSellingPrice = Math.round((basePrice * (1 - discNum / 100)) / 10) * 10;
        calcPercent = discNum;
      } else if (discount_type === 'flat') {
        // Flat ₹ Discount
        newMrpPrice = basePrice;
        newSellingPrice = Math.max(1, Math.round(basePrice - discNum));
        calcPercent = Math.round(((newMrpPrice - newSellingPrice) / newMrpPrice) * 100);
      }

      const effectiveLabel = promo_label || (calcPercent > 0 ? `${calcPercent}% OFF` : 'SPECIAL SALE');

      // Update Product
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          price: newSellingPrice,
          mrp_price: newMrpPrice,
          discount_percent: calcPercent,
          is_on_sale: true,
          promo_label: effectiveLabel,
        },
      });

      // Update Variants
      for (const v of prod.variants) {
        const vBase = Number(v.price) || basePrice;
        let vSelling = vBase;
        let vMrp = vBase;

        if (discount_type === 'markup_strikethrough') {
          vSelling = vBase;
          const rawVMrp = markupNum > 0 ? vBase * (1 + markupNum / 100) : (discNum > 0 ? vBase / (1 - discNum / 100) : vBase * 1.15);
          vMrp = Math.round(rawVMrp / 10) * 10;
        } else if (discount_type === 'percentage') {
          vMrp = vBase;
          vSelling = Math.round((vBase * (1 - discNum / 100)) / 10) * 10;
        } else if (discount_type === 'flat') {
          vMrp = vBase;
          vSelling = Math.max(1, Math.round(vBase - discNum));
        }

        await prisma.productVariant.update({
          where: { id: v.id },
          data: {
            price: vSelling,
            mrp_price: vMrp,
          },
        });
      }
    }

    // Create PromotionCampaign Record
    const campaign = await prisma.promotionCampaign.create({
      data: {
        title,
        discount_type,
        discount_value: discNum,
        markup_value: markupNum,
        target_type,
        target_ids: target_ids.map(Number),
        is_active: true,
        backup_prices: backupPrices,
      },
    });

    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: req.user?.id || null,
          actor_email: req.user?.email || 'admin',
          action: 'promotion.applied',
          entity: 'PromotionCampaign',
          entity_id: String(campaign.id),
          metadata: { title, discount_type, affectedCount: targetedProducts.length },
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Promotion "${title}" applied successfully across ${targetedProducts.length} product(s).`,
      campaign,
      affectedCount: targetedProducts.length,
    });
  } catch (error) {
    console.error('[Promotions] applyPromotion error:', error);
    res.status(500).json({ error: 'Failed to apply promotion' });
  }
}

// REVERT and RESTORE original product prices
export async function revertPromotion(req, res) {
  try {
    const { id } = req.params;
    const campaign = await prisma.promotionCampaign.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Promotion campaign not found' });
    }

    const backups = campaign.backup_prices;
    if (backups && typeof backups === 'object') {
      for (const [prodIdStr, data] of Object.entries(backups)) {
        const prodId = parseInt(prodIdStr, 10);
        try {
          await prisma.product.update({
            where: { id: prodId },
            data: {
              price: data.price,
              mrp_price: data.mrp_price || null,
              discount_percent: data.discount_percent || null,
              is_on_sale: data.is_on_sale || false,
              promo_label: data.promo_label || null,
            },
          });

          if (Array.isArray(data.variants)) {
            for (const v of data.variants) {
              await prisma.productVariant.update({
                where: { id: v.id },
                data: {
                  price: v.price,
                  mrp_price: v.mrp_price || null,
                },
              });
            }
          }
        } catch (_) {}
      }
    }

    await prisma.promotionCampaign.update({
      where: { id: campaign.id },
      data: { is_active: false },
    });

    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: req.user?.id || null,
          actor_email: req.user?.email || 'admin',
          action: 'promotion.reverted',
          entity: 'PromotionCampaign',
          entity_id: String(campaign.id),
          metadata: { title: campaign.title },
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Promotion "${campaign.title}" reverted and catalog prices restored.`,
    });
  } catch (error) {
    console.error('[Promotions] revertPromotion error:', error);
    res.status(500).json({ error: 'Failed to revert promotion' });
  }
}

// QUICK UPDATE price & MRP for a single product directly
export async function quickUpdateProductPrice(req, res) {
  try {
    const { id } = req.params;
    const { price, mrp_price, is_on_sale, promo_label } = req.body;

    const prodId = parseInt(id, 10);
    const numPrice = Number(price);
    const numMrp = mrp_price ? Number(mrp_price) : null;
    let discPercent = null;

    if (numMrp && numMrp > numPrice) {
      discPercent = Math.round(((numMrp - numPrice) / numMrp) * 100);
    }

    const updated = await prisma.product.update({
      where: { id: prodId },
      data: {
        price: numPrice,
        mrp_price: numMrp,
        discount_percent: discPercent,
        is_on_sale: is_on_sale ?? (discPercent > 0),
        promo_label: promo_label || (discPercent > 0 ? `${discPercent}% OFF` : null),
      },
      include: { variants: true },
    });

    // Also update variants if variant prices match product price
    for (const v of updated.variants) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: {
          price: numPrice,
          mrp_price: numMrp,
        },
      });
    }

    res.json({ success: true, product: updated });
  } catch (error) {
    console.error('[Promotions] quickUpdateProductPrice error:', error);
    res.status(500).json({ error: 'Failed to update product pricing' });
  }
}

// DELETE a single promotion campaign from history
export async function deletePromotion(req, res) {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id, 10);

    const campaign = await prisma.promotionCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Promotion campaign not found' });
    }

    // If campaign is still active, restore prices before deleting
    if (campaign.is_active && campaign.backup_prices) {
      const backups = campaign.backup_prices;
      if (typeof backups === 'object') {
        for (const [prodIdStr, data] of Object.entries(backups)) {
          const prodId = parseInt(prodIdStr, 10);
          try {
            await prisma.product.update({
              where: { id: prodId },
              data: {
                price: data.price,
                mrp_price: data.mrp_price || null,
                discount_percent: data.discount_percent || null,
                is_on_sale: data.is_on_sale || false,
                promo_label: data.promo_label || null,
              },
            });

            if (Array.isArray(data.variants)) {
              for (const v of data.variants) {
                await prisma.productVariant.update({
                  where: { id: v.id },
                  data: {
                    price: v.price,
                    mrp_price: v.mrp_price || null,
                  },
                });
              }
            }
          } catch (_) {}
        }
      }
    }

    await prisma.promotionCampaign.delete({
      where: { id: campaignId },
    });

    res.json({ success: true, message: `Campaign "${campaign.title}" deleted successfully.` });
  } catch (error) {
    console.error('[Promotions] deletePromotion error:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
}

// CLEAR ALL reverted/inactive campaigns in 1 click
export async function clearRevertedHistory(req, res) {
  try {
    const result = await prisma.promotionCampaign.deleteMany({
      where: { is_active: false },
    });

    res.json({
      success: true,
      message: `Cleared ${result.count} reverted campaign(s) from history.`,
      count: result.count,
    });
  } catch (error) {
    console.error('[Promotions] clearRevertedHistory error:', error);
    res.status(500).json({ error: 'Failed to clear promotion history' });
  }
}

// UPDATE campaign title
export async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const updated = await prisma.promotionCampaign.update({
      where: { id: parseInt(id, 10) },
      data: { ...(title && { title }) },
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('[Promotions] updateCampaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
}
