const assistantScenarios = [
  {
    id: 'safe-to-spend',
    prompt: 'Can I afford spending €500 this weekend?',
    keywords: ['afford', 'spend', 'weekend', '500'],
    response: {
      title: 'You can spend around €320 safely',
      message:
        'Based on your current balance, upcoming bills, and average weekly spending, spending €500 may put you below your comfort balance before payday.',
      highlights: [
        { label: 'Current balance', value: '€2,430' },
        { label: 'Upcoming bills', value: '€737' },
        { label: 'Safe-to-spend amount', value: '€320' },
        { label: 'Risk level', value: 'Medium' },
      ],
      recommendation:
        'Try to keep weekend spending under €320 or reduce shopping expenses this week.',
    },
  },
  {
    id: 'spending-breakdown',
    prompt: 'Where did my money go this month?',
    keywords: ['money', 'spent', 'spending', 'month', 'where'],
    response: {
      title: 'Your biggest spending category is Food & Groceries',
      message:
        'You spent €420 on food and groceries this month, which is 18% higher than usual. Shopping also increased by 22%.',
      highlights: [
        { label: 'Food & groceries', value: '€420' },
        { label: 'Shopping', value: '€310' },
        { label: 'Transport', value: '€140' },
        { label: 'Subscriptions', value: '€65' },
      ],
      recommendation:
        'The easiest way to reduce spending is to limit restaurant and shopping expenses for the next 2 weeks.',
    },
  },
  {
    id: 'saving-plan',
    prompt: 'How can I save €300 this month?',
    keywords: ['save', 'saving', '300'],
    response: {
      title: 'You can save around €280–€320 this month',
      message:
        'Based on your spending pattern, the most realistic saving opportunities are food delivery, shopping, and unused subscriptions.',
      highlights: [
        { label: 'Reduce shopping', value: '€120' },
        { label: 'Limit restaurants', value: '€130' },
        { label: 'Cancel unused subscriptions', value: '€50' },
      ],
      recommendation:
        'Set a weekly spending limit and move €300 to savings right after payday.',
    },
  },
  {
    id: 'upcoming-bills',
    prompt: 'Do I have upcoming bills?',
    keywords: ['bills', 'payments', 'upcoming', 'bill'],
    response: {
      title: 'You have 3 upcoming payments',
      message: 'Your upcoming payments in the next 7 days total €737.',
      highlights: [
        { label: 'Rent', value: '€700 on Jul 5' },
        { label: 'Phone bill', value: '€25 on Jul 7' },
        { label: 'Netflix', value: '€12 on Jul 9' },
      ],
      recommendation: 'Keep at least €737 available to avoid payment issues.',
    },
  },
  {
    id: 'unusual-transaction',
    prompt: 'Is there anything unusual in my transactions?',
    keywords: ['unusual', 'suspicious', 'transaction', 'transactions'],
    response: {
      title: 'I found one unusual transaction',
      message:
        'CloudPro Annual charged €89.99. This is higher than your usual subscription payments.',
      highlights: [
        { label: 'Merchant', value: 'CloudPro Annual' },
        { label: 'Amount', value: '€89.99' },
        { label: 'Category', value: 'Subscriptions' },
        { label: 'Status', value: 'Unusual' },
      ],
      recommendation:
        'Review this payment and cancel the subscription if you do not recognize it.',
    },
  },
  {
    id: 'vacation-saving',
    prompt: 'Can I save for a vacation?',
    keywords: ['vacation', 'trip', 'spain', 'holiday', 'travel'],
    response: {
      title: "You're on track for your Trip to Spain",
      message:
        "You've saved €350 of your €1,000 goal. At your current pace, you'll reach the target in about 3 months.",
      highlights: [
        { label: 'Goal', value: 'Trip to Spain' },
        { label: 'Saved', value: '€350 / €1,000' },
        { label: 'Monthly contribution', value: '€250' },
        { label: 'Estimated completion', value: 'Oct 2026' },
      ],
      recommendation: 'Keep your €250 monthly transfer to savings right after payday.',
    },
  },
];
