import { EngineeringPdfIpcRequest, EngineeringPdfIpcResponse, validateEngineeringPdfIpcRequest } from '../ipc/engineeringPdfIpc';

export interface PrivilegedPdfRendererPort {
  renderHtmlToPdf(input: {
    html: string;
    page: EngineeringPdfIpcRequest['payload']['page'];
  }): Promise<Uint8Array>;
}

export interface PrivilegedSaveDialogPort {
  choosePdfDestination(suggestedFileName: string): Promise<{ cancelled: true } | { cancelled: false; absolutePath: string }>;
}

export interface PrivilegedFileWriterPort {
  writeFileExclusive(absolutePath: string, bytes: Uint8Array): Promise<void>;
}

export interface EngineeringPdfMainAdapterDeps {
  renderer: PrivilegedPdfRendererPort;
  saveDialog: PrivilegedSaveDialogPort;
  fileWriter: PrivilegedFileWriterPort;
}

function baseResponse(request: EngineeringPdfIpcRequest) {
  return {
    runId: request.payload.runId,
    inputSnapshotHash: request.payload.inputSnapshotHash,
    method: 'tolue-engineering-pdf-ipc-response-v1' as const,
  };
}

/**
 * Privileged desktop-main adapter. The renderer never supplies an absolute
 * filesystem path. Destination selection and file writing are owned by the
 * privileged main process through injected ports, which can be implemented by
 * Electron dialog/webContents/fs adapters later without coupling Core to them.
 */
export async function executeEngineeringPdfMainAdapter(
  request: EngineeringPdfIpcRequest,
  deps: EngineeringPdfMainAdapterDeps,
): Promise<EngineeringPdfIpcResponse> {
  try {
    validateEngineeringPdfIpcRequest(request);
  } catch (error) {
    return {
      ...baseResponse(request),
      status: 'REJECTED',
      savedFileName: null,
      bytesWritten: null,
      errorCode: error instanceof Error ? error.message : 'PDF-IPC-VALIDATION-UNKNOWN',
    };
  }

  const destination = await deps.saveDialog.choosePdfDestination(request.payload.fileName);
  if (destination.cancelled) {
    return {
      ...baseResponse(request),
      status: 'CANCELLED',
      savedFileName: null,
      bytesWritten: null,
      errorCode: null,
    };
  }

  try {
    const pdfBytes = await deps.renderer.renderHtmlToPdf({
      html: request.payload.html,
      page: request.payload.page,
    });
    if (pdfBytes.byteLength === 0) {
      return {
        ...baseResponse(request),
        status: 'FAILED',
        savedFileName: null,
        bytesWritten: 0,
        errorCode: 'PDF-MAIN-EMPTY-OUTPUT-001',
      };
    }

    await deps.fileWriter.writeFileExclusive(destination.absolutePath, pdfBytes);
    const normalizedName = destination.absolutePath.replace(/\\/g, '/').split('/').pop() ?? request.payload.fileName;
    return {
      ...baseResponse(request),
      status: 'SUCCESS',
      savedFileName: normalizedName,
      bytesWritten: pdfBytes.byteLength,
      errorCode: null,
    };
  } catch {
    return {
      ...baseResponse(request),
      status: 'FAILED',
      savedFileName: null,
      bytesWritten: null,
      errorCode: 'PDF-MAIN-EXECUTION-001',
    };
  }
}
