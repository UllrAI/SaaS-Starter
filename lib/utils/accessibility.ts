/**
 * Accessibility utility functions and constants
 */

// Generate unique IDs for ARIA relationships
let idCounter = 0;
export function generateA11yId(prefix: string = "a11y"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// Format file size in a screen reader friendly way
export function formatFileSizeA11y(bytes: number): string {
  const units = ["bytes", "kilobytes", "megabytes", "gigabytes"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = unitIndex === 0 ? size.toString() : size.toFixed(1);
  return `${formattedSize} ${units[unitIndex]}`;
}

// Format file types for screen readers
export function formatFileTypesA11y(types: string[]): string {
  if (types.length === 0) return "all file types";
  if (types.length === 1) return types[0];
  if (types.length === 2) return `${types[0]} and ${types[1]}`;

  const lastType = types[types.length - 1];
  const otherTypes = types.slice(0, -1).join(", ");
  return `${otherTypes}, and ${lastType}`;
}

// Create accessible file upload instructions
export function createUploadInstructions({
  maxFiles,
  maxFileSize,
  acceptedFileTypes,
}: {
  maxFiles: number;
  maxFileSize: number;
  acceptedFileTypes?: string[];
}): string {
  const fileCountText = maxFiles === 1 ? "1 file" : `up to ${maxFiles} files`;
  const sizeText = formatFileSizeA11y(maxFileSize);
  const typeText = acceptedFileTypes
    ? formatFileTypesA11y(acceptedFileTypes)
    : "any file type";

  return `Upload ${fileCountText}. Maximum size per file: ${sizeText}. Accepted formats: ${typeText}.`;
}

// Screen reader friendly upload status messages
export const UPLOAD_MESSAGES = {
  dragEnter: "Drop zone activated. Release files to upload.",
  dragLeave: "Drop zone deactivated.",
  uploadStart: (fileName: string) => `Uploading ${fileName}`,
  uploadProgress: (fileName: string, percentage: number) =>
    `${fileName} upload progress: ${percentage}%`,
  uploadSuccess: (fileName: string) => `${fileName} uploaded successfully`,
  uploadError: (fileName: string, error: string) =>
    `Failed to upload ${fileName}. Error: ${error}`,
  fileRemoved: (fileName: string) => `Removed ${fileName}`,
  filesSelected: (count: number) =>
    count === 1 ? "1 file selected" : `${count} files selected`,
  validationError: (fileName: string, error: string) =>
    `Validation error for ${fileName}: ${error}`,
  fileLimitExceeded: (maxFiles: number) =>
    `Error: Cannot select more than ${maxFiles} file${maxFiles > 1 ? "s" : ""}.`,
} as const;

// Keyboard navigation helpers
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

export function handleActivationKey(
  event: React.KeyboardEvent,
  callback: () => void,
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}
