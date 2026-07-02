const mockFinancialData = {
  userName: 'Robert',
  balance: 2430,
  currency: 'EUR',
  monthlyIncome: 3200,
  paydayDate: '2026-07-15',
  safeToSpend: 320,
  upcomingBillsTotal: 737,

  upcomingBills: [
    { name: 'Rent', amount: 700, date: '2026-07-05' },
    { name: 'Phone bill', amount: 25, date: '2026-07-07' },
    { name: 'Netflix', amount: 12, date: '2026-07-09' },
  ],

  spendingByCategory: [
    { category: 'Food & groceries', amount: 420, change: '+18%' },
    { category: 'Shopping', amount: 310, change: '+22%' },
    { category: 'Transport', amount: 140, change: '-5%' },
    { category: 'Subscriptions', amount: 65, change: '0%' },
  ],

  recentTransactions: [
    { merchant: 'Carrefour', amount: 46.5, category: 'Groceries' },
    { merchant: 'Uber', amount: 14.2, category: 'Transport' },
    { merchant: 'CloudPro Annual', amount: 89.99, category: 'Subscriptions', unusual: true },
  ],

  savingsGoal: {
    name: 'Trip to Spain',
    target: 1000,
    saved: 350,
    monthlyContribution: 250,
  },

  insights: [
    { id: 'groceries', label: 'You spent 18% more on groceries', tone: 'warning' },
    { id: 'bills', label: 'Upcoming bills: €737', tone: 'neutral' },
    { id: 'safe', label: 'Safe-to-spend: €320', tone: 'positive' },
  ],
};
