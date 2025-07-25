import { isImportEqualsDeclaration } from 'typescript';
import { Transaction, Customer } from './types';
import config from '../config'; // Adjust the import path as necessary

// Get the base URL from environment variables
const BASE_URL = config.apiUrl;
const API_URL = `${BASE_URL}/api/Transaction`;
const CUSTOMERS_API_URL = `${BASE_URL}/api/Customer`;


const enrichTransactionsWithCustomerNames = async (transactions: Transaction[]): Promise<Transaction[]> => {
  // If all transactions already have customer names, return as is
  if (transactions.every(t => t.customerName)) {
    return transactions;
  }

  try {
    // Get all customers to find names for IDs
    const customers = await fetchCustomers();
    
    // Map customer IDs to names for quick lookup
    const customerMap = new Map<number, string>();
    customers.forEach(customer => {
      customerMap.set(customer.id, customer.name);
    });
    
    // Add customer names to transactions that don't have them
    return transactions.map(transaction => {
      if (!transaction.customerName && customerMap.has(transaction.customerId)) {
        return {
          ...transaction,
          customerName: customerMap.get(transaction.customerId) || `Customer ${transaction.customerId}`
        };
      }
      return transaction;
    });
  } catch (error) {
    console.error("Failed to enrich transactions with customer names:", error);
    // Return original transactions if enrichment fails
    return transactions;
  }
};



/**
 * Fetches all transactions from the API
 */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    // GET /api/Transaction
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    const transactions = await response.json();
    // Ensure customer names are present
    return await enrichTransactionsWithCustomerNames(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    throw error;
  }
};


/**
 * Fetches a single transaction by ID
 */
export const fetchTransactionById = async (id: number): Promise<Transaction | null> => {
  try {
    // GET /api/Transaction/{id}
    const response = await fetch(`${API_URL}/${id}`);
    
    if (response.status === 404) {
      return null; // Transaction not found
    }
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch transaction with id ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches all customers from the API
 * This is deprecated - use fetchAllCustomers from customerService instead
 */
export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch(`${CUSTOMERS_API_URL}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

/**
 * Filters transactions based on customer ID
 */


// Update the filterTransactionsByCustomer function to ensure customer names are included
export const filterTransactionsByCustomer = async (customerId: number): Promise<Transaction[]> => {
  try {
    // GET /api/Transaction/filter-by-customer/{customerId}
    const response = await fetch(`${API_URL}/filter-by-customer/${customerId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    const transactions = await response.json();
    // Ensure customer names are present
    return await enrichTransactionsWithCustomerNames(transactions);
  } catch (error) {
    console.error(`Failed to filter transactions by customer ${customerId}:`, error);
    throw error;
  }
};

// Update the other filter methods as well to use the enrichment function
export const filterTransactionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    // GET /api/Transaction/filter-by-date-range
    const url = `${API_URL}/filter-by-date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    const transactions = await response.json();
    // Ensure customer names are present
    return await enrichTransactionsWithCustomerNames(transactions);
  } catch (error) {
    console.error("Failed to filter transactions by date range:", error);
    throw error;
  }
};

// Update the filterTransactionsByCustomerAndDateRange method too
export const filterTransactionsByCustomerAndDateRange = async (
  customerId: number,
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    // GET /api/Transaction/filter-by-customer-and-date-range
    const url = `${API_URL}/filter-by-customer-and-date-range?customerId=${customerId}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    const transactions = await response.json();
    // Ensure customer names are present
    return await enrichTransactionsWithCustomerNames(transactions);
  } catch (error) {
    console.error("Failed to filter transactions by customer and date range:", error);
    throw error;
  }
};

/**
 * Downloads transactions report
 */
export const downloadTransactionsReport = async (
  customerId?: number,
  startDate?: string,
  endDate?: string
): Promise<void> => {
  try {
    // GET /api/Transaction/report
    let url = `${API_URL}/report`;
    const params = [];
    
    if (customerId) {
      params.push(`customerId=${customerId}`);
    }
    
    if (startDate) {
      params.push(`startDate=${encodeURIComponent(startDate)}`);
    }
    
    if (endDate) {
      params.push(`endDate=${encodeURIComponent(endDate)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // For file downloads, we don't check content-type as it will be a blob
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "transactions-report.xlsx";
    link.click();
  } catch (error) {
    console.error("Failed to download transactions report:", error);
    throw error;
  }
};

/**
 * Deletes a transaction by ID
 */
export const deleteTransaction = async (id: number): Promise<void> => {
  try {
    // DELETE /api/Transaction/{id}
    const response = await fetch(`${API_URL}/${id}`, { 
      method: "DELETE"
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to delete transaction with id ${id}:`, error);
    throw error;
  }
};

/**
 * Interface for creating a transaction - no ID field as it's generated by backend
 */
export interface AddTransactionRequest {
  customerId: number;
  customerName: string;
  type: "Credit" | "Debit"; // Assuming these are the only two types
  amount: number;
  description: string;
  date: string;
}

/**
 * Adds a new transaction
 */
export const addTransaction = async (transaction: AddTransactionRequest): Promise<Transaction> => {
  try {
    // POST /api/Transaction
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(transaction)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to add transaction:", error);
    throw error;
  }
};

/**
 * Updates an existing transaction
 */
export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    // PUT /api/Transaction
    // Note: According to your API, this doesn't include ID in the URL but in the body
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        ...transaction
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to update transaction with id ${id}:`, error);
    throw error;
  }
};

/**
 * Older filter function for backwards compatibility
 */
// Make sure the older filter function also uses the enrichment
export const filterTransactions = async (
  filterOption: string,
  filterCustomer: string,
  filterStartDate: string,
  filterEndDate: string
): Promise<Transaction[]> => {
  try {
    let transactions: Transaction[] = [];
    
    if (filterOption === "none") {
      transactions = await fetchTransactions();
    } else if (filterOption === "customer") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      transactions = await filterTransactionsByCustomer(customer.id);
    } else if (filterOption === "date") {
      transactions = await filterTransactionsByDateRange(filterStartDate, filterEndDate);
    } else if (filterOption === "both") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      transactions = await filterTransactionsByCustomerAndDateRange(customer.id, filterStartDate, filterEndDate);
    }
    
    // Ensure all transactions have customer names
    return await enrichTransactionsWithCustomerNames(transactions);
  } catch (error) {
    console.error("Failed to filter transactions:", error);
    throw error;
  }
};


/**
 * For compatibility with older code
 */
export const downloadTransactions = async (
  filterOption: string,
  filterCustomer: string,
  filterStartDate: string,
  filterEndDate: string
): Promise<void> => {
  try {
    if (filterOption === "none") {
      return await downloadTransactionsReport();
    } else if (filterOption === "customer") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      return await downloadTransactionsReport(customer.id);
    } else if (filterOption === "date") {
      return await downloadTransactionsReport(undefined, filterStartDate, filterEndDate);
    } else if (filterOption === "both") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      return await downloadTransactionsReport(customer.id, filterStartDate, filterEndDate);
    }
  } catch (error) {
    console.error("Failed to download transactions:", error);
    throw error;
  }
};