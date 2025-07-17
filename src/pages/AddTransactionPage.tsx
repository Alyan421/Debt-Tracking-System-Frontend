import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface Transaction {
  customerId: number;
  amount: number;
  type: "credit" | "debit";
  date: string;
  description: string;
}

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction>({
    customerId: 0,
    amount: 0,
    type: "credit",
    date: new Date().toISOString().substring(0, 10),
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    navigate("/transactions");
  };

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Customer ID</label>
            <Input
              name="customerId"
              type="number"
              value={transaction.customerId}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Amount</label>
            <Input
              name="amount"
              type="number"
              value={transaction.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Type</label>
            <select
              name="type"
              value={transaction.type}
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
              value={transaction.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <Input
              name="description"
              value={transaction.description}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full">Add Transaction</Button>
        </form>
      </CardContent>
    </Card>
  );
}
