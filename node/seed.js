require('dotenv').config();
const { sequelize, User, Category } = require('./src/models');

const defaultCategories = [
  { name: 'Alimentação', icon: '🍽️', color: '#F59E0B', type: 'despesa' },
  { name: 'Transporte', icon: '🚗', color: '#3B82F6', type: 'despesa' },
  { name: 'Moradia', icon: '🏠', color: '#8B5CF6', type: 'despesa' },
  { name: 'Saúde', icon: '🏥', color: '#EF4444', type: 'despesa' },
  { name: 'Educação', icon: '📚', color: '#06B6D4', type: 'despesa' },
  { name: 'Lazer', icon: '🎮', color: '#10B981', type: 'despesa' },
  { name: 'Assinaturas', icon: '📺', color: '#F97316', type: 'despesa' },
  { name: 'Compras', icon: '🛍️', color: '#EC4899', type: 'despesa' },
  { name: 'Salário', icon: '💰', color: '#10B981', type: 'receita' },
  { name: 'Freelance', icon: '💼', color: '#3B82F6', type: 'receita' },
  { name: 'Investimentos', icon: '📈', color: '#8B5CF6', type: 'receita' },
  { name: 'Outros', icon: '📌', color: '#6B7280', type: 'despesa' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    await sequelize.sync({ alter: false });
    console.log('Models synchronized.');

    let [admin, created] = await User.findOrCreate({
      where: { email: 'admin@email.com' },
      defaults: {
        name: 'Admin',
        email: 'admin@email.com',
        password: 'admin123',
      },
    });

    if (created) {
      console.log('Admin user created: admin@email.com / admin123');
    } else {
      const valid = await admin.validatePassword('admin123');
      if (!valid) {
        admin.password = 'admin123';
        await admin.save();
        console.log('Admin password reset: admin@email.com / admin123');
      } else {
        console.log('Admin user already exists.');
      }
    }

    for (const cat of defaultCategories) {
      await Category.findOrCreate({
        where: { name: cat.name, userId: admin.id },
        defaults: { ...cat, userId: admin.id },
      });
    }

    console.log('Default categories seeded.');

    await sequelize.close();
    console.log('Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
