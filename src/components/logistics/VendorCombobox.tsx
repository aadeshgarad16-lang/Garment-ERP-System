import React, { useState, useRef, useEffect } from 'react';

interface Vendor {
  id?: string | number;
  name?: string;
  vendorName?: string;
  transportCompany?: string;
  vehicleNumber?: string;
  deliveryIdPrefix?: string;
  [key: string]: any;
}

interface VendorComboboxProps {
  vendors: Vendor[];
  value: any; // We'll pass the whole vendor object or just use string typing if custom
  onChange: (vendor: any) => void;
  placeholder?: string;
}

export default function VendorCombobox({ vendors, value, onChange, placeholder = "Enter vendor name" }: VendorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external value if it changes
  useEffect(() => {
    if (value && typeof value === 'object') {
      setQuery(value.name || value.vendorName || '');
    } else if (typeof value === 'string') {
      setQuery(value);
    } else {
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayName = (v: Vendor) => v.name || v.vendorName || '';

  const filteredVendors = query === '' 
    ? vendors 
    : vendors.filter((vendor) => {
        return getDisplayName(vendor).toLowerCase().includes(query.toLowerCase());
      });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    
    // Pass custom string object or try to match
    const matchedVendor = vendors.find(v => getDisplayName(v).toLowerCase() === val.toLowerCase());
    if (matchedVendor) {
      onChange(matchedVendor);
    } else {
      // If it's a custom typed name, create a dummy object so validation and ID gen works
      onChange({ name: val, vendorName: val });
    }
  };

  const handleSelect = (vendor: Vendor) => {
    setQuery(getDisplayName(vendor));
    onChange(vendor);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-slate-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && filteredVendors.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredVendors.map((vendor, idx) => (
            <button
              key={vendor.id || idx}
              type="button"
              onClick={() => handleSelect(vendor)}
              className="w-full text-left px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            >
              {getDisplayName(vendor)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
