// src/lib/types.ts

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  totalDebt?: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  customerId: number;
  customerName: string;
  type: "Credit" | "Debit";
  amount: number;
  description: string;
  date: string;
}