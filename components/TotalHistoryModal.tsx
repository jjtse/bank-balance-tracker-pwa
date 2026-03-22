'use client';

import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BankAccount, BalanceRecord } from '@/lib/types';

interface TotalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  records: BalanceRecord[];
}

export default function TotalHistoryModal({ isOpen, onClose, accounts, records }: TotalHistoryModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get available years from records
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    records.forEach(r => {
      const year = parseInt(r.date.split('-')[0]);
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [records, currentYear]);

  // Helper to get TWD value
  const getTWDValue = (record: BalanceRecord, currency: string) => {
    if (currency === 'USD') {
      return record.amountTWD || 0;
    }
    return record.amount;
  };

  // Calculate monthly totals for the selected year
  const monthlyData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;

    for (let month = 1; month <= 12; month++) {
      // Skip current and future months if the selected year is the current year
      // (Since user settles at the end of the month)
      if (selectedYear === currentYearNum && month >= currentMonthNum) {
        continue;
      }

      const monthStr = month.toString().padStart(2, '0');
      const targetDate = `${selectedYear}-${monthStr}-31`; // End of month approximation
      
      let total = 0;
      let hasData = false;

      accounts.forEach(acc => {
        // Find the latest record for this account that is on or before this month
        const accountRecords = records
          .filter(r => r.accountId === acc.id && r.date <= `${selectedYear}-${monthStr}-31`)
          .sort((a, b) => b.date.localeCompare(a.date));
        
        if (accountRecords.length > 0) {
          total += getTWDValue(accountRecords[0], acc.currency);
          hasData = true;
        }
      });

      if (hasData) {
        data.push({
          month: monthStr,
          total,
          label: `${selectedYear}/${monthStr}`
        });
      }
    }
    return data.reverse(); // Show latest months first
  }, [selectedYear, accounts, records]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900">資產歷史</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">每月總額回顧</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Filter */}
        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between">
          <button 
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear);
              if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
            }}
            disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
            className="p-2 text-slate-400 disabled:opacity-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-800">{selectedYear} 年</span>
          </div>

          <button 
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear);
              if (idx > 0) setSelectedYear(availableYears[idx - 1]);
            }}
            disabled={availableYears.indexOf(selectedYear) === 0}
            className="p-2 text-slate-400 disabled:opacity-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {monthlyData.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400">該年份尚無記錄</p>
            </div>
          ) : (
            monthlyData.map((item, index) => {
              const prevItem = monthlyData[index + 1];
              const diff = prevItem ? item.total - prevItem.total : 0;
              
              return (
                <div 
                  key={item.label}
                  className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <span className="block text-[10px] font-black text-slate-300 uppercase leading-none">{selectedYear}</span>
                      <span className="block text-xl font-black text-indigo-600">{item.month}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">總資產 (TWD)</p>
                      <p className="text-lg font-black text-slate-800">
                        ${item.total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {prevItem && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${diff >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(diff).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all"
          >
            關閉
          </button>
        </div>
      </motion.div>
    </div>
  );
}
