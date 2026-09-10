import { describe, expect, it } from 'vitest';
import { validateTextFieldValue } from './inputField';

describe('text field UX validation', () => {
  it('rejects missing required values with user-facing Persian copy', () => {
    expect(validateTextFieldValue('   ', { id: 'x', label: 'نام پروژه', required: true })).toBe('نام پروژه الزامی است.');
  });

  it('accepts optional empty values', () => {
    expect(validateTextFieldValue('', { id: 'x', label: 'کارفرما' })).toBeNull();
  });

  it('enforces presentation-level maximum length without engineering inference', () => {
    expect(validateTextFieldValue('123456', { id: 'x', label: 'کد پروژه', maxLength: 5 })).toBe('کد پروژه نباید بیشتر از 5 نویسه باشد.');
  });
});
