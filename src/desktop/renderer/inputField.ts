import { TOLUE_DESIGN_TOKENS } from './designSystem';

export interface TextFieldDefinition {
  readonly id: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly helperText?: string;
  readonly required?: boolean;
  readonly maxLength?: number;
}

export interface TextFieldControl {
  readonly wrapper: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly error: HTMLSpanElement;
  validate(): boolean;
}

export function validateTextFieldValue(value: string, definition: Readonly<TextFieldDefinition>): string | null {
  const normalized = value.trim();
  if (definition.required && normalized.length === 0) return `${definition.label} الزامی است.`;
  if (definition.maxLength !== undefined && normalized.length > definition.maxLength) return `${definition.label} نباید بیشتر از ${definition.maxLength} نویسه باشد.`;
  return null;
}

export function createTextField(definition: Readonly<TextFieldDefinition>): Readonly<TextFieldControl> {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'grid';
  wrapper.style.gap = TOLUE_DESIGN_TOKENS.spacing.xs;

  const label = document.createElement('label');
  label.htmlFor = definition.id;
  label.textContent = definition.required ? `${definition.label} *` : definition.label;
  label.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeMd;
  label.style.fontWeight = '600';

  const input = document.createElement('input');
  input.id = definition.id;
  input.name = definition.id;
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = definition.placeholder ?? '';
  input.required = Boolean(definition.required);
  if (definition.maxLength !== undefined) input.maxLength = definition.maxLength;
  input.style.fontFamily = 'inherit';
  input.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeMd;
  input.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  input.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  input.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  input.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  input.style.color = TOLUE_DESIGN_TOKENS.color.text;
  input.style.outline = 'none';

  const helper = document.createElement('small');
  helper.textContent = definition.helperText ?? '';
  helper.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  helper.style.minHeight = definition.helperText ? 'auto' : '0';

  const error = document.createElement('span');
  error.id = `${definition.id}-error`;
  error.setAttribute('role', 'alert');
  error.style.display = 'none';
  error.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
  error.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  input.setAttribute('aria-describedby', `${definition.id}-error`);

  const validate = (): boolean => {
    const message = validateTextFieldValue(input.value, definition);
    const invalid = message !== null;
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    input.style.borderColor = invalid ? TOLUE_DESIGN_TOKENS.color.statusCritical : TOLUE_DESIGN_TOKENS.color.border;
    error.textContent = message ?? '';
    error.style.display = invalid ? 'block' : 'none';
    return !invalid;
  };

  input.addEventListener('blur', validate);
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') validate();
  });
  input.addEventListener('focus', () => { input.style.boxShadow = `0 0 0 3px ${TOLUE_DESIGN_TOKENS.color.surfaceMuted}`; });
  input.addEventListener('blur', () => { input.style.boxShadow = 'none'; });

  wrapper.append(label, input);
  if (definition.helperText) wrapper.appendChild(helper);
  wrapper.appendChild(error);
  return Object.freeze({ wrapper, input, error, validate });
}
