const { Transaction, Category } = require('../models');
const { Op, fn, col } = require('sequelize');
const { parseDateRange } = require('../utils/helpers');

exports.byCategory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    const spending = await Transaction.findAll({
      attributes: [
        [col('Transaction.category_id'), 'categoryId'],
        [fn('SUM', col('Transaction.amount')), 'total'],
        [fn('COUNT', col('Transaction.id')), 'count'],
      ],
      where: {
        userId,
        transactionDate: { [Op.between]: [start, end] },
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] },
      ],
      group: ['Transaction.category_id', 'category.id'],
      order: [[fn('SUM', col('Transaction.amount')), 'DESC']],
      raw: true,
    });

    const categories = spending.map(s => ({
      id: s['category.id'],
      name: s['category.name'],
      icon: s['category.icon'],
      color: s['category.color'],
      type: s['category.type'],
      total: parseFloat(s.total || 0),
      count: parseInt(s.count || 0),
    }));

    const total = categories.reduce((sum, c) => sum + c.total, 0);
    for (const c of categories) {
      c.percentage = total > 0 ? parseFloat(((c.total / total) * 100).toFixed(1)) : 0;
    }

    res.json({
      period: { start, end },
      total: parseFloat(total.toFixed(2)),
      categories,
    });
  } catch (err) {
    next(err);
  }
};

exports.monthly = async (req, res, next) => {
  try {
    const userId = req.userId;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const transactions = await Transaction.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('transaction_date')), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        userId,
        transactionDate: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`],
        },
      },
      group: [fn('DATE_TRUNC', 'month', col('transaction_date')), 'type'],
      order: [[fn('DATE_TRUNC', 'month', col('transaction_date')), 'ASC']],
      raw: true,
    });

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      monthlyData.push({
        month: i + 1,
        label: new Date(year, i).toLocaleString('pt-BR', { month: 'long' }),
        income: 0,
        expenses: 0,
        incomeCount: 0,
        expenseCount: 0,
      });
    }

    for (const t of transactions) {
      const monthIndex = new Date(t.month).getMonth();
      if (t.type === 'receita') {
        monthlyData[monthIndex].income = parseFloat(t.total || 0);
        monthlyData[monthIndex].incomeCount = parseInt(t.count || 0);
      } else {
        monthlyData[monthIndex].expenses = parseFloat(t.total || 0);
        monthlyData[monthIndex].expenseCount = parseInt(t.count || 0);
      }
    }

    res.json(monthlyData);
  } catch (err) {
    next(err);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    const where = { userId };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = startDate;
      if (endDate) where.transactionDate[Op.lte] = endDate;
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
      ],
      order: [['transactionDate', 'DESC']],
    });

    const headers = 'Data,Tipo,Descrição,Categoria,Valor';
    const rows = transactions.map(t =>
      `${t.transactionDate},${t.type},"${t.description}",${t.category ? t.category.name : ''},${parseFloat(t.amount).toFixed(2)}`
    );

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    next(err);
  }
};

exports.exportPDF = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    const transactions = await Transaction.findAll({
      where: {
        userId,
        transactionDate: { [Op.between]: [start, end] },
      },
      include: [
        { model: Category, as: 'category', attributes: ['name', 'icon'] },
      ],
      order: [['transactionDate', 'DESC']],
    });

    const totalIncome = transactions
      .filter(t => t.type === 'receita')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'despesa')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const rows = transactions.map(t => `
      <tr>
        <td>${t.transactionDate}</td>
        <td>${t.type === 'receita' ? 'Receita' : 'Despesa'}</td>
        <td>${t.description}</td>
        <td>${t.category ? t.category.icon + ' ' + t.category.name : '-'}</td>
        <td style="text-align:right;color:${t.type === 'receita' ? '#10B981' : '#EF4444'}">R$ ${parseFloat(t.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Transações</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1F2937; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .card { padding: 15px; border-radius: 8px; flex: 1; }
    .card-income { background: #D1FAE5; }
    .card-expense { background: #FEE2E2; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F9FAFB; font-weight: bold; }
    .total { font-weight: bold; font-size: 1.1em; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Relatório de Transações</h1>
  <p>Período: ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}</p>
  <div class="summary">
    <div class="card card-income">
      <strong>Receitas:</strong> R$ ${totalIncome.toFixed(2)}
    </div>
    <div class="card card-expense">
      <strong>Despesas:</strong> R$ ${totalExpenses.toFixed(2)}
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">
    Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename=report-${new Date().toISOString().split('T')[0]}.html`);
    res.send(html);
  } catch (err) {
    next(err);
  }
};
