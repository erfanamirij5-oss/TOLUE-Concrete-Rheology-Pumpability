import { describe, expect, it, vi } from 'vitest';
import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { TolueBridge } from '../preload/tolueBridge';
import { createRendererPlatform } from './index';

const request: EngineeringPdfExportRequest = {
  runId: 'run-renderer', engineVersion: 'v1', inputSnapshotHash: 'hash-renderer', fileName: 'report.pdf',
  html: '<html dir="rtl">گزارش</html>', mediaType: 'application/pdf', sourceMediaType: 'text/html',
  rendererBoundary: 'privileged_desktop_main_process', scientificClaim: 'presentation_only_no_new_engineering_inference',
  method: 'tolue-engineering-pdf-export-request-v1',
  page: { format: 'A4', landscape: false, printBackground: true, preferCssPageSize: true, displayHeaderFooter: false,
    marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
};

describe('renderer application boundary', () => {
  it('exposes only the allowed PDF operation and preserves the request identity', async () => {
    const exportEngineeringPdf = vi.fn().mockResolvedValue({
      runId: request.runId, engineVersion: request.engineVersion, inputSnapshotHash: request.inputSnapshotHash,
      status: 'CANCELLED', savedFileName: null, bytesWritten: null, errorCode: null,
      method: 'tolue-engineering-pdf-ipc-response-v1',
    });
    const bridge: Readonly<TolueBridge> = Object.freeze({ exportEngineeringPdf });
    const platform = createRendererPlatform(bridge);
    expect(Object.keys(platform)).toEqual(['exportEngineeringPdf']);
    expect(Object.isFrozen(platform)).toBe(true);
    const snapshot = structuredClone(request);
    const result = await platform.exportEngineeringPdf(request);
    expect(exportEngineeringPdf).toHaveBeenCalledWith(request);
    expect(request).toEqual(snapshot);
    expect(result).toMatchObject({ status: 'CANCELLED', runId: 'run-renderer', engineVersion: 'v1', inputSnapshotHash: 'hash-renderer' });
  });

  it('fails closed when the preload bridge operation is unavailable', () => {
    expect(() => createRendererPlatform({} as Readonly<TolueBridge>)).toThrow('RENDERER-BRIDGE-001');
  });
});
