"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, Loader2, Image as ImageIcon, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

export interface UploadResult {
  url: string;
  fileId: string;
  fileType: string;
  thumbnailUrl?: string;
}

export interface MediaUploaderProps {
  accept: "image" | "video";
  maxFileSize: number; // bytes (10MB = 10485760, 100MB = 104857600)
  onUploadComplete: (result: UploadResult) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function MediaUploader({
  accept,
  maxFileSize,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const acceptedTypes = accept === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const acceptedExtensions =
    accept === "image" ? "jpg, png, gif, webp" : "mp4, webm, mov";
  const Icon = accept === "image" ? ImageIcon : Video;

  const handleUpload = useCallback(
    async (file: File) => {
      // Client-side validation before base64 encoding
      if (file.size > maxFileSize) {
        onUploadError(
          `File too large. Maximum size is ${formatFileSize(maxFileSize)}`
        );
        return;
      }

      setIsUploading(true);
      setUploadingFileName(file.name);

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        // POST to upload API
        const response = await api.post("/upload", {
          file: base64,
          fileName: file.name,
          folder: "/products",
        });

        const data = response.data?.data || response.data;

        onUploadComplete({
          url: data.url,
          fileId: data.fileId,
          fileType: data.fileType,
          thumbnailUrl: data.thumbnailUrl,
        });
      } catch (error: any) {
        console.error("Upload failed:", error);
        onUploadError(
          error?.response?.data?.error?.message ||
            error?.message ||
            "Upload failed. Please try again."
        );
      } finally {
        setIsUploading(false);
        setUploadingFileName(null);
      }
    },
    [maxFileSize, onUploadComplete, onUploadError]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle rejections
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const error = rejection.errors[0];

        if (error.code === "file-too-large") {
          onUploadError(
            `File too large. Maximum size is ${formatFileSize(maxFileSize)}`
          );
        } else if (error.code === "file-invalid-type") {
          onUploadError(
            `Invalid file type. Accepted: ${acceptedExtensions}`
          );
        } else {
          onUploadError(error.message);
        }
        return;
      }

      // Upload the first accepted file
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    [handleUpload, maxFileSize, acceptedExtensions, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: acceptedTypes,
      maxSize: maxFileSize,
      multiple: false,
      disabled: disabled || isUploading,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive &&
          !isDragReject &&
          "border-muted-foreground/25 hover:border-muted-foreground/50",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Uploading...</p>
              {uploadingFileName && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {uploadingFileName}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive
                  ? isDragReject
                    ? "Invalid file type"
                    : "Drop to upload"
                  : `Drag & drop ${accept} or click to browse`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedExtensions} • Max {formatFileSize(maxFileSize)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
