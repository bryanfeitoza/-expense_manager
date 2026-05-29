function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p, limit: l };
}

function buildPaginationMeta(count, page, limit) {
  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit) || 0,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value) || 0);
}

function parseDateRange(startDate, endDate) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  if (isNaN(start.getTime())) throw new Error('Invalid startDate');
  if (isNaN(end.getTime())) throw new Error('Invalid endDate');

  return { start, end };
}

module.exports = { paginate, buildPaginationMeta, formatCurrency, parseDateRange };
