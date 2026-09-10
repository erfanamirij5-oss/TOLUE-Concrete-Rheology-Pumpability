import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const pipelineSource = readFileSync(new URL('./pipelineView.ts', import.meta.url), 'utf8');
const pumpSource = readFileSync(new URL('./pumpView.ts', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('./applicationShell.ts', import.meta.url), 'utf8');

describe('pipeline and pump input UX wiring', () => {
  it('renders editable pipeline and pump input workspaces from the session input', () => {
    expect(pipelineSource).toContain("aria-label','ورودی‌های مسیر'");
    expect(pumpSource).toContain("aria-label','ورودی‌های قابلیت پمپ'");
    expect(shellSource).toContain('renderPipelineView(content');
    expect(shellSource).toContain('renderPumpView(content');
    expect(shellSource).toContain('updateInput:updateSessionInput');
  });

  it('keeps engineering calculation ownership out of the renderer views', () => {
    expect(pipelineSource).not.toContain('analyzePipeline(');
    expect(pumpSource).not.toContain('assessPumpCapability(');
    expect(pumpSource).not.toContain('availablePressureAtFlow(');
  });
});
