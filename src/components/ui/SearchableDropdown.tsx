
import "./SearchableDropdown.css";
import { useEffect, useRef, useState } from "react";

interface SearchableDropdownProps<T> {
  options: T[];
  label: keyof T;
  id: string;
  selectedVal: string | null;
  handleChange: (value: string | null) => void;
  disabled?: boolean;
}

function SearchableDropdown<T>({
  options,
  label,
  id,
  selectedVal,
  handleChange,
  disabled = false,
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
    <div className={`dropdown ${disabled ? 'disabled' : ''}`}>
      <div className="control">
        <div className="selected-value">
          <input
            ref={inputRef}
            type="text"
            value={getDisplayValue()}
            name="searchTerm"
            autoComplete="off"
            disabled={disabled}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            onChange={(e) => {
              if (!disabled) {
                setQuery(e.target.value);
                handleChange(null);
              }
            }}
            onClick={() => !disabled && setIsOpen(true)}
          />
        </div>
        <div
          className={`arrow ${isOpen ? "open" : ""}`}
          onClick={e => {
            if (!disabled) {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
              if (!isOpen && inputRef.current) inputRef.current.focus();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Toggle dropdown"
        ></div>
      </div>

      <div className={`options ${isOpen && !disabled ? "open" : ""}`}>
        {!disabled && filter(options).map((option, index) => (
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
