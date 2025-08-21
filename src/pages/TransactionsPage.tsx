import React, { useState, useEffect, useCallback } from "react";
import "./TransactionsPage.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextBox } from "@/components/ui/Textbox";

import { formatDate } from "@/lib/utils";
import CustomerButtonSelector from "@/components/ui/CustomerButtonSelector";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

import {
  fetchTransactions,
  filterTransactions,
  downloadTransactions,
  deleteTransaction,
  addTransaction,
  updateTransaction,
  AddTransactionRequest,
  downloadCustomerBillPdf
} from "@/lib/transactionsService";
import { fetchAllCustomers } from "@/lib/customerService";
import { Transaction, Customer } from "@/lib/types";

// Add this interface at the top, after the imports
interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

// Helper functions for month handling
const getMonthName = (month: number): string => {
  return new Date(0, month).toLocaleString('default', { month: 'long' });
};

const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
};

const getMonthDateRange = (month: number, year: number): { startDate: string; endDate: string } => {
  // First day of month
  const startDate = new Date(year, month, 1);
  // Last day of month
  const endDate = new Date(year, month + 1, 0);

  return {
    startDate: startDate.toISOString().substring(0, 10),
    endDate: endDate.toISOString().substring(0, 10)
  };
};

// Also update the getMonthTransactions function to sort the filtered results
const getMonthTransactions = (transactions: Transaction[], month: number, year: number): Transaction[] => {
  // First filter by month and year
  const filtered = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
  });

  // Then sort by date in descending order
  return filtered.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

// Add this helper function after the existing helper functions
const calculateRunningBalances = (transactions: Transaction[], customerId?: number): TransactionWithBalance[] => {
  // Sort transactions by date (oldest first) for accurate balance calculation
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // If customerId is provided, filter and calculate balance for that customer only
  // If not provided, calculate global balance across all customers
  let runningBalance = 0;
  const customerBalances: Record<number, number> = {};

  const transactionsWithBalance: TransactionWithBalance[] = sortedTransactions.map(transaction => {
    if (customerId) {
      // Calculate balance for specific customer only
      if (transaction.customerId === customerId) {
        // Apply the transaction to calculate balance AFTER this transaction
        if (transaction.type === "Debit") {
          runningBalance += transaction.amount; // Customer owes more
        } else {
          runningBalance -= transaction.amount; // Customer paid back
        }
      }
      // For transactions of other customers when filtering by customerId, don't change balance
    } else {
      // Calculate balance per customer
      if (!customerBalances[transaction.customerId]) {
        customerBalances[transaction.customerId] = 0;
      }
      
      // Apply the transaction to calculate balance AFTER this transaction
      if (transaction.type === "Debit") {
        customerBalances[transaction.customerId] += transaction.amount; // Customer owes more
      } else {
        customerBalances[transaction.customerId] -= transaction.amount; // Customer paid back
      }
      runningBalance = customerBalances[transaction.customerId];
    }

    return {
      ...transaction,
      // This represents the balance AFTER this transaction was applied
      runningBalance: customerId ? runningBalance : customerBalances[transaction.customerId]
    };
  });

  // Sort back to newest first for display
  return transactionsWithBalance.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export default function TransactionsPage() {
  // Original state variables
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [filterOption, setFilterOption] = useState<string>("none");
  const [filterCustomer, setFilterCustomer] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("2025-01-01");
  const [filterEndDate, setFilterEndDate] = useState<string>(new Date().toISOString().substring(0, 10));

  const [customerName, setCustomerName] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<"Credit" | "Debit">("Debit");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [isCustomerLocked, setIsCustomerLocked] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // New state variables for month filtering
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    [`${currentMonth}-${currentYear}`]: true // Current month expanded by default
  });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, Transaction[]>>({});

  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [billCustomerId, setBillCustomerId] = useState<number | null>(null);
  const [billCustomerName, setBillCustomerName] = useState<string>("");
  const [billStartDate, setBillStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substring(0, 10)
  );
  const [billEndDate, setBillEndDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Update state to store transactions with balance
  const [transactionsWithBalance, setTransactionsWithBalance] = useState<TransactionWithBalance[]>([]);
  const [allTransactionsWithBalance, setAllTransactionsWithBalance] = useState<TransactionWithBalance[]>([]);

  // Load all transactions from the API
// Update the loadAllTransactions function
const loadAllTransactions = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const data = await fetchTransactions();

    // Sort all transactions by date in descending order (newest first)
    const sortedData = [...data].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Calculate running balances
    const dataWithBalance = calculateRunningBalances(data); // Pass unsorted data for accurate calculation
    setAllTransactionsWithBalance(dataWithBalance);
    setAllTransactions(sortedData);

    // Filter for selected month with balance
    const monthlyTransactions = getMonthTransactions(sortedData, selectedMonth, selectedYear);
    const monthlyWithBalance = dataWithBalance.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === selectedMonth && transactionDate.getFullYear() === selectedYear;
    });
    setTransactionsWithBalance(monthlyWithBalance);
    setTransactions(monthlyTransactions);
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("An unknown error occurred.");
    }
  } finally {
    setIsLoading(false);
  }
}, [selectedMonth, selectedYear]);

  // Organize transactions by month
  const organizeTransactionsByMonth = useCallback(() => {
    const monthData: Record<string, Transaction[]> = {};

    // Group transactions by month and year
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${month}-${year}`;

      if (!monthData[key]) {
        monthData[key] = [];
      }

      monthData[key].push(transaction);
    });

    // Sort transactions within each month by date in descending order
    Object.keys(monthData).forEach(key => {
      monthData[key].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    });

    setMonthlyData(monthData);
  }, [allTransactions]);

    const loadCustomers = useCallback(async () => {
    try {
      const data = await fetchAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadAllTransactions();
    loadCustomers();
  }, [loadAllTransactions, loadCustomers]);

  // Effect to organize transactions by month when all transactions change
  useEffect(() => {
    organizeTransactionsByMonth();
  }, [organizeTransactionsByMonth]);

  // Get unique months and years from transactions
  const getAvailableMonthsYears = (): { month: number; year: number }[] => {
    const uniqueMonthYears = new Set<string>();
    const result: { month: number; year: number }[] = [];

    // Add current month even if no transactions
    uniqueMonthYears.add(`${currentMonth}-${currentYear}`);

    // Add all months with transactions
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      uniqueMonthYears.add(`${month}-${year}`);
    });

    // Convert to array and sort
    Array.from(uniqueMonthYears).forEach(key => {
      const [month, year] = key.split('-').map(Number);
      result.push({ month, year });
    });

    // Sort by year and month (most recent first)
    result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return result;
  };

  // Calculate monthly summary
  const calculateMonthlySummary = (monthTransactions: Transaction[]) => {
    let totalCredit = 0;
    let totalDebit = 0;
    let count = 0;

    monthTransactions.forEach(transaction => {
      count++;
      if (transaction.type === "Credit") {
        totalCredit += transaction.amount;
      } else {
        totalDebit += transaction.amount;
      }
    });

    const netAmount = totalDebit - totalCredit;

    return { totalCredit, totalDebit, netAmount, count };
  };

  // Toggle month expansion
  const toggleMonthExpansion = (month: number, year: number) => {
    const key = `${month}-${year}`;
    setExpandedMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

// Update the changeMonth function
const changeMonth = (month: number, year: number) => {
  setSelectedMonth(month);
  setSelectedYear(year);

  // Update filter dates to match the selected month
  const { startDate, endDate } = getMonthDateRange(month, year);
  setFilterStartDate(startDate);
  setFilterEndDate(endDate);

  // Update transactions shown based on selected month
  const monthlyTransactions = getMonthTransactions(allTransactions, month, year);
  const monthlyWithBalance = allTransactionsWithBalance.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
  });
  
  setTransactions(monthlyTransactions);
  setTransactionsWithBalance(monthlyWithBalance);

  // Expand the selected month
  setExpandedMonths(prev => ({
    ...prev,
    [`${month}-${year}`]: true
  }));
};

  // Increment/decrement year
  const changeYear = (increment: number) => {
    const newYear = selectedYear + increment;
    setSelectedYear(newYear);

    // Update filter dates to match the selected month and new year
    const { startDate, endDate } = getMonthDateRange(selectedMonth, newYear);
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);

    // Update transactions shown based on selected month and new year
    setTransactions(getMonthTransactions(allTransactions, selectedMonth, newYear));
  };

// Update the handleFilter function
const handleFilter = async (customCustomer?: string, customStartDate?: string, customEndDate?: string) => {
  // Use the parameters if provided, otherwise use state
  const currentCustomer = customCustomer !== undefined ? customCustomer : filterCustomer;
  const currentStartDate = customStartDate !== undefined ? customStartDate : filterStartDate;
  const currentEndDate = customEndDate !== undefined ? customEndDate : filterEndDate;
  
  // Determine filter type based on what's selected
  let filterType = "none";
  if (currentCustomer && (currentStartDate || currentEndDate)) {
    filterType = "both";
  } else if (currentCustomer) {
    filterType = "customer";
  } else if (currentStartDate || currentEndDate) {
    filterType = "date";
  }

  if (filterType === "none") {
    loadAllTransactions();
    return;
  }

  setIsLoading(true);
  setError(null);
  try {
    const data = await filterTransactions(filterType, currentCustomer, currentStartDate, currentEndDate);
    
    // Calculate running balances for filtered data
    const customerForBalance = currentCustomer ? customers.find(c => c.name === currentCustomer)?.id : undefined;
    const dataWithBalance = calculateRunningBalances(data, customerForBalance);
    
    setAllTransactionsWithBalance(dataWithBalance);
    setAllTransactions(data);
    
    const monthlyTransactions = getMonthTransactions(data, selectedMonth, selectedYear);
    const monthlyWithBalance = dataWithBalance.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === selectedMonth && transactionDate.getFullYear() === selectedYear;
    });
    setTransactionsWithBalance(monthlyWithBalance);
    setTransactions(monthlyTransactions);
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("An unknown error occurred.");
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await downloadTransactions(filterOption, filterCustomer, filterStartDate, filterEndDate);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteTransaction(id);
        await loadAllTransactions();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!customerName) {
      setError("Please select a customer.");
      setIsSubmitting(false);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      setIsSubmitting(false);
      return;
    }

    // Find the selected customer's ID if not already set
    if (!customerId) {
      const selectedCustomer = customers.find(c => c.name === customerName);
      if (!selectedCustomer) {
        setError("Invalid customer selection.");
        setIsSubmitting(false);
        return;
      }
      setCustomerId(selectedCustomer.id);
    }

    try {
      // Format the date to be at the start of the day (00:00:00)
      let formattedDate = date;
      if (!formattedDate.includes('T')) {
        // Parse the date and set time to 00:00:00
        const dateObj = new Date(formattedDate);
        dateObj.setHours(0, 0, 0, 0);  // Set to beginning of day
        formattedDate = dateObj.toISOString();
      }

      const transactionData: AddTransactionRequest = {
        customerId: Number(customerId),
        customerName,
        type: transactionType as "Credit" | "Debit",
        amount: parseFloat(amount),
        description,
        date: formattedDate // Use the formatted date with time set to 00:00:00
      };

      if (editingTransaction) {
        // Wait for the update to complete
        const updatedTransaction = await updateTransaction(editingTransaction.id, transactionData);
        console.log("Transaction updated successfully:", updatedTransaction);

        // Force a reload of all transactions to refresh the UI
        await loadAllTransactions();

        // Reset form state after successful update
        resetForm();
      } else {
        // Wait for the add to complete
        const newTransaction = await addTransaction(transactionData);
        console.log("Transaction added successfully:", newTransaction);

        // Force a reload of all transactions to refresh the UI
        await loadAllTransactions();

        // Reset form state after successful add
        resetForm();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setCustomerName(transaction.customerName);
    setCustomerId(transaction.customerId);
    setTransactionType(transaction.type);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);

    // Format the date from ISO to YYYY-MM-DD for the date input
    if (transaction.date) {
      const date = new Date(transaction.date);
      const formattedDate = date.toISOString().substring(0, 10);
      setDate(formattedDate);
    } else {
      setDate(new Date().toISOString().substring(0, 10));
    }

    console.log('Editing transaction:', transaction);
  };

  const resetForm = () => {
    // Only reset customer fields if editing a transaction or if you want to unlock after each add
    if (editingTransaction) {
      setCustomerName("");
      setCustomerId(null);
      setIsCustomerLocked(false); // Unlock when editing
    }
    setTransactionType("Debit");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().substring(0, 10));
    setEditingTransaction(null);
  };

  // All your existing getXXX functions remain the same
  const getTransactionTypeOptions = () => {
    return [
      { value: "Debit", label: "Debit (Customer owes you)" },
      { value: "Credit", label: "Credit (You owe customer)" }
    ];
  };

  const getFilterOptions = () => {
    return [
      { value: "none", label: "No Filter" },
      { value: "customer", label: "Filter by Customer" },
      { value: "date", label: "Filter by Date Range" },
      { value: "both", label: "Filter by Customer and Date" }
    ];
  };

  const getCustomerOptions = () => {
    return [
      { value: "", label: "Select a customer" },
      ...customers.map(customer => ({
        value: customer.name,
        label: customer.name
      }))
    ];
  };

  //Generate Bill
  const handleGenerateBill = async () => {
    if (!billCustomerId) {
      setError("Please select a customer");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await downloadCustomerBillPdf(billCustomerId, billStartDate, billEndDate);
      setShowBillModal(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while generating the bill");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Bill directly without modal
  const handleGenerateBillDirect = async (customerId: number, customerName: string, startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await downloadCustomerBillPdf(customerId, startDate, endDate);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while generating the bill");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to open the bill modal
  const openBillModal = (customerId: number, customerName: string) => {
    setBillCustomerId(customerId);
    setBillCustomerName(customerName);

    // Default to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    setBillStartDate(firstDayOfMonth.toISOString().substring(0, 10));
    setBillEndDate(today.toISOString().substring(0, 10));

    setShowBillModal(true);
  };

  // Event handlers for dropdowns
  const handleFilterOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOption(e.target.value);
  };

  const handleFilterCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCustomer(e.target.value);
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomerName(e.target.value);
    const selectedCustomer = customers.find(c => c.name === e.target.value);
    setCustomerId(selectedCustomer?.id || null);
  };

  const handleTransactionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTransactionType(e.target.value as "Credit" | "Debit");
  };

  return (
    <div className="transactions-page">
      <h1>Transactions</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Month and year selector */}
      <div className="year-selector">
        <button className="year-button" onClick={() => changeYear(-1)}>◀</button>
        <span className="year-display">{selectedYear}</span>
        <button className="year-button" onClick={() => changeYear(1)}>▶</button>
      </div>

      {/* Month navigation */}
      <div className="month-navigation">
        {getAvailableMonthsYears().map(({ month, year }) => (
          <button
            key={`${month}-${year}`}
            className={`month-button ${month === selectedMonth && year === selectedYear ? 'active' : ''}`}
            onClick={() => changeMonth(month, year)}
          >
            {getMonthName(month)} {year !== currentYear ? year : ''}
          </button>
        ))}
      </div>

      {/* Current month indicator */}
      {selectedMonth === currentMonth && selectedYear === currentYear && (
        <div className="current-month-label">Current Month</div>
      )}

      {/* Add Transaction Section */}
      <Card className="card">
        <CardContent className="card-content">
          <h2>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
          <form onSubmit={handleAddTransaction} className="form-container">
            <div className="form-group">
              <label className="form-label">Customer</label>
              <SearchableDropdown
                options={customers}
                label="name"
                id="add-transaction-customer"
                selectedVal={customerName}
                disabled={isCustomerLocked}
                handleChange={(val: string | null) => {
                  if (!isCustomerLocked) {
                    setCustomerName(val ?? "");
                    const selectedCustomer = customers.find(c => c.name === val);
                    setCustomerId(selectedCustomer?.id || null);
                  }
                }}
              />              {!isCustomerLocked ? (
                <Button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    if (customerName) setIsCustomerLocked(true);
                  }}
                  disabled={!customerName}
                  style={{ marginTop: '8px' }}
                >
                  Lock Customer
                </Button>
              ) : (
                <Button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsCustomerLocked(false)}
                  style={{ marginTop: '8px' }}
                >
                  Unlock Customer
                </Button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Amount</label>
              <TextBox
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <TextBox
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <TextBox
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-buttons">
              <Button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (editingTransaction ? "Updating..." : "Adding...")
                  : (editingTransaction ? "Update Transaction" : "Add Transaction")}
              </Button>

              {editingTransaction && (
                <Button
                  type="button"
                  className="button button-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card className="card">
        <CardContent className="card-content">
          <h2>Filter Transactions</h2>
          <div className="filter-container">
            {/* Filter fields - always show date and customer filters */}

            {/* Filter fields - always show date and customer filters */}
            <div className="filter-row-horizontal" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="filter-label">Start Date</label>
                <TextBox
                  type="date"
                  value={filterStartDate}
                  onChange={e => {
                    setFilterStartDate(e.target.value);
                    handleFilter(undefined, e.target.value, undefined);
                  }}
                />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="filter-label">End Date</label>
                <TextBox
                  type="date"
                  value={filterEndDate}
                  onChange={e => {
                    setFilterEndDate(e.target.value);
                    handleFilter(undefined, undefined, e.target.value);
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Button
                onClick={() => {
                  const newStartDate = "2025-01-01";
                  const newEndDate = new Date().toISOString().substring(0, 10);
                  setFilterStartDate(newStartDate);
                  setFilterEndDate(newEndDate);
                  handleFilter(undefined, newStartDate, newEndDate);
                }}
                className="button button-secondary"
                style={{ fontSize: '0.9rem', padding: '6px 12px' }}
              >
                Reset Dates
              </Button>
            </div>
            <CustomerButtonSelector
              customers={customers}
              selectedCustomer={filterCustomer}
              showAllCustomers={true}
              onSelect={(name, id) => {
                setFilterCustomer(name);
                handleFilter(name);
              }}
            />

            <div className="filter-buttons">
              <Button
                onClick={handleDownload}
                className="button button-secondary"
                disabled={isLoading}
              >
                Download
              </Button>

              {/* Add the Generate Bill button only when a customer is selected */}
              {filterCustomer && (
                <Button
                  onClick={() => {
                    const customer = customers.find(c => c.name === filterCustomer);
                    if (customer) {
                      if (window.confirm(`Generate bill for ${filterCustomer} from ${filterStartDate} to ${filterEndDate}?`)) {
                        handleGenerateBillDirect(customer.id, filterCustomer, filterStartDate, filterEndDate);
                      }
                    } else {
                      setError("Please select a valid customer first");
                    }
                  }}
                  className="button button-secondary"
                  disabled={isLoading}
                >
                  Generate Bill PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      
      {/* Filter Summary */}
      <div className="filter-summary" style={{ 
        marginBottom: '20px',
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid #e9ecef'
      }}>
        {(() => {
          const summary = calculateMonthlySummary(allTransactions);
          return (
            <>
              <div className="summary-item" style={{ textAlign: 'center' }}>
                <div className="summary-label" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '6px' }}>Total Debits</div>
                <div className="summary-value debit" style={{ fontWeight: 'bold', fontSize: '1.0rem', color: '#dc3545' }}>${summary.totalDebit.toFixed(0)}</div>
              </div>
              <div className="summary-item" style={{ textAlign: 'center' }}>
                <div className="summary-label" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '6px' }}>Total Credits</div>
                <div className="summary-value credit" style={{ fontWeight: 'bold', fontSize: '1.0rem', color: '#28a745' }}>${summary.totalCredit.toFixed(0)}</div>
              </div>
              <div className="summary-item" style={{ textAlign: 'center' }}>
                <div className="summary-label" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '6px' }}>Net Amount</div>
                <div className={`summary-value ${summary.netAmount >= 0 ? 'debit' : 'credit'}`} style={{
                  fontWeight: 'bold',
                  fontSize: '1.0rem',
                  color: summary.netAmount >= 0 ? '#dc3545' : '#28a745'
                }}>
                  ${Math.abs(summary.netAmount).toFixed(0)}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Transactions for Selected Month */}
      <Card className="card">
        <CardContent className="card-content">
          <h2>Transactions for {getMonthName(selectedMonth)} {selectedYear}</h2>

          {isLoading ? (
            <div className="loading-message">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-message">No transactions found for {getMonthName(selectedMonth)} {selectedYear}</div>
          ) : (
            <>
              {/* Month summary */}
              <div className="month-summary">
                {(() => {
                  const summary = calculateMonthlySummary(transactions);
                  return (
                    <>
                      <div className="summary-item">
                        <div className="summary-label">Transactions</div>
                        <div className="summary-value">{summary.count}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Total Debits</div>
                        <div className="summary-value debit">${summary.totalDebit.toFixed(0)}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Total Credits</div>
                        <div className="summary-value credit">${summary.totalCredit.toFixed(0)}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Net Amount</div>
                        <div className={`summary-value ${summary.netAmount >= 0 ? 'debit' : 'credit'}`}>
                          ${Math.abs(summary.netAmount).toFixed(0)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="table-container">
<table className="transactions-table">
  <thead>
    <tr>
      <th>Customer</th>
      <th>Amount</th>
      <th>Balance</th>
      <th>Description</th>
      <th>Date</th>
      <th>Type</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {transactionsWithBalance.map((transaction) => (
      <tr key={transaction.id}>
        <td>{transaction.customerName}</td>
        <td className={transaction.type === "Debit" ? "text-red-600" : "text-green-600"}>
          {transaction.amount.toFixed(0)}
        </td>
        <td className={transaction.runningBalance >= 0 ? "text-red-600" : "text-green-600"}>
          {transaction.runningBalance.toFixed(0)}
        </td>
        <td>{transaction.description}</td>
        <td>{formatDate(transaction.date)}</td>
        <td>{transaction.type === "Credit" ? "Credit" : "Debit"}</td>
        <td>
          <Button
            size="sm"
            className="button button-primary"
            onClick={() => handleEdit(transaction)}
            disabled={isLoading}
          >
            Edit
          </Button>
          <Button
            size="sm"
            className="button button-danger"
            onClick={() => handleDelete(transaction.id)}
            disabled={isLoading}
          >
            Delete
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

{getAvailableMonthsYears()
  .filter(({ month, year }) => !(month === selectedMonth && year === selectedYear))
  .map(({ month, year }) => {
    const key = `${month}-${year}`;
    const isExpanded = expandedMonths[key] || false;
    const monthTransactions = monthlyData[key] || [];
    
    // FIXED: Use the correct running balances from allTransactionsWithBalance
    // instead of recalculating from scratch
    const monthTransactionsWithBalance = monthTransactions.map(transaction => {
      const transactionWithBalance = allTransactionsWithBalance.find(t => t.id === transaction.id);
      return transactionWithBalance || { ...transaction, runningBalance: 0 };
    });
    
    const summary = calculateMonthlySummary(monthTransactions);

    return (
      <div key={key} className="month-section">
        <div
          className="month-header"
          onClick={() => toggleMonthExpansion(month, year)}
        >
          <h3>{getMonthName(month)} {year} ({summary.count} transactions)</h3>
          <button className="month-toggle">
            {isExpanded ? '▼' : '►'}
          </button>
        </div>

        {isExpanded && monthTransactions.length > 0 && (
          <div className="month-content">
            <div className="month-summary">
              <div className="summary-item">
                <div className="summary-label">Total Debits</div>
                <div className="summary-value debit">${summary.totalDebit.toFixed(0)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Total Credits</div>
                <div className="summary-value credit">${summary.totalCredit.toFixed(0)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Net Amount</div>
                <div className={`summary-value ${summary.netAmount >= 0 ? 'debit' : 'credit'}`}>
                  ${Math.abs(summary.netAmount).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTransactionsWithBalance.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.customerName}</td>
                      <td>{transaction.type === "Credit" ? "Credit" : "Debit"}</td>
                      <td className={transaction.type === "Debit" ? "text-red-600" : "text-green-600"}>
                        {transaction.amount.toFixed(0)}
                      </td>
                      <td className={transaction.runningBalance >= 0 ? "text-red-600" : "text-green-600"}>
                        {transaction.runningBalance.toFixed(0)}
                      </td>
                      <td>{transaction.description}</td>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <Button
                          size="sm"
                          className="button button-primary"
                          onClick={() => handleEdit(transaction)}
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="button button-danger"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  })}

      {/* Bill Generation Modal */}
      {showBillModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generate Bill PDF</h2>
            <div className="bill-customer-info">
              <span className="bill-customer-name">Customer: {billCustomerName}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date:</label>
              <TextBox
                type="date"
                value={billStartDate}
                onChange={(e) => setBillStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date:</label>
              <TextBox
                type="date"
                value={billEndDate}
                onChange={(e) => setBillEndDate(e.target.value)}
              />
            </div>

            <div className="form-buttons">
              <Button
                onClick={handleGenerateBill}
                className="button button-primary"
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate Bill PDF"}
              </Button>
              <Button
                onClick={() => setShowBillModal(false)}
                className="button button-secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}