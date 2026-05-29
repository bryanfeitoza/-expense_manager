const { SavingGoal } = require('../models');

exports.index = async (req, res, next) => {
  try {
    const goals = await SavingGoal.findAll({
      where: { userId: req.userId },
      order: [['deadline', 'ASC']],
    });

    const result = goals.map(g => {
      const target = parseFloat(g.targetAmount);
      const current = parseFloat(g.currentAmount);
      return {
        ...g.toJSON(),
        progress: target > 0 ? parseFloat(((current / target) * 100).toFixed(1)) : 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const goal = await SavingGoal.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!goal) {
      return res.status(404).json({ error: true, message: 'Saving goal not found' });
    }

    const target = parseFloat(goal.targetAmount);
    const current = parseFloat(goal.currentAmount);

    res.json({
      savingGoal: {
        ...goal.toJSON(),
        progress: target > 0 ? parseFloat(((current / target) * 100).toFixed(1)) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, color, icon } = req.body;

    const goal = await SavingGoal.create({
      userId: req.userId,
      name,
      targetAmount,
      deadline,
      color,
      icon,
    });

    res.status(201).json({ savingGoal: { ...goal.toJSON(), progress: 0 } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const goal = await SavingGoal.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!goal) {
      return res.status(404).json({ error: true, message: 'Saving goal not found' });
    }

    await goal.update(req.body);

    const updated = await SavingGoal.findByPk(goal.id);
    const target = parseFloat(updated.targetAmount);
    const current = parseFloat(updated.currentAmount);

    if (target > 0 && current >= target) {
      await updated.update({ completed: true });
    } else if (target > 0 && current < target) {
      await updated.update({ completed: false });
    }

    const final = await SavingGoal.findByPk(goal.id);

    res.json({
      savingGoal: {
        ...final.toJSON(),
        progress: target > 0 ? parseFloat(((parseFloat(final.currentAmount) / target) * 100).toFixed(1)) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const goal = await SavingGoal.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!goal) {
      return res.status(404).json({ error: true, message: 'Saving goal not found' });
    }

    await goal.destroy();
    res.json({ message: 'Saving goal deleted successfully' });
  } catch (err) {
    next(err);
  }
};
