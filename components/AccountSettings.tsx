'use client';

import React, { useState, useEffect } from 'react';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/lib/store';
import { BankAccount } from '@/lib/types';
import { Plus, Trash2, Edit2, Check, X, Landmark, Palette, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettings() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [currency, setCurrency] = useState<'TWD' | 'USD'>('TWD');

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      setLoading(true);
      const data = await getAccounts(user.uid);
      setAccounts(data);
      setLoading(false);
    };
    fetchAccounts();
  }, [user]);

  const colors = [
    '#D41C00', '#FFA8B1', '#FA7115', '#00a650', 
    '#B7E8CA', '#3C2EBF', '#06b6d4', '#B0B0B0'
  ];

  const handleAdd = async () => {
    if (!name || !user) return;
    const newAcc = await addAccount(user.uid, { name, color, currency });
    setAccounts([...accounts, newAcc]);
    resetForm();
  };

  const handleUpdate = async (id: string) => {
    if (!name || !user) return;
    const updatedAcc = { id, name, color, currency };
    await updateAccount(user.uid, updatedAcc);
    setAccounts(accounts.map(a => a.id === id ? updatedAcc : a));
    resetForm();
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteAccount(user.uid, id);
    setAccounts(accounts.filter(a => a.id !== id));
    setDeletingId(null);
  };

  const startEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setName(account.name);
    setColor(account.color);
    setCurrency(account.currency);
    setIsAdding(false);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setColor('#4f46e5');
    setCurrency('TWD');
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
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">帳戶列表</h3>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
          >
            <Plus className="w-3 h-3" />
            新增帳戶
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {(isAdding || editingId) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">{isAdding ? '新增帳戶' : '編輯帳戶'}</h4>
                <button onClick={resetForm} className="text-slate-400 p-1"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">帳戶名稱</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：國泰世華"
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">幣別</label>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setCurrency('TWD')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${currency === 'TWD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >
                        TWD
                      </button>
                      <button 
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${currency === 'USD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >
                        USD
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">代表色</label>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl overflow-x-auto no-scrollbar">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full flex-shrink-0 transition-all ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'scale-90'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => isAdding ? handleAdd() : handleUpdate(editingId!)}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" />
                {isAdding ? '確認新增' : '儲存變更'}
              </button>
            </motion.div>
          )}

          {accounts.map(account => (
            <motion.div 
              layout
              key={account.id} 
              className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: account.color }} />
                <div>
                  <p className="font-bold text-slate-800">{account.name}</p>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                    {account.currency}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AnimatePresence mode="wait">
                  {deletingId === account.id ? (
                    <motion.div 
                      key="confirm"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-1 bg-rose-50 rounded-xl p-1"
                    >
                      <button 
                        onClick={() => handleDelete(account.id)}
                        className="px-3 py-1.5 text-[10px] font-black text-rose-600 uppercase tracking-tighter"
                      >
                        確認刪除
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1"
                    >
                      <button 
                        onClick={() => startEdit(account)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(account.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
