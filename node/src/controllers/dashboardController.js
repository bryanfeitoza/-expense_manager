const { Transaction, Category, Account } = require('../models');
const { Op, fn, col, literal, Sequelize } = require('sequelize');

exports.summary = async (req, res, next) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const accounts = await Account.findAll({ where: { userId } });
    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);

    const monthIncome = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'receita',
        transactionDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    const monthExpenses = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'despesa',
        transactionDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    const netBalance = (monthIncome || 0) - (monthExpenses || 0);

    res.json({
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      monthlyIncome: parseFloat((monthIncome || 0).toFixed(2)),
      monthlyExpenses: parseFloat((monthExpenses || 0).toFixed(2)),
      netBalance: parseFloat(netBalance.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
};

exports.monthlyEvolution = async (req, res, next) => {
  try {
    const userId = req.userId;
    const year = req.query.year || new Date().getFullYear();

    const transactions = await Transaction.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('transaction_date')), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      where: {
        userId,
        transaction_date: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`],
        },
      },
      group: [fn('DATE_TRUNC', 'month', col('transaction_date')), 'type'],
      order: [[fn('DATE_TRUNC', 'month', col('transaction_date')), 'ASC']],
      raw: true,
    });

    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push({
        month: i + 1,
        income: 0,
        expenses: 0,
      });
    }

    for (const t of transactions) {
      const monthIndex = new Date(t.month).getMonth();
      if (t.type === 'receita') {
        months[monthIndex].income = parseFloat(t.total || 0);
      } else {
        months[monthIndex].expenses = parseFloat(t.total || 0);
      }
    }

    res.json(months);
  } catch (err) {
    next(err);
  }
};

exports.calendar = async (req, res, next) => {
  try {
    const userId = req.userId;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : null;

    const where = {
      userId,
      type: 'despesa',
      transaction_date: month
        ? { [Op.between]: [`${year}-${String(month).padStart(2, '0')}-01`, `${year}-${String(month).padStart(2, '0')}-31`] }
        : { [Op.between]: [`${year}-01-01`, `${year}-12-31`] },
    };

    const days = await Transaction.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'day', col('transaction_date')), 'date'],
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where,
      group: [fn('DATE_TRUNC', 'day', col('transaction_date'))],
      order: [[fn('DATE_TRUNC', 'day', col('transaction_date')), 'ASC']],
      raw: true,
    });

    const result = days.map(d => ({
      date: new Date(d.date).toISOString().split('T')[0],
      total: parseFloat(d.total || 0),
      count: parseInt(d.count || 0),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.categoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const spending = await Transaction.findAll({
      attributes: [
        [col('Transaction.category_id'), 'categoryId'],
        [fn('SUM', col('Transaction.amount')), 'total'],
        [fn('COUNT', col('Transaction.id')), 'count'],
      ],
      where: {
        userId,
        type: 'despesa',
        transactionDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
      group: ['Transaction.category_id', 'category.id'],
      raw: true,
    });

    const categories = spending.map(s => ({
      id: s['category.id'],
      name: s['category.name'],
      icon: s['category.icon'],
      color: s['category.color'],
      type: 'despesa',
      total: parseFloat(s.total || 0),
      count: parseInt(s.count || 0),
    }));

    const totalSpent = categories.reduce((sum, c) => sum + c.total, 0);
    for (const c of categories) {
      c.percentage = totalSpent > 0 ? parseFloat(((c.total / totalSpent) * 100).toFixed(1)) : 0;
    }

    res.json({ categories, totalSpent: parseFloat(totalSpent.toFixed(2)) });
  } catch (err) {
    next(err);
  }
};
