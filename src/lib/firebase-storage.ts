import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  type UploadResult,
  type StorageReference,
} from "firebase/storage";
import { storage } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadResultType {
  url: string;
  path: string;
}

export type AllowedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/avif";

export const ALLOWED_MIME_TYPES: AllowedFileType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ---------------------------------------------------------------------------
// Upload from Blob/File
// ---------------------------------------------------------------------------

export async function uploadFile(
  file: File | Blob,
  folder: string = "uploads",
  fileName?: string
): Promise<UploadResultType> {
  const ext = fileName
    ? fileName.split(".").pop()
    : (file instanceof File ? file.name.split(".").pop() : "jpg") || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const fullPath = `${folder}/${uniqueName}`;
  const storageRef = ref(storage, fullPath);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);

  return { url, path: fullPath };
}

// ---------------------------------------------------------------------------
// Upload from Base64 data URI
// ---------------------------------------------------------------------------

export async function uploadFromBase64(
  dataUri: string,
  folder: string = "uploads",
  fileName?: string
): Promise<UploadResultType> {
  const ext = fileName
    ? fileName.split(".").pop()
    : dataUri.split(";")[0].split("/").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const fullPath = `${folder}/${uniqueName}`;
  const storageRef = ref(storage, fullPath);

  const snapshot = await uploadString(storageRef, dataUri, "data_url");
  const url = await getDownloadURL(snapshot.ref);

  return { url, path: fullPath };
}

// ---------------------------------------------------------------------------
// Upload from Buffer (server-side)
// ---------------------------------------------------------------------------

export async function uploadFromBuffer(
  buffer: ArrayBuffer,
  mimeType: string,
  folder: string = "uploads",
  fileName?: string
): Promise<UploadResultType> {
  const ext = fileName
    ? fileName.split(".").pop()
    : mimeType.split("/").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const fullPath = `${folder}/${uniqueName}`;
  const storageRef = ref(storage, fullPath);

  const blob = new Blob([buffer], { type: mimeType });
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);

  return { url, path: fullPath };
}

// ---------------------------------------------------------------------------
// Delete file
// ---------------------------------------------------------------------------

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// ---------------------------------------------------------------------------
// Delete files by URL (extracts path from download URL)
// ---------------------------------------------------------------------------

export async function deleteFileByUrl(downloadUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Failed to delete file by URL:", error);
  }
}

// ---------------------------------------------------------------------------
// List files in a folder
// ---------------------------------------------------------------------------

export async function listFiles(folder: string): Promise<string[]> {
  const folderRef = ref(storage, folder);
  const result = await listAll(folderRef);
  const urls = await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
  return urls;
}

// ---------------------------------------------------------------------------
// Get public URL for a storage path
// ---------------------------------------------------------------------------

export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

// ---------------------------------------------------------------------------
// Validate file type
// ---------------------------------------------------------------------------

export function isValidFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedFileType);
}

// ---------------------------------------------------------------------------
// Validate file size
// ---------------------------------------------------------------------------

export function isValidFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size <= maxSize;
}
