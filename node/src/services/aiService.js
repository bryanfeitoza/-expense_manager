const aiApiKey = process.env.AI_API_KEY;
const aiApiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1';
const aiModel = process.env.AI_MODEL || 'gpt-4';

function isConfigured() {
  return aiApiKey && aiApiKey !== 'sua-chave-aqui';
}

async function callAI(messages) {
  if (!isConfigured()) {
    return null;
  }

  const response = await fetch(`${aiApiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    console.error(`AI API error: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || null;
}

function simulateClassification(description, categories) {
  const desc = description.toLowerCase();
  const rules = {
    alimenta: ['Alimentação', 'restaurante', 'comida', 'supermercado', 'mercado', 'feira', 'lanche', 'pizza', 'ifood'],
    transporte: ['Transporte', 'uber', '99', 'taxi', 'gasolina', 'combustível', 'ônibus', 'metrô', 'pedágio', 'estacionamento'],
    moradia: ['Moradia', 'aluguel', 'condomínio', 'água', 'luz', 'energia', 'gás', 'iptu', 'manutenção'],
    saude: ['Saúde', 'médico', 'dentista', 'farmácia', 'remédio', 'plano de saúde', 'hospital', 'exame'],
    educacao: ['Educação', 'curso', 'faculdade', 'escola', 'mensalidade', 'livro', 'material'],
    lazer: ['Lazer', 'cinema', 'show', 'viagem', 'hotel', 'passagem', 'parque', 'jogo', 'streaming'],
    assinatura: ['Assinaturas', 'netflix', 'spotify', 'amazon', 'prime', 'apple'],
    salario: ['Salário', 'salário', 'pagamento', 'holerite', 'proventos'],
    investimento: ['Investimentos', 'renda fixa', 'ações', 'cdb', 'poupança', 'investimento'],
  };

  for (const [, [catName, ...keywords]] of Object.entries(rules)) {
    if (keywords.some(k => desc.includes(k))) {
      const found = categories.find(c => c.name === catName);
      if (found) return found;
    }
  }

  return null;
}

async function classifyTransaction(description, categories) {
  if (!isConfigured()) {
    return simulateClassification(description, categories);
  }

  const catList = categories.map(c => `${c.name} (${c.type})`).join(', ');

  const messages = [
    {
      role: 'system',
      content: `You are a transaction classifier. Given a description, choose the best category from this list: ${catList}. Respond only with the category name.`,
    },
    { role: 'user', content: `Classify this transaction: "${description}"` },
  ];

  const result = await callAI(messages);
  if (result) {
    const matched = categories.find(c => c.name.toLowerCase() === result.trim().toLowerCase());
    if (matched) return matched;
  }

  return simulateClassification(description, categories);
}

async function analyzeSpending(transactions, query) {
  if (!isConfigured()) {
    const total = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    const avg = transactions.length > 0 ? total / transactions.length : 0;
    return `Análise simulada: Foram analisadas ${transactions.length} transações. Total: R$ ${total.toFixed(2)}. Média: R$ ${avg.toFixed(2)}. ${query ? 'Pergunta: ' + query : ''}`;
  }

  const summary = transactions.slice(0, 50).map(t =>
    `- ${t.description}: R$ ${parseFloat(t.amount).toFixed(2)} (${t.type})`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'You are a financial analyst. Analyze the spending data and provide insights in Portuguese.',
    },
    {
      role: 'user',
      content: `Here are my transactions:\n${summary}\n\n${query ? `Question: ${query}` : 'Give me a spending analysis with insights and recommendations.'}`,
    },
  ];

  const result = await callAI(messages);
  return result || `Análise baseada em ${transactions.length} transações.`;
}

async function detectAnomalies(transactions) {
  if (transactions.length < 3) {
    return { anomalies: [], message: 'Not enough transactions to detect anomalies.' };
  }

  const amounts = transactions.map(t => parseFloat(t.amount));
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = transactions.filter(t => {
    const val = parseFloat(t.amount);
    return Math.abs(val - mean) > 2 * stdDev;
  });

  if (!isConfigured()) {
    return {
      anomalies: anomalies.map(a => ({
        id: a.id,
        description: a.description,
        amount: a.amount,
        transactionDate: a.transactionDate,
        reason: `Valor ${parseFloat(a.amount).toFixed(2)} está fora de 2 desvios padrão da média ${mean.toFixed(2)}`,
      })),
      stats: { mean: mean.toFixed(2), stdDev: stdDev.toFixed(2), total: transactions.length },
    };
  }

  const anomalyList = anomalies.map(a =>
    `- ${a.description}: R$ ${parseFloat(a.amount).toFixed(2)} em ${a.transactionDate}`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'You are a financial anomaly detector. Analyze the flagged transactions and explain in Portuguese why they might be anomalous.',
    },
    {
      role: 'user',
      content: `Flagged transactions:\n${anomalyList}\n\nMean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}. Explain these anomalies.`,
    },
  ];

  const analysis = await callAI(messages);

  return {
    anomalies: anomalies.map(a => ({
      id: a.id,
      description: a.description,
      amount: a.amount,
      transactionDate: a.transactionDate,
      reason: `Valor fora do padrão (média: ${mean.toFixed(2)})`,
    })),
    stats: { mean: mean.toFixed(2), stdDev: stdDev.toFixed(2), total: transactions.length },
    analysis,
  };
}

async function predictBudget(transactions) {
  if (transactions.length === 0) {
    return { message: 'No transactions to analyze for predictions.' };
  }

  const now = new Date();
  const currentMonth = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyTotals = {};
  for (const t of transactions) {
    const d = new Date(t.transactionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + parseFloat(t.amount);
  }

  const values = Object.values(monthlyTotals);
  const avgMonthly = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  if (!isConfigured()) {
    return {
      averageMonthly: avgMonthly.toFixed(2),
      currentMonthSpending: currentMonth.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
      prediction: `Previsão para o próximo mês: R$ ${avgMonthly.toFixed(2)}`,
      months: Object.entries(monthlyTotals).map(([k, v]) => ({ month: k, total: v.toFixed(2) })),
    };
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a budget predictor. Analyze spending patterns and provide a prediction in Portuguese.',
    },
    {
      role: 'user',
      content: `Monthly totals: ${JSON.stringify(monthlyTotals)}. Average monthly: ${avgMonthly.toFixed(2)}. Current month: ${currentMonth.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2)}. Predict next month.`,
    },
  ];

  const analysis = await callAI(messages);

  return {
    averageMonthly: avgMonthly.toFixed(2),
    currentMonthSpending: currentMonth.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
    prediction: analysis || `Previsão: R$ ${avgMonthly.toFixed(2)}`,
    months: Object.entries(monthlyTotals).map(([k, v]) => ({ month: k, total: v.toFixed(2) })),
  };
}

async function getFinancialTips(transactions) {
  if (!isConfigured()) {
    const totalExpenses = transactions
      .filter(t => t.type === 'despesa')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const tips = [];
    if (totalExpenses > 0) {
      tips.push('Considere criar um orçamento mensal para controlar seus gastos.');
      tips.push('Separe pelo menos 10% da sua renda para investimentos.');
      tips.push('Revise assinaturas e serviços que você não usa regularmente.');
    }
    tips.push('Mantenha uma reserva de emergência de 3 a 6 meses de despesas.');

    return { tips };
  }

  const expenses = transactions.filter(t => t.type === 'despesa').slice(0, 30);
  const expenseList = expenses.map(t =>
    `- ${t.description}: R$ ${parseFloat(t.amount).toFixed(2)} (${t.transactionDate})`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'You are a financial advisor. Give personalized financial tips in Portuguese based on spending data. Be practical and specific.',
    },
    {
      role: 'user',
      content: `Based on these expenses, give me 3-5 financial tips:\n${expenseList}`,
    },
  ];

  const result = await callAI(messages);
  const tips = result ? result.split('\n').filter(l => l.trim()) : ['Mantenha um controle regular dos seus gastos.', 'Defina metas financeiras mensais.'];

  return { tips };
}

async function chat(query, context) {
  if (!isConfigured()) {
    return {
      response: `Olá! Sou o assistente financeiro. Pergunte sobre gestão de gastos, orçamento, investimentos ou economia. ${query ? `Você perguntou: "${query}"` : 'Como posso ajudar?'}`,
    };
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful financial assistant in Portuguese. Help users with budgeting, saving, investing, and personal finance management. Be concise and practical.',
    },
    ...(Array.isArray(context) ? context : []),
    { role: 'user', content: query },
  ];

  const result = await callAI(messages);
  return { response: result || 'Não foi possível processar sua pergunta.' };
}

module.exports = {
  classifyTransaction,
  analyzeSpending,
  detectAnomalies,
  predictBudget,
  getFinancialTips,
  chat,
};
