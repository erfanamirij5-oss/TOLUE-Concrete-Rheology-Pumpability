import { describe, expect, it } from 'vitest';
import { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import { buildEngineeringPdfIpcRequest } from '../ipc/engineeringPdfIpc';
import { executeEngineeringPdfMainAdapter } from './engineeringPdfMainAdapter';

function payload(): EngineeringPdfExportRequest {
  return {
    runId: 'RUN-001',
    engineVersion: '0.1.0',
    inputSnapshotHash: 'fnv1a32:12345678',
    fileName: 'TOLUE-Engineering-Report-RUN-001.pdf',
    html: '<html lang="fa" dir="rtl"><body>report</body></html>',
    mediaType: 'application/pdf',
    sourceMediaType: 'text/html',
    page: {
      format: 'A4',
      landscape: false,
      printBackground: true,
      preferCssPageSize: true,
      displayHeaderFooter: false,
      marginsMm: { top: 14, right: 14, bottom: 14, left: 14 },
    },
    rendererBoundary: 'privileged_desktop_main_process',
    scientificClaim: 'presentation_only_no_new_engineering_inference',
    method: 'tolue-engineering-pdf-export-request-v1',
  };
}

describe('engineering PDF IPC/main boundary', () => {
  it('renders and writes only after privileged destination selection', async () => {
    const writes: Array<{ path: string; bytes: number }> = [];
    const result = await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), {
      renderer: { renderHtmlToPdf: async () => new Uint8Array([1, 2, 3, 4]) },
      saveDialog: { choosePdfDestination: async () => ({ cancelled: false, absolutePath: '/safe/TOLUE-Engineering-Report-RUN-001.pdf' }) },
      fileWriter: { writeFileExclusive: async (path, bytes) => { writes.push({ path, bytes: bytes.byteLength }); } },
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.bytesWritten).toBe(4);
    expect(result.savedFileName).toBe('TOLUE-Engineering-Report-RUN-001.pdf');
    expect(writes).toEqual([{ path: '/safe/TOLUE-Engineering-Report-RUN-001.pdf', bytes: 4 }]);
  });

  it('does not render or write when user cancels destination selection', async () => {
    let rendered = false;
    let written = false;
    const result = await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), {
      renderer: { renderHtmlToPdf: async () => { rendered = true; return new Uint8Array([1]); } },
      saveDialog: { choosePdfDestination: async () => ({ cancelled: true }) },
      fileWriter: { writeFileExclusive: async () => { written = true; } },
    });

    expect(result.status).toBe('CANCELLED');
    expect(rendered).toBe(false);
    expect(written).toBe(false);
  });

  it('rejects filename path traversal before privileged work starts', async () => {
    const bad = payload();
    bad.fileName = '../escape.pdf';
    const result = await executeEngineeringPdfMainAdapter({ channel: 'tolue:engineering:pdf-export:v1', payload: bad }, {
      renderer: { renderHtmlToPdf: async () => new Uint8Array([1]) },
      saveDialog: { choosePdfDestination: async () => ({ cancelled: false, absolutePath: '/safe/x.pdf' }) },
      fileWriter: { writeFileExclusive: async () => undefined },
    });

    expect(result.status).toBe('REJECTED');
    expect(result.errorCode).toBe('PDF-IPC-FILENAME-002');
  });

  it('fails closed on empty renderer output and never writes it', async () => {
    let written = false;
    const result = await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), {
      renderer: { renderHtmlToPdf: async () => new Uint8Array() },
      saveDialog: { choosePdfDestination: async () => ({ cancelled: false, absolutePath: '/safe/report.pdf' }) },
      fileWriter: { writeFileExclusive: async () => { written = true; } },
    });

    expect(result.status).toBe('FAILED');
    expect(result.errorCode).toBe('PDF-MAIN-EMPTY-OUTPUT-001');
    expect(written).toBe(false);
  });
});
