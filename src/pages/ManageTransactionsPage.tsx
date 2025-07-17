// ManageTransactionsPage.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: number;
  customerId: number;
  amount: number;
  type: "credit" | "debit";
  date: string;
  description: string;
}

export default function ManageTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingTransaction) {
      const { name, value } = e.target;
      setEditingTransaction({ ...editingTransaction, [name]: value });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTransaction),
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTransaction.id ? editingTransaction : t))
      );
      setEditingTransaction(null);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto mt-10">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Manage Transactions</h2>
        {editingTransaction ? (
          <form onSubmit={handleUpdate} className="space-y-4 mb-6">
            <h3 className="text-lg font-medium">Edit Transaction</h3>
            <div>
              <label className="block mb-1 font-medium">Customer ID</label>
              <Input
                name="customerId"
                type="number"
                value={editingTransaction.customerId}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Amount</label>
              <Input
                name="amount"
                type="number"
                value={editingTransaction.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Type</label>
              <select
                name="type"
                value={editingTransaction.type}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <Input
                name="date"
                type="date"
                value={editingTransaction.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <Input
                name="description"
                value={editingTransaction.description}
                onChange={handleChange}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Update Transaction</Button>
              <Button variant="secondary" onClick={() => setEditingTransaction(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Customer ID</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-2 border">{t.id}</td>
                    <td className="p-2 border">{t.customerId}</td>
                    <td className="p-2 border">{t.amount}</td>
                    <td className="p-2 border">{t.type}</td>
                    <td className="p-2 border">{t.date}</td>
                    <td className="p-2 border">{t.description}</td>
                    <td className="p-2 border space-x-2">
                      <Button onClick={() => handleEdit(t)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDelete(t.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}