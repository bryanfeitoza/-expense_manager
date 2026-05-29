const { Transaction, Category } = require('../models');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { classifyTransaction } = require('../services/aiService');
const { Op } = require('sequelize');

exports.index = async (req, res, next) => {
  try {
    const { offset, limit, page } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.userId };

    if (req.query.startDate || req.query.endDate) {
      where.transactionDate = {};
      if (req.query.startDate) where.transactionDate[Op.gte] = req.query.startDate;
      if (req.query.endDate) where.transactionDate[Op.lte] = req.query.endDate;
    }

    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.type) where.type = req.query.type;
    const searchTerm = req.query.search || req.query.description;
    if (searchTerm) {
      where.description = { [Op.iLike]: `%${searchTerm}%` };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      offset,
      limit,
    });

    res.json({
      transactions: rows,
      pagination: buildPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ error: true, message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.userId };

    if (data.description && !data.categoryId) {
      const categories = await Category.findAll({ where: { userId: req.userId } });
      const suggested = await classifyTransaction(data.description, categories);
      if (suggested) {
        data.categoryId = suggested.id;
      }
    }

    const transaction = await Transaction.create(data);

    const created = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
      ],
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: true, message: 'Transaction not found' });
    }

    await transaction.update(req.body);

    const updated = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
      ],
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: true, message: 'Transaction not found' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
};
