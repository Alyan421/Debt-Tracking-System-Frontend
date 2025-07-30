import { Customer } from "@/lib/types";
import config from "../config";
import authService from "./authService";

// Get the base URL from environment variables
const BASE_URL = config.apiUrl;
const API_URL = `${BASE_URL}/api/Customer`;

// Function to get headers with authentication
const getHeaders = () => {
  return {
    'Authorization': authService.getBasicAuthHeader(),
    'Content-Type': 'application/json'
  };
};

/**
 * Fetches all customers from the API
 */
export const fetchAllCustomers = async (): Promise<Customer[]> => {
  try {
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

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

/**
 * Fetches a single customer by ID
 */
export const fetchCustomerById = async (id: number): Promise<Customer | null> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders()
    });

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
      headers: getHeaders(),
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
    // Format the data exactly as expected by the backend
    const formattedData = {
      id: id,
      name: customerData.name,
      phone: customerData.phone || null,
      address: customerData.address || null,
      createdAt: customerData.createdAt
    };

    // Ensure createdAt is in ISO format
    if (formattedData.createdAt && !formattedData.createdAt.includes('T')) {
      // Convert YYYY-MM-DD to ISO format
      const date = new Date(formattedData.createdAt);
      formattedData.createdAt = date.toISOString();
    }

    console.log('Updating customer with formatted data:', formattedData);

    const response = await fetch(API_URL, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(formattedData)
    });

    if (!response.ok) {
      // Try to get more detailed error information
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        // Ignore error reading response text
      }

      throw new Error(`Error ${response.status}: ${response.statusText} ${errorText ? '- ' + errorText : ''}`);
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
      method: "DELETE",
      headers: getHeaders()
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
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
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
    console.error(`Failed to search customers with query "${query}":`, error);
    return [];
  }
};

/**
 * Gets the transactions for a specific customer
 */
export const getCustomerTransactions = async (customerId: number): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/${customerId}/transactions`, {
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
    console.error(`Failed to get transactions for customer with id ${customerId}:`, error);
    return [];
  }
};