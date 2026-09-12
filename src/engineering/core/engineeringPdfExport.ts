import { EngineeringReportExportBundle } from './engineeringReportExport';

export type EngineeringReportTextFormat = 'html' | 'json';

export interface EngineeringPdfPageSpec {
  format: 'A4';
  landscape: false;
  printBackground: true;
  preferCssPageSize: true;
  displayHeaderFooter: false;
  marginsMm: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface EngineeringPdfExportRequest {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  fileName: string;
  html: string;
  mediaType: 'application/pdf';
  sourceMediaType: 'text/html';
  page: EngineeringPdfPageSpec;
  rendererBoundary: 'privileged_desktop_main_process';
  scientificClaim: 'presentation_only_no_new_engineering_inference';
  method: 'tolue-engineering-pdf-export-request-v1';
}

export interface EngineeringReportTextExportRequest {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  fileName: string;
  content: string;
  format: EngineeringReportTextFormat;
  mediaType: 'text/html' | 'application/json';
  encoding: 'utf-8';
  rendererBoundary: 'privileged_desktop_main_process';
  scientificClaim: 'presentation_only_no_new_engineering_inference';
  method: 'tolue-engineering-report-text-export-request-v1';
}

export type EngineeringReportExportRequest = EngineeringPdfExportRequest | EngineeringReportTextExportRequest;

function safeFileToken(value: string): string {
  const normalized = value.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'run';
}

/**
 * Builds a deterministic PDF render request for the privileged desktop layer.
 * The Engineering Core intentionally does not write files, spawn browsers, or
 * import Electron. A desktop adapter may later execute this contract via a
 * trusted main-process PDF API. No engineering inference occurs here.
 */
export function buildEngineeringPdfExportRequest(
  bundle: EngineeringReportExportBundle,
): EngineeringPdfExportRequest {
  if (bundle.html.mediaType !== 'text/html') throw new Error('PDF export requires HTML report source');
  if (!bundle.html.content.trim()) throw new Error('PDF export HTML source must not be empty');
  if (!bundle.inputSnapshotHash.trim()) throw new Error('PDF export inputSnapshotHash must not be empty');

  return {
    runId: bundle.runId,
    engineVersion: bundle.engineVersion,
    inputSnapshotHash: bundle.inputSnapshotHash,
    fileName: `TOLUE-Engineering-Report-${safeFileToken(bundle.runId)}.pdf`,
    html: bundle.html.content,
    mediaType: 'application/pdf',
    sourceMediaType: 'text/html',
    page: {
      format: 'A4',
      landscape: false,
      printBackground: true,
      preferCssPageSize: true,
      displayHeaderFooter: false,
      marginsMm: { top: 5, right: 5, bottom: 5, left: 5 },
    },
    rendererBoundary: 'privileged_desktop_main_process',
    scientificClaim: 'presentation_only_no_new_engineering_inference',
    method: 'tolue-engineering-pdf-export-request-v1',
  };
}

/** Builds a privileged save request for the already-generated report HTML/JSON payload. */
export function buildEngineeringReportTextExportRequest(
  bundle: EngineeringReportExportBundle,
  format: EngineeringReportTextFormat,
): EngineeringReportTextExportRequest {
  if (!bundle.inputSnapshotHash.trim()) throw new Error('Report export inputSnapshotHash must not be empty');
  const token = safeFileToken(bundle.runId);
  const source = format === 'html' ? bundle.html : bundle.json;
  if (!source.content.trim()) throw new Error('Report export content must not be empty');
  return {
    runId: bundle.runId,
    engineVersion: bundle.engineVersion,
    inputSnapshotHash: bundle.inputSnapshotHash,
    fileName: `TOLUE-Engineering-Report-${token}.${format}`,
    content: source.content,
    format,
    mediaType: source.mediaType,
    encoding: 'utf-8',
    rendererBoundary: 'privileged_desktop_main_process',
    scientificClaim: 'presentation_only_no_new_engineering_inference',
    method: 'tolue-engineering-report-text-export-request-v1',
  };
}
