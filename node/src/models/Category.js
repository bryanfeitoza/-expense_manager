const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
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
      notEmpty: { msg: 'Category name is required' },
    },
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '📁',
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#6B7280',
  },
  type: {
    type: DataTypes.ENUM('receita', 'despesa'),
    allowNull: false,
    defaultValue: 'despesa',
  },
  monthlyLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
}, {
  tableName: 'categories',
  underscored: true,
});

module.exports = Category;
