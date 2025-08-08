import React, { useState, useEffect } from "react";
import "./CustomersPage.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextBox } from "@/components/ui/Textbox";
import { formatDate } from "@/lib/utils";
import {
  fetchAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "@/lib/customerService";
import { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [totalDebt, setTotalDebt] = useState<string>("0");
  const [createdAt, setcreatedAt] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllCustomers();
      setCustomers(data);
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

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name) {
      setError("Please enter a customer name.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingCustomer) {
        // Format the date properly for the backend
        let formattedDate = createdAt;
        if (!formattedDate.includes('T')) {
          // Convert YYYY-MM-DD to ISO format
          const date = new Date(formattedDate);
          formattedDate = date.toISOString();
        }

        // For editing, include any required fields from the original customer
        // But DO NOT include totalDebt when editing - the backend should maintain the debt value
        const customerData = {
          id: editingCustomer.id,
          name,
          phone: phone || undefined, // Use undefined instead of null
          address: address || undefined, // Use undefined instead of null
          // totalDebt is removed from here since we don't want to modify it when editing
          createdAt: formattedDate
        };

        console.log('Updating customer with data:', customerData);
        await updateCustomer(editingCustomer.id, customerData);
      } else {
        // Similar format for creating new customers
        let formattedDate = createdAt;
        if (!formattedDate.includes('T')) {
          const date = new Date(formattedDate);
          formattedDate = date.toISOString();
        }

        // Ensure totalDebt is correctly parsed as a number
        const debtAmount = totalDebt === "" ? 0 : parseFloat(totalDebt);

        // When creating, we do want to set the initial debt amount
        const customerData = {
          name,
          phone: phone || undefined, // Use undefined instead of null
          address: address || undefined, // Use undefined instead of null
          totalDebt: debtAmount, // Use the parsed value
          createdAt: formattedDate
        };

        console.log('Creating customer with data:', customerData);
        console.log('Initial debt amount:', debtAmount, 'from input value:', totalDebt);
        await createCustomer(customerData);
      }

      // Reset form fields
      resetForm();

      // Reload the customer list
      loadCustomers();
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

  // ...existing code...

  const handleDelete = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete customer "${customer?.name}"?\n\n` +
      `All transactions for this customer will also be deleted. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const typed = window.prompt(
      'Type "Yes" to confirm deletion of this customer and all their transactions:'
    );
    if (typed !== "Yes" && typed !== "yes") return;

    setError(null);
    setIsLoading(true);
    try {
      await deleteCustomer(id);
      loadCustomers();
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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setTotalDebt(customer.totalDebt?.toString() || "0");

    // Format the date from ISO to YYYY-MM-DD for the date input
    if (customer.createdAt) {
      const date = new Date(customer.createdAt);
      const formattedDate = date.toISOString().substring(0, 10);
      setcreatedAt(formattedDate);
    } else {
      setcreatedAt(new Date().toISOString().substring(0, 10));
    }

    // Log the customer being edited to help with debugging
    console.log('Editing customer:', customer);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setTotalDebt("0");
    setcreatedAt(new Date().toISOString().substring(0, 10));
    setEditingCustomer(null);
  };

  return (
    <div className="customers-page">
      <h1>Customers</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Add Customer Section */}
      <Card className="card">
        <CardContent className="card-content">
          <h2>{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
          <form onSubmit={handleAddCustomer} className="form-container">
            <div className="form-group">
              <label className="form-label">Name</label>
              <TextBox
                name="name"
                placeholder="Enter customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <TextBox
                name="phone"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <TextBox
                name="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Only show the Total Debt field when adding a new customer (not when editing) */}
            {!editingCustomer && (
              <div className="form-group">
                <label className="form-label">Initial Debt</label>
                <TextBox
                  name="totalDebt"
                  type="number"
                  step="0.01" // Add step attribute to handle decimal values properly
                  placeholder="Enter initial debt"
                  value={totalDebt}
                  onChange={(e) => {
                    // Make sure we're handling the numeric input properly
                    const value = e.target.value;
                    console.log('Setting debt value:', value);
                    setTotalDebt(value);
                  }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Last Transaction Date</label>
              <TextBox
                name="createdAt"
                type="date"
                value={createdAt}
                onChange={(e) => setcreatedAt(e.target.value)}
              />
            </div>

            <div className="form-buttons">
              <Button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (editingCustomer ? "Updating..." : "Adding...")
                  : (editingCustomer ? "Update Customer" : "Add Customer")}
              </Button>

              {editingCustomer && (
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

      {/* Customers List */}
      <Card className="card">
        <CardContent className="card-content">
          <h2>Customers List</h2>

          {isLoading ? (
            <div className="loading-message">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="empty-message">No customers found. Add a customer to get started.</div>
          ) : (
            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Total Debt</th>
                    <th>Last Transaction</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{customer.address || "-"}</td>
                      <td className={parseFloat(customer.totalDebt?.toString() || "0") > 0 ? "text-red-600" : "text-green-600"}>
                        {customer.totalDebt || 0}
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <Button
                          size="sm"
                          className="button button-primary"
                          onClick={() => handleEdit(customer)}
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="button button-danger"
                          onClick={() => handleDelete(customer.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}