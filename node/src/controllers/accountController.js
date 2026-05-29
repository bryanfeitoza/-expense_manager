const { Account } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.userId },
      order: [['name', 'ASC']],
    });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: true, message: 'Account not found' });
    }

    res.json({ account });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, balance, currency } = req.body;

    const account = await Account.create({
      userId: req.userId,
      name,
      type: type || 'checking',
      balance: balance || 0,
      currency: currency || 'BRL',
    });

    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: true, message: 'Account not found' });
    }

    await account.update(req.body);
    res.json({ account });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: true, message: 'Account not found' });
    }

    await account.destroy();
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};
