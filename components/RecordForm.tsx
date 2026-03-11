'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAccounts, addRecord } from '@/lib/store';
import { BankAccount } from '@/lib/types';
import { Check, Calendar, ChevronDown, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RecordForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountTWD, setAmountTWD] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      setLoading(true);
      const data = await getAccounts(user.uid);
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
      setLoading(false);
    };
    fetchAccounts();
  }, [user]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount || !user) return;

    setIsSubmitting(true);
    try {
      await addRecord(user.uid, {
        accountId: selectedAccountId,
        amount: parseFloat(amount),
        amountTWD: selectedAccount?.currency === 'USD' ? parseFloat(amountTWD) : undefined,
        date: date
      });
      setAmount('');
      setAmountTWD('');
      onSuccess();
    } catch (error) {
      console.error("Failed to add record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">載入帳戶中...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Account Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">選擇帳戶</label>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map(account => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${
                  selectedAccountId === account.id 
                    ? 'border-indigo-500 bg-indigo-50/50' 
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-bold ${selectedAccountId === account.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {account.name}
                  </span>
                  <span className="text-[8px] font-black opacity-50 uppercase tracking-tighter">
                    {account.currency}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            本月餘額 {selectedAccount?.currency === 'USD' ? '(USD)' : ''}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              {selectedAccount?.currency === 'USD' ? 'US$' : '$'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:border-indigo-500 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* TWD Equivalent Input for USD accounts */}
        {selectedAccount?.currency === 'USD' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">換算台幣 (TWD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={amountTWD}
                onChange={(e) => setAmountTWD(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-8 pr-4 text-xl font-bold focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">記錄月份</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="month"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold focus:border-indigo-500 focus:outline-none transition-colors appearance-none"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-lg shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Check className="w-6 h-6" />
            儲存記錄
          </>
        )}
      </button>
    </form>
  );
}
