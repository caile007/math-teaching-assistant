"use client";

import type { Problem } from "@/types";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  onUploadComplete: (problem: Problem) => void;
}

export function PhotoUploader({ onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("photo", file);

          const res = await fetch("/api/problems", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "上传失败");
          }

          const data = await res.json();
          toast.success("错题识别完成");
          onUploadComplete(data.problem);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "上传失败");
        } finally {
          setUploading(false);
        }
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 bg-white"
      } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-3">
        {uploading ? "⏳" : "📸"}
      </div>
      <p className="text-gray-600 mb-2">
        {uploading
          ? "正在识别题目中..."
          : isDragActive
          ? "松开鼠标上传照片"
          : "拖拽照片到这里，或点击选择"}
      </p>
      <p className="text-xs text-gray-400">
        支持 JPG/PNG/WebP，单张不超过 10MB
      </p>
      {!uploading && (
        <Button variant="outline" size="sm" className="mt-3" type="button">
          选择文件
        </Button>
      )}
    </div>
  );
}
