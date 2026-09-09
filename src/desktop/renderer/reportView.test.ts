import { describe, expect, it } from 'vitest';
import type { ReportExportPresentation } from './reportPresentation';
import { presentEngineeringPdfExportResponse } from './reportView';

const report = {
  runId: 'run-001',
  engineVersion: 'engine-1',
  inputSnapshotHash: 'hash-001',
} as unknown as ReportExportPresentation;

const baseResponse = {
  runId: 'run-001',
  engineVersion: 'engine-1',
  inputSnapshotHash: 'hash-001',
  method: 'tolue-engineering-pdf-ipc-response-v1',
};

describe('PDF export status presentation', () => {
  it('presents successful output with exact file evidence', () => {
    const result = presentEngineeringPdfExportResponse(report, {
      ...baseResponse,
      status: 'SUCCESS',
      savedFileName: 'tolue-run-001.pdf',
      bytesWritten: 2048,
      errorCode: null,
    });
    expect(result.status).toBe('SUCCESS');
    expect(result.message).toContain('tolue-run-001.pdf');
    expect(result.message).toContain('بایت');
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('distinguishes user cancellation from failure', () => {
    expect(presentEngineeringPdfExportResponse(report, {
      ...baseResponse, status: 'CANCELLED', savedFileName: null, bytesWritten: null, errorCode: null,
    }).status).toBe('CANCELLED');
    const failed = presentEngineeringPdfExportResponse(report, {
      ...baseResponse, status: 'FAILED', savedFileName: null, bytesWritten: null, errorCode: 'PDF-MAIN-EXECUTION-001',
    });
    expect(failed.status).toBe('FAILED');
    expect(failed.message).toContain('PDF-MAIN-EXECUTION-001');
  });

  it('surfaces privileged-boundary rejection without inventing run identity', () => {
    const rejected = presentEngineeringPdfExportResponse(report, {
      runId: '', engineVersion: '', inputSnapshotHash: '', status: 'REJECTED', savedFileName: null,
      bytesWritten: null, errorCode: 'PDF-IPC-BUSY-001', method: 'tolue-engineering-pdf-ipc-response-v1',
    });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.message).toContain('PDF-IPC-BUSY-001');
  });

  it('fails closed when a non-rejected response belongs to another run or hash', () => {
    expect(() => presentEngineeringPdfExportResponse(report, {
      ...baseResponse, runId: 'run-other', status: 'SUCCESS', savedFileName: 'other.pdf', bytesWritten: 10, errorCode: null,
    })).toThrow('REPORT-PDF-RESPONSE-IDENTITY-001');
    expect(() => presentEngineeringPdfExportResponse(report, {
      ...baseResponse, inputSnapshotHash: 'hash-other', status: 'FAILED', savedFileName: null, bytesWritten: null, errorCode: 'PDF-MAIN-EXECUTION-001',
    })).toThrow('REPORT-PDF-RESPONSE-IDENTITY-001');
  });

  it('rejects malformed success evidence', () => {
    expect(() => presentEngineeringPdfExportResponse(report, {
      ...baseResponse, status: 'SUCCESS', savedFileName: null, bytesWritten: null, errorCode: null,
    })).toThrow('REPORT-PDF-RESPONSE-SUCCESS-001');
  });
});
