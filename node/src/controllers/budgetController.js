const { Budget, Category, Transaction, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.index = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.userId };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const budgets = await Budget.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const results = await Promise.all(budgets.map(async (budget) => {
      const budgetJson = budget.toJSON();
      const spentWhere = {
        userId: req.userId,
        type: 'despesa',
        [Op.and]: [
          sequelize.where(fn('EXTRACT', literal('MONTH FROM "transaction_date"')), currentMonth),
          sequelize.where(fn('EXTRACT', literal('YEAR FROM "transaction_date"')), currentYear),
        ],
      };
      if (budget.categoryId) {
        spentWhere.categoryId = budget.categoryId;
      }

      const spentResult = await Transaction.findAll({
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        where: spentWhere,
        raw: true,
      });

      const spent = parseFloat(spentResult[0]?.total || 0);
      const limit = parseFloat(budgetJson.limitAmount);
      budgetJson.spent = spent;
      budgetJson.remaining = Math.max(0, limit - spent);
      budgetJson.percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

      return budgetJson;
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
    });
    if (!budget) {
      return res.status(404).json({ error: true, message: 'Budget not found' });
    }
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const budget = await Budget.create(data);
    const created = await Budget.findByPk(budget.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!budget) {
      return res.status(404).json({ error: true, message: 'Budget not found' });
    }
    await budget.update(req.body);
    const updated = await Budget.findByPk(budget.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!budget) {
      return res.status(404).json({ error: true, message: 'Budget not found' });
    }
    await budget.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
