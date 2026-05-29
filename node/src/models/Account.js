const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Account = sequelize.define('Account', {
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
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Account name is required' },
    },
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'checking',
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'BRL',
  },
}, {
  tableName: 'accounts',
  underscored: true,
});

module.exports = Account;
