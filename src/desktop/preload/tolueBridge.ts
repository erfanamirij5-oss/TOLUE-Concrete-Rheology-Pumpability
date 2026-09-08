import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import { ENGINEERING_PDF_EXPORT_CHANNEL, type EngineeringPdfIpcResponse } from '../ipc/engineeringPdfIpc';

export interface TolueBridge {
  exportEngineeringPdf(request: EngineeringPdfExportRequest): Promise<EngineeringPdfIpcResponse>;
}
export function createTolueBridge(invoke: (channel: string, payload: unknown) => Promise<EngineeringPdfIpcResponse>): Readonly<TolueBridge> {
  return Object.freeze({
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => invoke(ENGINEERING_PDF_EXPORT_CHANNEL, {
      channel: ENGINEERING_PDF_EXPORT_CHANNEL, payload: request,
    }),
  });
}
