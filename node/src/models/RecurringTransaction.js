const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecurringTransaction = sequelize.define('RecurringTransaction', {
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
  accountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('receita', 'despesa'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'monthly',
  },
  nextDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'recurring_transactions',
  underscored: true,
});

module.exports = RecurringTransaction;
