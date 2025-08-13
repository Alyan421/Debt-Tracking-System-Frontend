
import "./SearchableDropdown.css";
import { useEffect, useRef, useState } from "react";

interface SearchableDropdownProps<T> {
  options: T[];
  label: keyof T;
  id: string;
  selectedVal: string | null;
  handleChange: (value: string | null) => void;
}

function SearchableDropdown<T>({
  options,
  label,
  id,
  selectedVal,
  handleChange,
}: SearchableDropdownProps<T>) {
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.addEventListener("click", toggle);
    return () => document.removeEventListener("click", toggle);
  }, []);

  const selectOption = (option: T) => {
    setQuery("");
    handleChange(String(option[label]));
    setIsOpen(false);
  };

  function toggle(e: MouseEvent | null) {
    setIsOpen(e?.target === inputRef.current);
  }

  const getDisplayValue = () => {
    if (query) return query;
    if (selectedVal) return selectedVal;
    return "";
  };

  const filter = (opts: T[]) => {
    return opts.filter((option) =>
      String(option[label]).toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <div className="dropdown">
      <div className="control">
        <div className="selected-value">
          <input
            ref={inputRef}
            type="text"
            value={getDisplayValue()}
            name="searchTerm"
            autoComplete="off"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            onChange={(e) => {
              setQuery(e.target.value);
              handleChange(null);
            }}
            onClick={() => setIsOpen(true)}
          />
        </div>
        <div
          className={`arrow ${isOpen ? "open" : ""}`}
          onClick={e => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
            if (!isOpen && inputRef.current) inputRef.current.focus();
          }}
          role="button"
          tabIndex={0}
          aria-label="Toggle dropdown"
        ></div>
      </div>

      <div className={`options ${isOpen ? "open" : ""}`}>
        {filter(options).map((option, index) => (
          <div
            onClick={() => selectOption(option)}
            className={`option ${
              String(option[label]) === selectedVal ? "selected" : ""
            }`}
            key={`${id}-${index}`}
          >
            {String(option[label])}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchableDropdown;
