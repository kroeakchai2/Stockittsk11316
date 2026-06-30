import React, { useMemo } from 'react';
import { Item, Transaction } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardProps {
  items: Item[];
  transactions: Transaction[];
  onNavigateToTab: (tab: 'dashboard' | 'inventory' | 'members' | 'reports') => void;
}

export default function Dashboard({ items, transactions, onNavigateToTab }: DashboardProps) {
  
  // 1. Calculate Real-Time Metrics
  const metrics = useMemo(() => {
    let totalBudgetSpent = 0;
    let totalStockValue = 0;
    let totalWithdrawnQty = 0;
    let totalCurrentStockQty = 0;

    items.forEach(item => {
      totalBudgetSpent += item.withdrawCount * item.price;
      totalStockValue += item.quantity * item.price;
      totalWithdrawnQty += item.withdrawCount;
      totalCurrentStockQty += item.quantity;
    });

    const totalCapacity = totalWithdrawnQty + totalCurrentStockQty;
    const averageWithdrawRate = totalCapacity > 0 ? (totalWithdrawnQty / totalCapacity) * 100 : 0;

    return {
      totalBudgetSpent,
      totalStockValue,
      averageWithdrawRate
    };
  }, [items]);

  // 2. Prepare Data for "Category Distribution" (สัดส่วนงบประมาณตามหมวดหมู่)
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {
      'Networking': 0,
      'End-user Devices': 0,
      'Peripherals': 0,
      'Others': 0
    };

    items.forEach(item => {
      const spent = item.withdrawCount * item.price;
      if (categoryTotals[item.category] !== undefined) {
        categoryTotals[item.category] += spent;
      } else {
        categoryTotals['Others'] += spent;
      }
    });

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return Object.entries(categoryTotals).map(([name, value]) => {
      const percentage = totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0;
      return {
        name,
        value,
        percentage
      };
    }).filter(d => d.value > 0);
  }, [items]);

  // Colors mapping for category pie slices (matching Professional Polish indigo and slate theme colors)
  const COLORS = {
    'Networking': '#4f46e5',        // indigo-600
    'End-user Devices': '#0f172a',  // slate-900
    'Peripherals': '#64748b',      // slate-500
    'Others': '#cbd5e1'            // slate-300
  };

  // 3. Prepare Data for "30-Day Withdrawal Trend" (เทรนด์การเบิกจ่าย 30 วันที่ผ่านมา)
  const trendChartData = useMemo(() => {
    // We group transactions from the last 30 days into 4 weeks
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const weeks = [
      { name: 'สัปดาห์ที่ 1', amount: 0 },
      { name: 'สัปดาห์ที่ 2', amount: 0 },
      { name: 'สัปดาห์ที่ 3', amount: 0 },
      { name: 'สัปดาห์ที่ 4', amount: 0 }
    ];

    transactions.forEach(tx => {
      if (tx.type !== 'WITHDRAW') return;
      const txDate = new Date(tx.date).getTime();
      const diffMs = now - txDate;

      if (diffMs <= oneWeekMs) {
        weeks[3].amount += tx.quantity; // Week 4 (Latest)
      } else if (diffMs <= 2 * oneWeekMs) {
        weeks[2].amount += tx.quantity; // Week 3
      } else if (diffMs <= 3 * oneWeekMs) {
        weeks[1].amount += tx.quantity; // Week 2
      } else if (diffMs <= 4 * oneWeekMs) {
        weeks[0].amount += tx.quantity; // Week 1
      }
    });

    return weeks;
  }, [transactions]);

  // 4. Get Top Movement Items (สินค้าที่มีการเคลื่อนไหวสูงสุด)
  const topMovingItems = useMemo(() => {
    return [...items]
      .sort((a, b) => b.withdrawCount - a.withdrawCount)
      .slice(0, 4);
  }, [items]);

  // Format currency in Thai Baht style
  const formatBaht = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Budget Spent */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">งบประมาณที่ใช้ไป (บาท)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl md:text-3xl font-bold font-display text-primary">
                {formatBaht(metrics.totalBudgetSpent)}
              </span>
              <span className="text-error text-xs flex items-center font-bold">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> 12%
              </span>
            </div>
          </div>
          <div className="mt-4 h-12 flex items-end gap-1">
            <div className="bg-primary-container w-full h-1/3 rounded-t"></div>
            <div className="bg-primary-container w-full h-1/2 rounded-t"></div>
            <div className="bg-primary-container w-full h-3/4 rounded-t"></div>
            <div className="bg-primary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-primary-container w-full h-full rounded-t"></div>
          </div>
        </div>

        {/* Card 2: Average Withdraw Rate */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">อัตราการเบิกจ่ายเฉลี่ย</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl md:text-3xl font-bold font-display text-primary">
                {metrics.averageWithdrawRate.toFixed(1)}%
              </span>
              <span className="text-primary text-xs flex items-center font-bold">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_down</span> 2.1%
              </span>
            </div>
          </div>
          <div className="mt-4 h-12 flex items-end gap-1">
            <div className="bg-tertiary-container w-full h-full rounded-t"></div>
            <div className="bg-tertiary-container w-full h-3/4 rounded-t"></div>
            <div className="bg-tertiary-container w-full h-4/5 rounded-t"></div>
            <div className="bg-tertiary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-tertiary-container w-full h-1/2 rounded-t"></div>
          </div>
        </div>

        {/* Card 3: Net Stock Value */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">มูลค่าสินค้าคงคลังสุทธิ</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl md:text-3xl font-bold font-display text-primary">
                {formatBaht(metrics.totalStockValue)}
              </span>
              <span className="text-primary text-xs flex items-center font-bold">
                <span className="material-symbols-outlined text-sm mr-0.5">check_circle</span> Stable
              </span>
            </div>
          </div>
          <div className="mt-4 h-12 flex items-end gap-1">
            <div className="bg-secondary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-secondary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-secondary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-secondary-container w-full h-2/3 rounded-t"></div>
            <div className="bg-secondary-container w-full h-2/3 rounded-t"></div>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Bar Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-on-background">เทรนด์การเบิกจ่าย 30 วันที่ผ่านมา</h3>
            <span className="text-xs text-outline font-medium">หน่วย: ชิ้น/หน่วยนับ</span>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#727784" fontSize={11} tickLine={false} />
                <YAxis stroke="#727784" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Budget Distribution Pie/Donut Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-on-background">สัดส่วนงบประมาณตามหมวดหมู่</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-around h-64 gap-4">
            {/* Donut Area */}
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.name as keyof typeof COLORS] || '#c2c6d4'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatBaht(val)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-primary">78%</span>
                <span className="text-[9px] text-outline font-bold tracking-wider uppercase">IT ASSETS</span>
              </div>
            </div>

            {/* Labels Area */}
            <div className="flex flex-col gap-3">
              {categoryChartData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
                  ></div>
                  <span className="text-xs text-on-surface">
                    {entry.name} ({entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Top Movement Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-base font-bold text-on-background">สินค้าที่มีการเคลื่อนไหวสูงสุด (Top Withdrawals)</h3>
          <button 
            onClick={() => onNavigateToTab('inventory')}
            className="text-primary text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer"
          >
            ดูทั้งหมด
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table border-collapse">
            <thead className="bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4">รหัสสินค้า</th>
                <th className="px-6 py-4">ชื่อสินค้า</th>
                <th className="px-6 py-4 text-right">จำนวนที่เบิกแล้ว</th>
                <th className="px-6 py-4 text-center">สถานะสินค้าคงเหลือ</th>
                <th className="px-6 py-4 text-right">มูลค่ายอดเบิกจ่ายรวม (บ.)</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {topMovingItems.map((item) => {
                const totalSpent = item.withdrawCount * item.price;
                
                // Status styles
                const statusStyles = {
                  'IN STOCK': 'bg-primary-container/20 text-primary',
                  'LOW STOCK': 'bg-amber-100 text-amber-800 border border-amber-200',
                  'OUT OF STOCK': 'bg-error-container text-on-error-container'
                }[item.status];

                return (
                  <tr key={item.id} className="border-b border-outline-variant hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-outline">{item.id}</td>
                    <td className="px-6 py-4 font-bold text-on-background">{item.name}</td>
                    <td className="px-6 py-4 text-right font-semibold">{item.withdrawCount} {item.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${statusStyles}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-on-background">
                      {totalSpent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
