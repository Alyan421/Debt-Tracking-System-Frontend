import { Customer } from "@/lib/types";    
import config from "config";

// Get the base URL from environment variables
const BASE_URL = config.apiUrl;
const API_URL = `${BASE_URL}/api/Customer`;

/**
 * Fetches all customers from the API
 */
export const fetchAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch(API_URL);
    
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
    throw error; // Remove the fallback to empty array to properly handle errors
  }
};

/**
 * Fetches a single customer by ID
 */
export const fetchCustomerById = async (id: number): Promise<Customer | null> => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    
    if (response.status === 404) {
      return null; // Customer not found
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
    console.error(`Failed to fetch customer with id ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new customer
 */
export const createCustomer = async (customer: Omit<Customer, "id">): Promise<Customer> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customer)
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
    console.error("Failed to create customer:", error);
    throw error;
  }
};

/**
 * Updates an existing customer
 */
export const updateCustomer = async (id: number, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customerData)
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
    console.error(`Failed to update customer with id ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a customer by ID
 */
export const deleteCustomer = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to delete customer with id ${id}:`, error);
    throw error;
  }
};

/**
 * Searches for customers by name, email, or other criteria
 */
export const searchCustomers = async (query: string): Promise<Customer[]> => {
  try {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to search customers with query "${query}":`, error);
    return [];
  }
};

/**
 * Gets the transactions for a specific customer
 */
export const getCustomerTransactions = async (customerId: number): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/${customerId}/transactions`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON. Received: " + contentType);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to get transactions for customer with id ${customerId}:`, error);
    return [];
  }
};