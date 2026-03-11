export interface BankAccount {
  id: string;
  name: string;
  color: string;
  currency: 'TWD' | 'USD';
}

export interface BalanceRecord {
  id: string;
  accountId: string;
  amount: number;
  amountTWD?: number; // Manual TWD conversion for foreign currency
  date: string; // ISO format YYYY-MM
}

export interface MonthlyData {
  month: string;
  total: number;
  [key: string]: any; // For dynamic account totals
}
