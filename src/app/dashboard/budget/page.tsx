'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = [
  { id: 'fuel', name: 'Fuel & Transport', icon: '⛽', color: '#f59e0b', budget: 2500 },
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#22c55e', budget: 2000 },
  { id: 'lodging', name: 'Hotels & Lodging', icon: '🏨', color: '#22d3ee', budget: 3000 },
  { id: 'perdiem', name: 'Per Diems', icon: '💵', color: '#a78bfa', budget: 1500 },
  { id: 'production', name: 'Production & Gear', icon: '🎛️', color: '#d90429', budget: 500 },
  { id: 'misc', name: 'Miscellaneous', icon: '📦', color: '#8888a0', budget: 500 },
];

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface BudgetConfig {
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

interface TourDates {
  startDate: string;
  endDate: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getDaysBetween(start: string, end: string): { elapsed: number; remaining: number; total: number } {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const totalMs = endDate.getTime() - startDate.getTime();
  const total = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));

  const elapsedMs = today.getTime() - startDate.getTime();
  const elapsed = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));

  const remaining = Math.max(0, total - elapsed);

  return { elapsed, remaining, total };
}

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({ totalBudget: 10000, categoryBudgets: {} });
  const [tourDates, setTourDates] = useState<TourDates | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedExpenses = localStorage.getItem('tourhq_expenses');
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

    const storedBudget = localStorage.getItem('tourhq_budget');
    if (storedBudget) setBudgetConfig(JSON.parse(storedBudget));

    const storedTour = localStorage.getItem('tourhq_current_tour');
    if (storedTour) setTourDates(JSON.parse(storedTour));
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgetConfig.totalBudget;
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const status = percentUsed > 100 ? 'over' : percentUsed >= 80 ? 'under' : 'ontrack';
  const statusColor = status === 'over' ? '#d90429' : status === 'under' ? '#22c55e' : '#22d3ee';

  const daysInfo = tourDates ? getDaysBetween(tourDates.startDate, tourDates.endDate) : { elapsed: 0, remaining: 30, total: 30 };
  const dailyAvg = daysInfo.elapsed > 0 ? totalSpent / daysInfo.elapsed : 0;
  const projected = dailyAvg * daysInfo.total;

  const handleTotalBudgetChange = useCallback((value: string) => {
    const num = parseFloat(value) || 0;
    const updated = { ...budgetConfig, totalBudget: num };
    setBudgetConfig(updated);
    localStorage.setItem('tourhq_budget', JSON.stringify(updated));
  }, [budgetConfig]);

  const handleCategoryBudgetChange = useCallback((catId: string, value: string) => {
    const num = parseFloat(value) || 0;
    const updated = {
      ...budgetConfig,
      categoryBudgets: { ...budgetConfig.categoryBudgets, [catId]: num },
    };
    setBudgetConfig(updated);
    localStorage.setItem('tourhq_budget', JSON.stringify(updated));
  }, [budgetConfig]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const forecastIconBg = expenses.length === 0
    ? '#181822'
    : projected <= totalBudget
    ? 'rgba(34,197,94,0.12)'
    : 'rgba(217,4,41,0.12)';

  const forecastIcon = expenses.length === 0 ? '📊' : projected <= totalBudget ? '📈' : '📉';

  let forecastTitle = '';
  let forecastDetail = '';
  if (expenses.length === 0) {
    forecastTitle = 'Add expenses to see forecast';
    forecastDetail = 'Log expenses in the Expense Tracker';
  } else if (projected <= totalBudget) {
    const under = totalBudget - projected;
    forecastTitle = `On track — $${formatCurrency(under)} under budget`;
    forecastDetail = `Projected total: $${formatCurrency(projected)} at $${formatCurrency(Math.round(dailyAvg))}/day`;
  } else {
    const over = projected - totalBudget;
    forecastTitle = `Over budget by $${formatCurrency(over)}`;
    forecastDetail = `Projected total: $${formatCurrency(projected)} at $${formatCurrency(Math.round(dailyAvg))}/day — slow down!`;
  }

  const getCategorySpent = (catId: string) =>
    expenses.filter(e => e.category === catId).reduce((sum, e) => sum + e.amount, 0);

  const getCategoryBudget = (cat: typeof CATEGORIES[0]) =>
    budgetConfig.categoryBudgets[cat.id] ?? cat.budget;

  return (
    <div style={{
      background: '#07070c',
      minHeight: '100vh',
      color: '#f0f0f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <a href="/dashboard/more" style={{ color: '#8888a0', fontSize: '0.85rem', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
          ← Back to More
        </a>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>💰 Tour Budget</h1>
        <p style={{ color: '#8888a0', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Track spending against your tour budget</p>
      </div>

      {/* Budget Overview Card */}
      <div style={{ margin: '1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: '16px' }}>
        {/* Remaining Budget Header */}
        <div style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', marginBottom: '0.5rem' }}>
            Remaining Budget
          </div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: statusColor }}>
            ${formatCurrency(Math.max(0, remaining))}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: '0.25rem' }}>
            of ${formatCurrency(totalBudget)} total ({percentUsed.toFixed(0)}% used)
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ background: '#181822', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, percentUsed)}%`,
              height: '100%',
              borderRadius: '6px',
              background: status === 'over'
                ? 'linear-gradient(90deg, #d90429, #ff4d6a)'
                : status === 'under'
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #22d3ee, #67e8f9)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            fontFamily: 'ui-monospace, monospace',
            color: '#555570',
            marginTop: '0.35rem',
          }}>
            <span>$0</span>
            <span>${formatCurrency(totalBudget / 2)}</span>
            <span>${formatCurrency(totalBudget)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '1px solid #1f1f2e',
        }}>
          <div style={{ padding: '0.875rem', textAlign: 'center', borderRight: '1px solid #1f1f2e' }}>
            <div style={{ fontSize: '0.65rem', color: '#8888a0', marginBottom: '0.25rem' }}>SPENT</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#d90429' }}>
              ${formatCurrency(totalSpent)}
            </div>
          </div>
          <div style={{ padding: '0.875rem', textAlign: 'center', borderRight: '1px solid #1f1f2e' }}>
            <div style={{ fontSize: '0.65rem', color: '#8888a0', marginBottom: '0.25rem' }}>DAILY AVG</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#22d3ee' }}>
              ${formatCurrency(Math.round(dailyAvg))}/d
            </div>
          </div>
          <div style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#8888a0', marginBottom: '0.25rem' }}>DAYS LEFT</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#8888a0' }}>
              {daysInfo.remaining}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Card */}
      <div style={{ margin: '0.75rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: '12px', padding: '1rem', display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: forecastIconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
        }}>
          {forecastIcon}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{forecastTitle}</div>
          <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: '0.125rem' }}>{forecastDetail}</div>
        </div>
      </div>

      {/* Expense Tracker Link Card */}
      <a href="/dashboard/expenses" style={{
        margin: '0.75rem 1rem',
        background: '#101018',
        border: '1px solid #1f1f2e',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(217,4,41,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
        }}>
          🧾
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Expense Tracker</div>
          <div style={{ fontSize: '0.75rem', color: '#8888a0' }}>Log daily expenses to update budget</div>
        </div>
        <div style={{ fontSize: '1.2rem', color: '#555570' }}>›</div>
      </a>

      {/* Set Budget Input Bar */}
      <div style={{ margin: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.75rem', color: '#8888a0', whiteSpace: 'nowrap' }}>Total Budget: $</label>
        <input
          type="number"
          defaultValue={totalBudget}
          onChange={e => handleTotalBudgetChange(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem',
            background: '#181822',
            border: '1px solid #1f1f2e',
            borderRadius: '8px',
            color: '#f0f0f5',
            fontFamily: 'ui-monospace, monospace',
            textAlign: 'right',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Categories Section */}
      <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0' }}>
          Budget Categories
        </div>
      </div>

      {CATEGORIES.map(cat => {
        const spent = getCategorySpent(cat.id);
        const budget = getCategoryBudget(cat);
        const catPercent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
        const isOver = spent > budget;
        const isExpanded = expandedCategories.has(cat.id);
        const catExpenses = expenses.filter(e => e.category === cat.id);

        return (
          <div key={cat.id} style={{ margin: '0.5rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Category Header */}
            <div
              onClick={() => toggleCategory(cat.id)}
              style={{ padding: '0.875rem 1rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Icon */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: cat.color + '26',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}>
                  {cat.icon}
                </div>

                {/* Name + Progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ background: '#181822', borderRadius: '2px', height: '4px', marginTop: '0.35rem', overflow: 'hidden' }}>
                    <div style={{
                      width: `${catPercent}%`,
                      height: '100%',
                      background: isOver ? '#d90429' : cat.color,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Amount + Budget */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: isOver ? '#d90429' : cat.color }}>
                    ${formatCurrency(spent)}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#8888a0' }}>
                    ${formatCurrency(budget)}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Detail */}
            <div style={{
              maxHeight: isExpanded ? '500px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.25s ease',
            }}>
              <div style={{ padding: '1rem', borderTop: '1px solid #1f1f2e' }}>
                {/* Editable Category Budget */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#8888a0', whiteSpace: 'nowrap' }}>Budget: $</label>
                  <input
                    type="number"
                    defaultValue={budget}
                    onChange={e => handleCategoryBudgetChange(cat.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#181822',
                      border: '1px solid #1f1f2e',
                      borderRadius: '6px',
                      color: '#f0f0f5',
                      fontFamily: 'ui-monospace, monospace',
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Expenses List */}
                {catExpenses.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#555570', textAlign: 'center', padding: '0.5rem 0' }}>
                    No expenses in this category
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    {catExpenses.map(exp => (
                      <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid #181822' }}>
                        <span style={{ color: '#8888a0' }}>{exp.date} — {exp.description}</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', color: '#d90429' }}>${formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delete Category Budget */}
                <button
                  onClick={() => {
                    const updated = { ...budgetConfig, categoryBudgets: { ...budgetConfig.categoryBudgets } };
                    delete updated.categoryBudgets[cat.id];
                    setBudgetConfig(updated);
                    localStorage.setItem('tourhq_budget', JSON.stringify(updated));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px dashed #555570',
                    borderRadius: '6px',
                    color: '#555570',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset to Default Budget
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ height: '2rem' }} />
    </div>
  );
}
