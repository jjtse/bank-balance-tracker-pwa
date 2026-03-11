'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Settings, User, LogOut, LogIn, Wallet } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import RecordForm from '@/components/RecordForm';
import AccountSettings from '@/components/AccountSettings';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';

export default function MainApp() {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'settings'>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close logout confirm when clicking outside (simplified for this UI)
  useEffect(() => {
    if (showLogoutConfirm) {
      const timer = setTimeout(() => setShowLogoutConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLogoutConfirm]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold">載入中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8">
          <Wallet className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">我的資產帳本</h1>
        <p className="text-slate-500 mb-12 max-w-[240px] mx-auto">極簡、私人、安全的資產追蹤工具。請登入以開始使用。</p>
        <button 
          onClick={login}
          className="w-full max-w-xs bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <LogIn className="w-5 h-5" />
          使用 Google 帳號登入
        </button>
      </div>
    );
  }

  const handleRecordSuccess = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-50 relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">
            {activeTab === 'dashboard' ? '我的資產' : activeTab === 'add' ? '新增記錄' : '設定'}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={logout}
                className="bg-rose-50 text-rose-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm border border-rose-100"
              >
                <LogOut className="w-3 h-3" />
                登出
              </motion.button>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
            className={`w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow-sm overflow-hidden active:scale-90 transition-all ${showLogoutConfirm ? 'border-rose-200 ring-2 ring-rose-100' : 'border-slate-200'}`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard />
            </motion.div>
          )}
          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RecordForm onSuccess={handleRecordSuccess} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AccountSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around z-20">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">總覽</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('add')}
          className={`flex flex-col items-center gap-1 -mt-12 transition-all ${activeTab === 'add' ? 'scale-110' : ''}`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${activeTab === 'add' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-900 shadow-slate-200'}`}>
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-tighter mt-1 ${activeTab === 'add' ? 'text-indigo-600' : 'text-slate-400'}`}>記錄</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">設定</span>
        </button>
      </nav>
    </div>
  );
}
