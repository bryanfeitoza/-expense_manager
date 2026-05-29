const { Category } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.userId },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    res.json({ category });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, icon, color, type, monthlyLimit } = req.body;

    if (!type || !['receita', 'despesa'].includes(type)) {
      return res.status(400).json({ error: true, message: 'Type must be receita or despesa' });
    }

    const category = await Category.create({
      userId: req.userId,
      name,
      icon,
      color,
      type,
      monthlyLimit,
    });

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    if (req.body.type && !['receita', 'despesa'].includes(req.body.type)) {
      return res.status(400).json({ error: true, message: 'Type must be receita or despesa' });
    }

    await category.update(req.body);
    res.json({ category });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
