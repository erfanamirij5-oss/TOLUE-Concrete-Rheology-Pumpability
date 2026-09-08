import { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';

export const ENGINEERING_PDF_EXPORT_CHANNEL = 'tolue:engineering:pdf-export:v1' as const;

export interface EngineeringPdfIpcRequest {
  channel: typeof ENGINEERING_PDF_EXPORT_CHANNEL;
  payload: EngineeringPdfExportRequest;
}

export type EngineeringPdfIpcStatus = 'SUCCESS' | 'CANCELLED' | 'FAILED' | 'REJECTED';

export interface EngineeringPdfIpcResponse {
  engineVersion: string;
  runId: string;
  inputSnapshotHash: string;
  status: EngineeringPdfIpcStatus;
  savedFileName: string | null;
  bytesWritten: number | null;
  errorCode: string | null;
  method: 'tolue-engineering-pdf-ipc-response-v1';
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Runtime validation at the renderer -> privileged-main trust boundary.
 * Renderer input may request only the fixed PDF operation described by the
 * Engineering Core contract. It cannot select an arbitrary IPC channel,
 * filesystem path, page geometry, media type, or execution boundary.
 */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateEngineeringPdfIpcRequest(request: unknown): asserts request is EngineeringPdfIpcRequest {
  if (!record(request) || !record(request.payload)) throw new Error('PDF-IPC-SHAPE-001');
  const allowed = ['runId', 'engineVersion', 'inputSnapshotHash', 'fileName', 'html', 'mediaType', 'sourceMediaType', 'page', 'rendererBoundary', 'scientificClaim', 'method'];
  if (Object.keys(request).some(key => !['channel', 'payload'].includes(key)) || Object.keys(request.payload).some(key => !allowed.includes(key))) throw new Error('PDF-IPC-SHAPE-001');
  if (!record(request.payload.page) || !record(request.payload.page.marginsMm)) throw new Error('PDF-IPC-SHAPE-001');
  if (typeof request.payload.fileName !== 'string') throw new Error('PDF-IPC-FILENAME-001');
  if (request.channel !== ENGINEERING_PDF_EXPORT_CHANNEL) throw new Error('PDF-IPC-CHANNEL-001');
  const payload = request.payload;
  if (!nonEmpty(payload.runId)) throw new Error('PDF-IPC-ID-001');
  if (!nonEmpty(payload.engineVersion)) throw new Error('PDF-IPC-ID-002');
  if (!nonEmpty(payload.inputSnapshotHash)) throw new Error('PDF-IPC-ID-003');
  if (!nonEmpty(payload.html)) throw new Error('PDF-IPC-HTML-001');
  if (payload.mediaType !== 'application/pdf' || payload.sourceMediaType !== 'text/html') throw new Error('PDF-IPC-MEDIA-001');
  if (payload.rendererBoundary !== 'privileged_desktop_main_process') throw new Error('PDF-IPC-BOUNDARY-001');
  if (payload.method !== 'tolue-engineering-pdf-export-request-v1') throw new Error('PDF-IPC-METHOD-001');
  if (payload.scientificClaim !== 'presentation_only_no_new_engineering_inference') throw new Error('PDF-IPC-CLAIM-001');
  if (typeof payload.fileName !== 'string' || !payload.fileName.endsWith('.pdf')) throw new Error('PDF-IPC-FILENAME-001');
  if (payload.fileName.includes('/') || payload.fileName.includes('\\') || payload.fileName.includes('..')) throw new Error('PDF-IPC-FILENAME-002');
  if (!record(payload.page) || !record(payload.page.marginsMm)) throw new Error('PDF-IPC-SHAPE-001');
  if (payload.fileName.includes(':') || /[<>"|?*\x00-\x1f]/.test(payload.fileName)) throw new Error('PDF-IPC-FILENAME-002');
  if (payload.page.format !== 'A4' || payload.page.landscape !== false) throw new Error('PDF-IPC-PAGE-001');
  if (payload.page.printBackground !== true || payload.page.preferCssPageSize !== true || payload.page.displayHeaderFooter !== false) throw new Error('PDF-IPC-PAGE-002');
  const margins = payload.page.marginsMm;
  for (const value of [margins.top, margins.right, margins.bottom, margins.left]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value !== 14) throw new Error('PDF-IPC-PAGE-003');
  }
}

export function buildEngineeringPdfIpcRequest(payload: EngineeringPdfExportRequest): EngineeringPdfIpcRequest {
  const request: EngineeringPdfIpcRequest = { channel: ENGINEERING_PDF_EXPORT_CHANNEL, payload };
  validateEngineeringPdfIpcRequest(request);
  return request;
}
