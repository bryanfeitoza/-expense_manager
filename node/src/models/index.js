const { sequelize, Sequelize } = require('../config/database');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Category = require('./Category');
const Account = require('./Account');
const Transaction = require('./Transaction');
const SavingGoal = require('./SavingGoal');
const RecurringTransaction = require('./RecurringTransaction');
const Budget = require('./Budget');

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SavingGoal, { foreignKey: 'userId', as: 'savingGoals' });
SavingGoal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RecurringTransaction, { foreignKey: 'userId', as: 'recurringTransactions' });
RecurringTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets' });
Budget.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Account.hasMany(Transaction, { foreignKey: 'accountId', as: 'transactions' });
Transaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  RefreshToken,
  Category,
  Account,
  Transaction,
  SavingGoal,
  RecurringTransaction,
  Budget,
};
