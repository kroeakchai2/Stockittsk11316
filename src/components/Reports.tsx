import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface ReportsProps {
  transactions: Transaction[];
  searchQuery: string;
}

export default function Reports({ transactions, searchQuery }: ReportsProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL'); // ALL, TODAY, WEEK, MONTH

  // 1. Filter Transactions dynamically
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search matching
      const matchesSearch = tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type matching
      const matchesType = filterType === 'ALL' || tx.type === filterType;

      // Date matching
      let matchesDate = true;
      if (dateRange !== 'ALL') {
        const txTime = new Date(tx.date).getTime();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        if (dateRange === 'TODAY') {
          matchesDate = now - txTime <= dayMs;
        } else if (dateRange === 'WEEK') {
          matchesDate = now - txTime <= 7 * dayMs;
        } else if (dateRange === 'MONTH') {
          matchesDate = now - txTime <= 30 * dayMs;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, filterType, dateRange]);

  // 2. Export filtered transactions to CSV (fully functional Export)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('ไม่มีข้อมูลรายงานสำหรับพิมพ์ส่งออก');
      return;
    }

    // Prepare CSV header and rows
    const headers = ['ID', 'Item ID', 'Item Name', 'Type', 'Quantity', 'Operated By', 'Date', 'Notes'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.itemId,
      tx.itemName,
      tx.type,
      tx.quantity,
      `"${tx.memberName.replace(/"/g, '""')}"`,
      new Date(tx.date).toLocaleString('th-TH'),
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    // Add BOM for UTF-8 compatibility in Excel for Thai characters!
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    // Download flow
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `StockIT_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters and Export Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
        
        {/* Filters Selectors */}
        <div className="flex flex-wrap gap-4 text-xs">
          {/* Filter Action Type */}
          <div>
            <label className="block text-secondary font-bold mb-1">ประเภทการทำรายการ:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-outline-variant rounded-lg p-2 bg-surface font-semibold"
            >
              <option value="ALL">รายการทั้งหมด (ALL)</option>
              <option value="WITHDRAW">เบิกออกคลัง (WITHDRAW)</option>
              <option value="RESTOCK">นำส่งเข้าสต็อก (RESTOCK)</option>
            </select>
          </div>

          {/* Filter Date Range */}
          <div>
            <label className="block text-secondary font-bold mb-1">ขอบเขตช่วงเวลา:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-outline-variant rounded-lg p-2 bg-surface font-semibold"
            >
              <option value="ALL">ทุกช่วงเวลา</option>
              <option value="TODAY">ภายใน 24 ชม. ที่ผ่านมา</option>
              <option value="WEEK">ภายใน 7 วันที่ผ่านมา</option>
              <option value="MONTH">ภายใน 30 วันที่ผ่านมา</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors self-end md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>ส่งออกรายงาน (CSV)</span>
        </button>

      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="text-base font-bold text-on-background">ประวัติการบันทึกเวชภัณฑ์และเบิกจ่าย (Audit Trail)</h3>
          <p className="text-[11px] text-outline mt-0.5">แสดงรายงานย้อนหลังและข้อมูลการเบิกพัสดุแบบนาทีต่อนาที</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table border-collapse">
            <thead className="bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4">รหัสรายการ</th>
                <th className="px-6 py-4">วัน-เวลาบันทึก</th>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">พัสดุไอที</th>
                <th className="px-6 py-4 text-right">จำนวน</th>
                <th className="px-6 py-4">ผู้ทำรายการ / สังกัด</th>
                <th className="px-6 py-4">หมายเหตุ / วัตถุประสงค์</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredTransactions.map((tx) => {
                const isWithdraw = tx.type === 'WITHDRAW';

                return (
                  <tr key={tx.id} className="border-b border-outline-variant hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-outline">{tx.id}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono">
                      {new Date(tx.date).toLocaleString('th-TH', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                        isWithdraw 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isWithdraw ? 'เบิกออก' : 'เติมพัสดุ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-bold text-on-background">{tx.itemName}</p>
                      <p className="text-[10px] font-mono text-outline">{tx.itemId}</p>
                    </td>
                    <td className={`px-6 py-4 text-right font-black font-mono text-sm ${isWithdraw ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isWithdraw ? '-' : '+'}{tx.quantity}
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary">{tx.memberName}</td>
                    <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate" title={tx.notes}>
                      {tx.notes || '-'}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary font-medium">
                    ไม่มีประวัติบันทึกข้อมูลเวชภัณฑ์ที่ตรงตามช่วงเวลาและเงื่อนไขตัวกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
