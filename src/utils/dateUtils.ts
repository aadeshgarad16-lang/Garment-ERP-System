export const formatDateDisplay = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  // Enforce dd/mm/yyyy format strictly
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
