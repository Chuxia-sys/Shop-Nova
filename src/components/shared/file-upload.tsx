"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  onUploadComplete?: (result: { url: string; publicId: string }) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  publicId?: string;
  error?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  folder = "ecommerce",
  maxFiles = 5,
  maxSizeMB = 5,
  accept = "image/*",
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validateFile = (file: File): string | null => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          return `File "${file.name}" exceeds ${maxSizeMB}MB limit`;
        }
        if (!file.type.startsWith("image/") && accept === "image/*") {
          return `File "${file.name}" is not an image`;
        }
        return null;
      };

      const fileArray = Array.from(newFiles);
      const remaining = maxFiles - files.length;

      if (fileArray.length > remaining) {
        fileArray.splice(remaining);
      }

      const validFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          validFiles.push({
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            status: "error",
            error,
          });
          continue;
        }
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, maxFiles, maxSizeMB, accept]
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile, index: number) => {
    if (uploadedFile.status === "error") return;

    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading" as const, progress: 0 } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        }
      });

      const result = await new Promise<{ url: string; publicId: string }>(
        (resolve, reject) => {
          xhr.open("POST", "/api/upload");
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(formData);
        }
      );

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                progress: 100,
                status: "success" as const,
                url: result.url,
                publicId: result.publicId,
              }
            : f
        )
      );

      onUploadComplete?.(result);
    } catch {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "error" as const, error: "Upload failed" }
            : f
        )
      );
      onUploadError?.("Upload failed");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = () => {
    files.forEach((file, index) => {
      if (file.status === "pending") {
        uploadFile(file, index);
      }
    });
  };

  const hasFilesToUpload = files.some((f) => f.status === "pending");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse ({maxFiles} max, {maxSizeMB}MB each)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload files"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg border bg-card p-3 shadow-sm"
            >
              {/* Preview */}
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileImage className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {file.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {file.status === "uploading" && (
                  <Progress
                    value={file.progress}
                    className="mt-1 h-1.5"
                  />
                )}
                {file.status === "error" && file.error && (
                  <p className="mt-1 text-xs text-destructive">{file.error}</p>
                )}
              </div>

              {/* Status / Actions */}
              <div className="flex items-center gap-2">
                {file.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {file.status === "uploading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${file.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Upload button */}
          {hasFilesToUpload && (
            <Button onClick={uploadAll} className="w-full">
              Upload {files.filter((f) => f.status === "pending").length} file
              {files.filter((f) => f.status === "pending").length !== 1
                ? "s"
                : ""}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
