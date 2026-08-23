const prisma = require('../prisma/client');

async function getAllCategories(req, res) {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function createCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const catId = parseInt(id);

    // Unlink any products assigned to this category
    await prisma.product.updateMany({
      where: { category_id: catId },
      data: { category_id: null }
    });

    await prisma.category.delete({ where: { id: catId } });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

module.exports = { getAllCategories, createCategory, deleteCategory };
