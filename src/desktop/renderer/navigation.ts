export const TOLUE_SECTIONS = Object.freeze([
  { id: 'project', label: 'پروژه' },
  { id: 'materials', label: 'مصالح' },
  { id: 'rheology', label: 'رئولوژی' },
  { id: 'pipeline', label: 'خط لوله' },
  { id: 'pump', label: 'پمپ' },
  { id: 'evidence', label: 'شواهد' },
  { id: 'visualization', label: 'نمایش سه‌بعدی' },
  { id: 'results', label: 'نتایج' },
  { id: 'diagnostics', label: 'عیب‌یابی' },
  { id: 'report', label: 'گزارش' },
] as const);
export type TolueSectionId = (typeof TOLUE_SECTIONS)[number]['id'];
export interface RendererNavigationState { readonly activeSection: TolueSectionId; }
export function createNavigationState(activeSection: TolueSectionId = 'project'): Readonly<RendererNavigationState> { return Object.freeze({ activeSection }); }
export function isTolueSectionId(value: string): value is TolueSectionId { return TOLUE_SECTIONS.some(section => section.id === value); }
