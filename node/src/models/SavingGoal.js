const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavingGoal = sequelize.define('SavingGoal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Goal name is required' },
    },
  },
  targetAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Target amount must be greater than zero' },
    },
  },
  currentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#10B981',
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '🎯',
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'saving_goals',
  underscored: true,
});

module.exports = SavingGoal;
