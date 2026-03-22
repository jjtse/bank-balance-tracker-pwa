'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format, subMonths, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getAccounts, getRecords } from '@/lib/store';
import { BankAccount, BalanceRecord, MonthlyData } from '@/lib/types';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import AccountDetailModal from './AccountDetailModal';
import TotalHistoryModal from './TotalHistoryModal';

import { useAuth } from '@/context/AuthContext';
import { LogIn, Loader2, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

// Dynamically import Recharts with SSR disabled to fix the width/height warning
const Chart = dynamic(() => import('./DashboardChart'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-2xl" />
});

export default function Dashboard() {
  const { user, loading: authLoading, isConfigured, login } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [records, setRecords] = useState<BalanceRecord[]>([]);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [totalTWD, setTotalTWD] = useState(0);
  const [lastMonthDiff, setLastMonthDiff] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (!user || !isConfigured) return;
      
      setDataLoading(true);
      try {
        const loadedAccounts = await getAccounts(user.uid);
        const loadedRecords = await getRecords(user.uid);
        
        setAccounts(loadedAccounts);
        setRecords(loadedRecords);

        // Helper to get TWD value
        const getTWDValue = (record: BalanceRecord, currency: string) => {
          if (currency === 'USD') {
            return record.amountTWD || 0;
          }
          return record.amount;
        };

        // Process data for chart (last 12 months) - showing TWD equivalent
        const months = Array.from({ length: 12 }, (_, i) => {
          const d = subMonths(new Date(), i);
          return format(d, 'yyyy-MM');
        }).reverse();

        const processedData = months.map(month => {
          const dataPoint: MonthlyData = {
            month: format(parseISO(`${month}-01`), 'MMM', { locale: zhTW }),
            total: 0,
            rawMonth: month
          };

          loadedAccounts.forEach(acc => {
            const record = loadedRecords.find(r => r.date === month && r.accountId === acc.id);
            const val = record ? getTWDValue(record, acc.currency) : 0;
            dataPoint[acc.id] = val;
            dataPoint.total += val;
          });
          
          return dataPoint;
        });

        setChartData(processedData);

        // Current Total: Sum the latest record of EACH account
        const calculateLatestTotalTWD = () => {
          return loadedAccounts.reduce((sum, acc) => {
            const latestRecord = loadedRecords
              .filter(r => r.accountId === acc.id)
              .sort((a, b) => b.date.localeCompare(a.date))[0];
            
            if (!latestRecord) return sum;
            
            const val = getTWDValue(latestRecord, acc.currency);
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
        };

        const currentTotal = calculateLatestTotalTWD();
        setTotalTWD(currentTotal);

        // Calculate diff: Sum of (Latest - Previous) for each account
        // This logic ensures we compare the actual latest updates, not calendar months (which might be empty)
        const calculateTotalDiff = () => {
          return loadedAccounts.reduce((sumDiff, acc) => {
            const accountRecords = loadedRecords
              .filter(r => r.accountId === acc.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            
            const latest = accountRecords[0];
            const previous = accountRecords[1];
            
            if (latest && previous) {
              const latestVal = getTWDValue(latest, acc.currency);
              const prevVal = getTWDValue(previous, acc.currency);
              const v1 = isNaN(latestVal) ? 0 : latestVal;
              const v2 = isNaN(prevVal) ? 0 : prevVal;
              return sumDiff + (v1 - v2);
            }
            return sumDiff;
          }, 0);
        };
        setLastMonthDiff(calculateTotalDiff());
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading) {
      initData();
    }
  }, [user, authLoading, isConfigured, refreshKey]);

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">載入中...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Firebase 尚未設定</h2>
          <p className="text-slate-500 max-w-xs mx-auto">
            請點擊左側菜單中的 <b>Settings</b>，並填入您的 Firebase API Key 等環境變數。
          </p>
        </div>
        <div className="bg-slate-100 p-4 rounded-2xl text-left text-xs font-mono text-slate-600 w-full max-w-xs">
          <p className="font-bold mb-2">需要設定的變數：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            <li>...等 (詳見 .env.example)</li>
          </ul>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">正在同步雲端資料...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 group">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">總資產 (折合台幣)</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsHistoryOpen(true);
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
              title="查看歷史紀錄"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              ${totalTWD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h2>
            <span className="text-slate-400 text-sm font-medium">TWD</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${lastMonthDiff >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {lastMonthDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(lastMonthDiff).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">較上個月</span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            資產趨勢 (TWD)
          </h3>
        </div>
        
        <div className="h-64 w-full [&_.recharts-legend-wrapper]:!hidden">
          <Chart 
            chartData={chartData} 
            accounts={accounts} 
          />
        </div>
      </div>

      {/* Account Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 px-1 uppercase tracking-widest">帳戶分佈</h3>
        <div className="grid gap-3">
          {accounts.map(account => {
            const accountRecords = records
              .filter(r => r.accountId === account.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            
            const latestRecord = accountRecords[0];
            const previousRecord = accountRecords[1];
            
            let diff = 0;
            if (latestRecord && previousRecord) {
              const latestVal = account.currency === 'USD' ? (latestRecord.amountTWD || 0) : latestRecord.amount;
              const previousVal = account.currency === 'USD' ? (previousRecord.amountTWD || 0) : previousRecord.amount;
              diff = latestVal - previousVal;
            }
            
            return (
              <div 
                key={account.id} 
                onClick={() => setSelectedAccount(account)}
                className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: account.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">{account.name}</p>
                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase">
                        {account.currency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      最後更新: {latestRecord ? latestRecord.date : '無資料'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    {latestRecord && previousRecord && diff !== 0 && (
                      <div className={`flex items-center text-[10px] font-bold ${diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {diff > 0 ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                        {Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    )}
                    <p className="font-mono font-bold text-slate-700 leading-none">
                      ${latestRecord ? (account.currency === 'USD' ? (latestRecord.amountTWD || 0) : latestRecord.amount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                    </p>
                  </div>
                  {account.currency === 'USD' && latestRecord && (
                    <p className="text-[10px] text-slate-400 font-bold">
                      (USD {latestRecord.amount.toLocaleString()})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedAccount && (
        <AccountDetailModal 
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onUpdate={handleDataUpdate}
        />
      )}

      <TotalHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        accounts={accounts}
        records={records}
      />
    </div>
  );
}
