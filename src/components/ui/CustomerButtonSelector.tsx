import React, { useState } from "react";
import "./CustomerButtonSelector.css";

interface CustomerButtonSelectorProps {
  customers: { id: number; name: string }[];
  selectedCustomer: string;
  onSelect: (name: string, id: number) => void;
  showAllCustomers?: boolean;
}

const CustomerButtonSelector: React.FC<CustomerButtonSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  showAllCustomers = false,
}) => {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="customer-selector">
      <input
        className="customer-search"
        type="text"
        placeholder="Search customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="customer-buttons">
        {showAllCustomers && (
          <button
            className={`customer-btn${selectedCustomer === "" ? " selected" : ""}`}
            onClick={() => onSelect("", -1)}
            type="button"
          >
            All Customers
          </button>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            className={`customer-btn${selectedCustomer === c.name ? " selected" : ""}`}
            onClick={() => onSelect(c.name, c.id)}
            type="button"
          >
            {c.name}
          </button>
        ))}
        {filtered.length === 0 && <div className="no-customers">No customers found.</div>}
      </div>
    </div>
  );
};

export default CustomerButtonSelector;
