import { Transaction, Customer } from './types';
import config from '../config';
import authService from './authService';

// Get the base URL from environment variables
const BASE_URL = config.apiUrl;
const API_URL = `${BASE_URL}/api/Transaction`;
const CUSTOMERS_API_URL = `${BASE_URL}/api/Customer`;

// Function to get headers with authentication
const getHeaders = () => {
  return {
    'Authorization': authService.getBasicAuthHeader(),
    'Content-Type': 'application/json'
  };
};

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
    const response = await fetch(API_URL, {
      headers: getHeaders()
    });
    
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
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders()
    });
    
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
    const response = await fetch(`${CUSTOMERS_API_URL}`, {
      headers: getHeaders()
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
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

/**
 * Filters transactions based on customer ID
 */
export const filterTransactionsByCustomer = async (customerId: number): Promise<Transaction[]> => {
  try {
    // GET /api/Transaction/filter-by-customer/{customerId}
    const response = await fetch(`${API_URL}/filter-by-customer/${customerId}`, {
      headers: getHeaders()
    });
    
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
    // Properly convert dates to UTC ISO format
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
    
    // Create UTC dates
    if (!formattedStartDate.includes('Z')) { // Z indicates UTC timezone
      const startDateObj = new Date(formattedStartDate);
      formattedStartDate = startDateObj.toISOString(); // This is in UTC by default
    }
    
    if (!formattedEndDate.includes('Z')) {
      const endDateObj = new Date(formattedEndDate);
      // Set to end of day in UTC
      endDateObj.setUTCHours(23, 59, 59, 999);
      formattedEndDate = endDateObj.toISOString();
    }
    
    console.log('Filter dates (UTC):', { formattedStartDate, formattedEndDate });
    
    // GET /api/Transaction/filter-by-date-range
    const url = `${API_URL}/filter-by-date-range?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
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

// Also update the filterTransactionsByCustomerAndDateRange function
export const filterTransactionsByCustomerAndDateRange = async (
  customerId: number,
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    // Properly convert dates to UTC ISO format
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
    
    // Create UTC dates
    if (!formattedStartDate.includes('Z')) { // Z indicates UTC timezone
      const startDateObj = new Date(formattedStartDate);
      formattedStartDate = startDateObj.toISOString(); // This is in UTC by default
    }
    
    if (!formattedEndDate.includes('Z')) {
      const endDateObj = new Date(formattedEndDate);
      // Set to end of day in UTC
      endDateObj.setUTCHours(23, 59, 59, 999);
      formattedEndDate = endDateObj.toISOString();
    }
    
    console.log('Filter dates (UTC) with customer:', { customerId, formattedStartDate, formattedEndDate });
    
    // GET /api/Transaction/filter-by-customer-and-date-range
    const url = `${API_URL}/filter-by-customer-and-date-range?customerId=${customerId}&startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
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

//downloadTransactionsReport function
export const downloadTransactionsReport = async (
  customerId?: number,
  startDate?: string,
  endDate?: string,
  type?: string
): Promise<void> => {
  try {
    // Use the base API URL without ID
    let url = `${API_URL}/report`;
    const params = [];
    
    // Add type parameter - default to 'all' if not specified
    params.push(`type=${encodeURIComponent(type || 'all')}`);
    
    // Add customerId parameter if provided
    if (customerId) {
      params.push(`customerId=${customerId}`);
    }
    
    // Add date parameters if provided with UTC formatting
    if (startDate) {
      // Format date as UTC ISO string
      let formattedStartDate = startDate;
      if (!formattedStartDate.includes('Z')) { // Z indicates UTC timezone
        const startDateObj = new Date(formattedStartDate);
        formattedStartDate = startDateObj.toISOString(); // This is in UTC by default
      }
      params.push(`startDate=${encodeURIComponent(formattedStartDate)}`);
    }
    
    if (endDate) {
      // Format date as UTC ISO string
      let formattedEndDate = endDate;
      if (!formattedEndDate.includes('Z')) {
        const endDateObj = new Date(formattedEndDate);
        // Set to end of day in UTC
        endDateObj.setUTCHours(23, 59, 59, 999);
        formattedEndDate = endDateObj.toISOString();
      }
      params.push(`endDate=${encodeURIComponent(formattedEndDate)}`);
    }
    
    // Always include query string since type is required
    url += `?${params.join('&')}`;

    console.log('Downloading report from URL:', url);

    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
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
      method: "DELETE",
      headers: getHeaders()
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
  customerName?: string;
  type: "Credit" | "Debit"; // Assuming these are the only two types
  amount: number;
  description: string;
  date: string;
}

/**
 * Adds a new transaction
 */
/**
 * Adds a new transaction
 */
export const addTransaction = async (transaction: AddTransactionRequest): Promise<Transaction> => {
  try {
    // Format the date to be at the start of the day
    let formattedDate = transaction.date;
    
    // If it's already an ISO string with time, make sure it's at 00:00:00
    if (formattedDate.includes('T')) {
      // Use the ISO string as is, assuming the component already set the correct time
      // formattedDate = formattedDate;
    } else {
      // If it's just a date without time, add 00:00:00
      const dateObj = new Date(formattedDate);
      dateObj.setHours(0, 0, 0, 0);
      formattedDate = dateObj.toISOString();
    }
    
    // Create a clean transaction object with exactly what the backend expects
    const apiTransaction = {
      customerId: transaction.customerId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: formattedDate
    };
    
    console.log('Transaction data being sent to API:', apiTransaction);
    
    // POST /api/Transaction
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(apiTransaction)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData;
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
      headers: getHeaders(),
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
    // Set the type based on filterOption
    let type = 'all';
    
    if (filterOption === "customer") {
      type = 'customer';
    } else if (filterOption === "date") {
      type = 'date';
    } else if (filterOption === "both") {
      type = 'both';
    }
    
    console.log(`Downloading report with type: ${type}`);
    
    if (filterOption === "none") {
      return await downloadTransactionsReport(undefined, undefined, undefined, type);
    } else if (filterOption === "customer") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      return await downloadTransactionsReport(customer.id, undefined, undefined, type);
    } else if (filterOption === "date") {
      return await downloadTransactionsReport(undefined, filterStartDate, filterEndDate, type);
    } else if (filterOption === "both") {
      // Find the customer ID from the name
      const customers = await fetchCustomers();
      const customer = customers.find(c => c.name === filterCustomer);
      if (!customer) {
        throw new Error(`Customer "${filterCustomer}" not found`);
      }
      return await downloadTransactionsReport(customer.id, filterStartDate, filterEndDate, type);
    }
  } catch (error) {
    console.error("Failed to download transactions:", error);
    throw error;
  }
};

export const downloadCustomerBillPdf = async (
  customerId: number,
  startDate: string,
  endDate: string
): Promise<void> => {
  try {
    // Format dates for the API in UTC format
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
    
    // Create UTC dates
    if (!formattedStartDate.includes('Z')) { // Z indicates UTC timezone
      const startDateObj = new Date(formattedStartDate);
      formattedStartDate = startDateObj.toISOString(); // This is in UTC by default
    }
    
    if (!formattedEndDate.includes('Z')) {
      const endDateObj = new Date(formattedEndDate);
      // Set to end of day in UTC
      endDateObj.setUTCHours(23, 59, 59, 999);
      formattedEndDate = endDateObj.toISOString();
    }
    
    // Construct API URL - we'll use a new endpoint: /api/Transaction/bill
    let url = `${API_URL}/bill`;
    const params = [
      `customerId=${customerId}`,
      `startDate=${encodeURIComponent(formattedStartDate)}`,
      `endDate=${encodeURIComponent(formattedEndDate)}`
    ];
    
    url += `?${params.join('&')}`;
    
    console.log('Downloading bill PDF from URL:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // For file downloads, we don't check content-type as it will be a blob
    const blob = await response.blob();
    
    // Get customer name for the filename
    const customers = await fetchCustomers();
    const customer = customers.find(c => c.id === customerId);
    const customerName = customer ? customer.name.replace(/\s+/g, '_') : 'customer';
    
    // Format date range for filename
    const formattedDateRange = `${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}`;
    
    // Create a link to download the file
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${customerName}_bill_${formattedDateRange}.pdf`;
    link.click();
  } catch (error) {
    console.error("Failed to download customer bill PDF:", error);
    throw error;
  }
};