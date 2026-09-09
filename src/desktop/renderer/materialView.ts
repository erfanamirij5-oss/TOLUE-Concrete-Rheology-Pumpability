import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { createMaterialCardPresentation, type MaterialCardPresentation, type MaterialPresentationKind } from './materialPresentation';

const MATERIAL_KIND_LABELS: Readonly<Record<MaterialPresentationKind, string>> = Object.freeze({
  cement: 'سیمان',
  water: 'آب',
  fine_aggregate: 'سنگدانه ریز',
  coarse_aggregate: 'سنگدانه درشت',
  scm: 'مواد مکمل سیمانی',
  chemical_admixture: 'افزودنی شیمیایی',
  fiber: 'الیاف',
  other_addition: 'سایر افزودنی‌ها',
});

const EMPTY_MATERIALS: readonly MaterialCardPresentation[] = Object.freeze([
  createMaterialCardPresentation(
    { id: 'cement-placeholder', kind: 'cement', name: 'تعریف نشده', supplier: '—', source: '—', standardReference: '—' },
    [],
  ),
  createMaterialCardPresentation(
    { id: 'fine-aggregate-placeholder', kind: 'fine_aggregate', name: 'تعریف نشده', supplier: '—', source: '—', standardReference: '—' },
    [],
  ),
  createMaterialCardPresentation(
    { id: 'coarse-aggregate-placeholder', kind: 'coarse_aggregate', name: 'تعریف نشده', supplier: '—', source: '—', standardReference: '—' },
    [],
  ),
]);

export function renderMaterialsView(root: HTMLElement, materials: readonly MaterialCardPresentation[] = EMPTY_MATERIALS): void {
  root.replaceChildren();

  const notice = document.createElement('p');
  notice.textContent = 'این صفحه فقط داده‌های مصالح را نمایش می‌دهد. تبدیل واحد، مقدار پیش‌فرض، آستانه پذیرش و تفسیر مهندسی در Renderer انجام نمی‌شود.';
  notice.style.marginTop = '0';
  notice.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  root.appendChild(notice);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.lg;

  for (const material of materials) {
    const card = document.createElement('section');
    card.dataset.materialId = material.identity.id;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surface;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;

    const kind = document.createElement('div');
    kind.textContent = MATERIAL_KIND_LABELS[material.identity.kind];
    kind.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    kind.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;

    const name = document.createElement('h2');
    name.textContent = material.identity.name;
    name.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeLg;
    name.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;

    const metadata = document.createElement('dl');
    metadata.style.display = 'grid';
    metadata.style.gridTemplateColumns = 'auto 1fr';
    metadata.style.gap = `${TOLUE_DESIGN_TOKENS.spacing.xs} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
    metadata.style.margin = '0';

    const appendMetadata = (label: string, value: string): void => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      dt.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dd.style.margin = '0';
      metadata.append(dt, dd);
    };

    appendMetadata('تأمین‌کننده', material.identity.supplier);
    appendMetadata('منبع', material.identity.source);
    appendMetadata('مرجع استاندارد', material.identity.standardReference);

    card.append(kind, name, metadata);

    if (material.properties.length > 0) {
      const properties = document.createElement('div');
      properties.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
      properties.style.display = 'grid';
      properties.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
      for (const property of material.properties) {
        const row = document.createElement('div');
        row.dataset.propertyKey = property.key;
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
        const label = document.createElement('span');
        label.textContent = property.label;
        label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
        const value = document.createElement('strong');
        value.textContent = property.unit ? `${property.value} ${property.unit}` : property.value;
        row.append(label, value);
        properties.appendChild(row);
      }
      card.appendChild(properties);
    }

    grid.appendChild(card);
  }

  root.appendChild(grid);
}
