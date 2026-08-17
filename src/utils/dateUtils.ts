export const formatIndianDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput || dateInput === 'N/A' || dateInput === 'TBD') return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Alias for backwards compatibility, though we will try to replace usages.
export const formatDateDisplay = formatIndianDate;
