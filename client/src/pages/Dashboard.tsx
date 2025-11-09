import React, { useState, useEffect } from 'react';
import { useTransaction } from '../context/TransactionContext';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type MonthlyDatum = { month: string; income: number; expenses: number };

const Dashboard: React.FC = () => {
  const { state, formatCurrency } = useTransaction();
  const { summary, transactions, loading, user } = state;
  
  const [convertedSummary, setConvertedSummary] = useState(summary);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [convertedTransactions, setConvertedTransactions] = useState(transactions.slice(0, 5));
  const [convertedPieData, setConvertedPieData] = useState<{ name: string; value: number }[]>([]);
  const [convertedMonthlyData, setConvertedMonthlyData] = useState<MonthlyDatum[]>([]);

  // Convert summary amounts when currency changes
  useEffect(() => {
    const convertSummary = async () => {
      if (!user || !user.currency) return;
      
      setConversionLoading(true);
      try {
        // Batch convert all summary amounts at once
        const amounts = [
          summary.monthly.income,
          summary.monthly.expenses,
          summary.monthly.balance,
          summary.yearly.income,
          summary.yearly.expenses,
          summary.yearly.balance
        ];
        
        const converted = await currencyService.convertMultiple(amounts, 'USD', user.currency);
        
        setConvertedSummary({
          monthly: {
            income: converted[0],
            expenses: converted[1],
            balance: converted[2]
          },
          yearly: {
            income: converted[3],
            expenses: converted[4],
            balance: converted[5]
          }
        });
      } catch (error) {
        console.error('Error converting summary:', error);
        setConvertedSummary(summary);
      } finally {
        setConversionLoading(false);
      }
    };
    
    convertSummary();
  }, [summary, user?.currency]);

  // Convert individual transactions
  useEffect(() => {
    const convertTransactions = async () => {
      if (!user || !user.currency) {
        setConvertedTransactions(transactions.slice(0, 5));
        return;
      }
      
      const recent = transactions.slice(0, 5);
      const amounts = recent.map(t => t.amount);
      
      // Batch convert all transaction amounts at once
      const convertedAmounts = await currencyService.convertMultiple(amounts, 'USD', user.currency);
      
      const converted = recent.map((t, index) => ({
        ...t,
        convertedAmount: convertedAmounts[index]
      }));
      
      setConvertedTransactions(converted);
    };
    
    convertTransactions();
  }, [transactions, user?.currency]);

  // Convert chart data when currency changes
  useEffect(() => {
    const convertChartData = async () => {
      if (!user || !user.currency) return;

      // Calculate category data for pie chart (expenses)
      const categoryData = transactions.reduce((acc: Record<string, number>, transaction) => {
        if (transaction.type === 'expense') {
          acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        }
        return acc;
      }, {});

      // Prepare pie chart data for batch conversion
      const pieDataEntries = Object.entries(categoryData);
      const pieAmounts = pieDataEntries.map(([_, value]) => value);
      const convertedPieAmounts = await currencyService.convertMultiple(pieAmounts, 'USD', user.currency);
      
      const convertedPie = pieDataEntries.map(([name, _], index) => ({
        name,
        value: convertedPieAmounts[index]
      }));
      setConvertedPieData(convertedPie);

      // Generate monthly data (last 6 months)
      const monthlyDataTemp: { month: string; income: number; expenses: number }[] = [];
      const currentDate = new Date();
      const monthlyAmounts: number[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthlyTransactions = transactions.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
        });

        const income = monthlyTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthlyTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        monthlyDataTemp.push({
          month: date.toLocaleString('default', { month: 'short' }),
          income,
          expenses,
        });
        
        monthlyAmounts.push(income, expenses);
      }
      
      // Batch convert all monthly amounts
      const convertedMonthlyAmounts = await currencyService.convertMultiple(monthlyAmounts, 'USD', user.currency);
      
      // Map converted amounts back to monthly data
      const finalMonthlyData = monthlyDataTemp.map((data, index) => ({
        month: data.month,
        income: convertedMonthlyAmounts[index * 2],
        expenses: convertedMonthlyAmounts[index * 2 + 1]
      }));
      
      setConvertedMonthlyData(finalMonthlyData);
    };

    convertChartData();
  }, [transactions, user?.currency]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  // Use converted transactions
  const recentTransactions = convertedTransactions;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B2D4'];

  return (
    <div className="space-y-8">
      {/* Header */}
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
         Hey {state.user?.firstName || 'there'}, welcome back!
      </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
            Here's your financial overview
        </p>
    </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {conversionLoading ? 'Loading...' : formatCurrency(convertedSummary.monthly.income)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {conversionLoading ? 'Loading...' : formatCurrency(convertedSummary.monthly.expenses)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Balance</p>
              <p
                className={`text-2xl font-bold ${
                  convertedSummary.monthly.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {conversionLoading ? 'Loading...' : formatCurrency(convertedSummary.monthly.balance)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Yearly Balance</p>
              <p
                className={`text-2xl font-bold ${
                  convertedSummary.yearly.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {conversionLoading ? 'Loading...' : formatCurrency(convertedSummary.yearly.balance)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends Chart */}
        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={convertedMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Categories</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={convertedPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {convertedPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
          ) : (
            recentTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency((transaction as any).convertedAmount || transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;