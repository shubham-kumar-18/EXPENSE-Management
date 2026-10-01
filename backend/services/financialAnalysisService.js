const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const total = (expenses) =>
  round(expenses.reduce((sum, expense) => sum + expense.amount, 0));

const categoryTotals = (expenses) =>
  expenses.reduce((totals, expense) => {
    totals[expense.category] = round((totals[expense.category] || 0) + expense.amount);
    return totals;
  }, {});

const percentageChange = (current, previous) =>
  !previous ? (current ? null : 0) : round(((current - previous) / previous) * 100);

const monthRange = (offset = 0) => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    end: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  };
};

export const buildInsightsData = (expenses) => {
  const currentRange = monthRange();
  const previousRange = monthRange(-1);
  const current = expenses.filter(
    ({ date }) => date >= currentRange.start && date < currentRange.end
  );
  const previous = expenses.filter(
    ({ date }) => date >= previousRange.start && date < previousRange.end
  );
  const currentCategories = categoryTotals(current);
  const previousCategories = categoryTotals(previous);
  const categories = Object.fromEntries(
    [...new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)])].map(
      (category) => {
        const currentAmount = currentCategories[category] || 0;
        const previousAmount = previousCategories[category] || 0;
        return [
          category,
          {
            current: currentAmount,
            previous: previousAmount,
            changePercentage: percentageChange(currentAmount, previousAmount)
          }
        ];
      }
    )
  );
  const dayTotals = current.reduce((days, expense) => {
    const day = expense.date.toLocaleDateString("en-US", { weekday: "long" });
    days[day] = (days[day] || 0) + expense.amount;
    return days;
  }, {});
  const currentTotal = total(current);
  const previousTotal = total(previous);

  return {
    currentMonthExpense: currentTotal,
    previousMonthExpense: previousTotal,
    expenseChangePercentage: percentageChange(currentTotal, previousTotal),
    categories,
    highestSpendingCategory:
      Object.entries(currentCategories).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    highestSpendingDay:
      Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    monthlyTransactionCount: current.length,
    averageDailySpending: round(currentTotal / Math.max(1, new Date().getDate()))
  };
};

export const buildBudgetData = (expenses, monthlyIncome) => {
  const buckets = new Map();

  expenses.forEach((expense) => {
    const key = `${expense.date.getFullYear()}-${expense.date.getMonth()}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(expense);
  });

  const recentMonths = [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
    .map(([, values]) => values);
  const denominator = Math.max(recentMonths.length, 1);
  const allCategories = categoryTotals(expenses);
  const categoryMonthlyAverages = Object.fromEntries(
    Object.keys(allCategories).map((category) => [
      category,
      round(
        recentMonths.reduce(
          (sum, month) => sum + (categoryTotals(month)[category] || 0),
          0
        ) / denominator
      )
    ])
  );
  const now = new Date();
  const currentMonth = expenses.filter(
    ({ date }) =>
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
  const currentMonthExpense = total(currentMonth);

  return {
    monthlyIncome,
    historicalMonthsAvailable: recentMonths.length,
    currentMonthExpense,
    averageMonthlyExpense: round(
      recentMonths.reduce((sum, month) => sum + total(month), 0) / denominator
    ),
    categoryMonthlyAverages,
    currentMonthCategories: categoryTotals(currentMonth),
    remainingIncomeThisMonth: round(monthlyIncome - currentMonthExpense)
  };
};
