import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: number;
  customerName: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  description?: string;
}

export default function ViewTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    customerName: "",
    fromDate: "",
    toDate: "",
    type: "",
  });

  const fetchTransactions = async () => {
    const query = new URLSearchParams();
    if (filters.customerName) query.append("customerName", filters.customerName);
    if (filters.fromDate) query.append("fromDate", filters.fromDate);
    if (filters.toDate) query.append("toDate", filters.toDate);
    if (filters.type) query.append("type", filters.type);

    const res = await fetch(`/api/transactions/view?${query.toString()}`);
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <Card className="max-w-5xl mx-auto mt-10">
      <CardContent>
        <h2 className="text-xl font-semibold mb-6">View Transactions</h2>
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 font-medium">Customer Name</label>
            <Input
              type="text"
              name="customerName"
              value={filters.customerName}
              onChange={handleChange}
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">From Date</label>
            <Input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} />
          </div>

          <div>
            <label className="block mb-1 font-medium">To Date</label>
            <Input type="date" name="toDate" value={filters.toDate} onChange={handleChange} />
          </div>

          <div>
            <label className="block mb-1 font-medium">Transaction Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>

          <div className="md:col-span-4 text-right">
            <Button type="submit">Filter</Button>
          </div>
        </form>

        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Customer</th>
              <th className="border border-gray-300 px-4 py-2">Amount</th>
              <th className="border border-gray-300 px-4 py-2">Type</th>
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">No transactions found.</td>
              </tr>
            )}
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="border border-gray-300 px-4 py-2">{t.id}</td>
                <td className="border border-gray-300 px-4 py-2">{t.customerName}</td>
                <td className="border border-gray-300 px-4 py-2">{t.amount}</td>
                <td className="border border-gray-300 px-4 py-2 capitalize">{t.type}</td>
                <td className="border border-gray-300 px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                <td className="border border-gray-300 px-4 py-2">{t.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
