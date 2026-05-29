const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 12 },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  limitAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Limit must be greater than zero' },
    },
  },
  alertThreshold: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 80,
    validate: { min: 1, max: 100 },
  },
}, {
  tableName: 'budgets',
  underscored: true,
});

module.exports = Budget;
