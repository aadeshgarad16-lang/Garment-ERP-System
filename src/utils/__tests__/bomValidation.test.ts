import { validateCategorySleeve, getDefaultSleeve, resolveGarmentSleeve } from '../bomValidation';

describe('BOM Validation - Category to Sleeve rules', () => {

  describe('validateCategorySleeve', () => {
    it('should validate correctly for Shirt', () => {
      expect(validateCategorySleeve('Shirt', 'Full Sleeve')).toBe(true);
      expect(validateCategorySleeve('Shirt', 'Half Sleeve')).toBe(true);
      expect(validateCategorySleeve('Shirt', 'Sleeveless')).toBe(false);
    });

    it('should validate correctly for Pant', () => {
      expect(validateCategorySleeve('Pant', 'Full Sleeve')).toBe(true);
      expect(validateCategorySleeve('Pant', 'Half Sleeve')).toBe(false);
    });
    
    it('should validate correctly for T-Shirt', () => {
      expect(validateCategorySleeve('T-Shirt', 'Half Sleeve')).toBe(true);
      expect(validateCategorySleeve('T-Shirt', 'Full Sleeve')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(validateCategorySleeve('shirt', 'half sleeve')).toBe(true);
      expect(validateCategorySleeve('PANT', 'FULL SLEEVE')).toBe(true);
    });
    
    it('should return true for unknown categories', () => {
      expect(validateCategorySleeve('UnknownCategory', 'Any Sleeve')).toBe(true);
    });
  });

  describe('getDefaultSleeve', () => {
    it('should return default for single-sleeve categories', () => {
      expect(getDefaultSleeve('Pant')).toBe('Full Sleeve');
      expect(getDefaultSleeve('T-Shirt')).toBe('Half Sleeve');
    });

    it('should return null for multi-sleeve categories', () => {
      expect(getDefaultSleeve('Shirt')).toBeNull();
    });
    
    it('should return null for unknown categories', () => {
      expect(getDefaultSleeve('UnknownCategory')).toBeNull();
    });
  });

  describe('resolveGarmentSleeve', () => {
    it('should resolve to matched sleeve when provided and valid', () => {
      expect(resolveGarmentSleeve('Shirt', 'half sleeve')).toBe('Half Sleeve');
    });

    it('should fallback to default when not provided for fixed categories', () => {
      expect(resolveGarmentSleeve('Pant')).toBe('Full Sleeve');
      expect(resolveGarmentSleeve('T-Shirt', '')).toBe('Half Sleeve');
      expect(resolveGarmentSleeve('T-Shirt', null)).toBe('Half Sleeve');
    });

    it('should throw error when sleeve is invalid', () => {
      expect(() => resolveGarmentSleeve('Pant', 'Half Sleeve')).toThrow('Invalid sleeve type "Half Sleeve" for category "Pant"');
    });

    it('should throw error when missing for multi-sleeve category', () => {
      expect(() => resolveGarmentSleeve('Shirt')).toThrow('Sleeve type is required for category "Shirt"');
    });
  });
});
