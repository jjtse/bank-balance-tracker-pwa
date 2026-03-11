'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BankAccount, BalanceRecord } from '@/lib/types';
import { getRecords, updateRecord, deleteRecord } from '@/lib/store';
import { X, Edit2, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';

interface AccountDetailModalProps {
  account: BankAccount;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AccountDetailModal({ account, onClose, onUpdate }: AccountDetailModalProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<BalanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editAmountTWD, setEditAmountTWD] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  const refreshRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const allRecords = await getRecords(user.uid);
    const accountRecords = allRecords
      .filter(r => r.accountId === account.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    setRecords(accountRecords);
    setLoading(false);
  }, [user, account.id]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const handleEdit = (record: BalanceRecord) => {
    setEditingId(record.id);
    setEditAmount(record.amount.toString());
    setEditAmountTWD(record.amountTWD?.toString() || '');
    setEditDate(record.date);
  };

  const handleSave = async () => {
    if (!editingId || !user) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;

    await updateRecord(user.uid, {
      id: editingId,
      accountId: account.id,
      amount,
      amountTWD: account.currency === 'USD' ? parseFloat(editAmountTWD) : undefined,
      date: editDate
    });

    setEditingId(null);
    await refreshRecords();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('確定要刪除這筆紀錄嗎？')) {
      await deleteRecord(user.uid, id);
      await refreshRecords();
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
            <h2 className="text-xl font-bold text-slate-800">{account.name} 歷史紀錄</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {records.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium">尚無任何紀錄</p>
            </div>
          ) : (
            records.map(record => (
              <div 
                key={record.id} 
                className={`p-4 rounded-2xl border transition-all ${editingId === record.id ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}`}
              >
                {editingId === record.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">月份</label>
                        <input 
                          type="month"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">金額 ({account.currency})</label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    {account.currency === 'USD' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">換算台幣 (TWD)</label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          value={editAmountTWD}
                          onChange={(e) => setEditAmountTWD(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSave}
                        className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> 儲存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{record.date}</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <p className="text-lg font-mono font-black text-slate-800">
                          {record.amount.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">{account.currency}</span>
                      </div>
                      {account.currency === 'USD' && (
                        <p className="text-[10px] font-bold text-indigo-500">
                          ≈ ${(record.amountTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} TWD
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            關閉
          </button>
        </div>
      </motion.div>
    </div>
  );
}
