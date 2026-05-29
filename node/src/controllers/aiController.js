const { Transaction, Category } = require('../models');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

exports.classify = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: true, message: 'Description is required' });
    }

    const categories = await Category.findAll({ where: { userId: req.userId } });
    const result = await aiService.classifyTransaction(description, categories);

    res.json({ suggestedCategory: result, description });
  } catch (err) {
    next(err);
  }
};

exports.analyzeSpending = async (req, res, next) => {
  try {
    const { query } = req.body;
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['transactionDate', 'DESC']],
      limit: 100,
    });

    const result = await aiService.analyzeSpending(transactions, query);
    res.json({ analysis: result, transactionsCount: transactions.length });
  } catch (err) {
    next(err);
  }
};

exports.detectAnomalies = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['transactionDate', 'DESC']],
      limit: 200,
    });

    const result = await aiService.detectAnomalies(transactions);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.predictBudget = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        transactionDate: {
          [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
      order: [['transactionDate', 'ASC']],
    });

    const result = await aiService.predictBudget(transactions);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.tips = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['transactionDate', 'DESC']],
      limit: 100,
    });

    const result = await aiService.getFinancialTips(transactions);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: true, message: 'Message is required' });
    }

    const result = await aiService.chat(message, context || []);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
