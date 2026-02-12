"use client";

/**
 * 식단 사진 슬롯 - 업로드 버튼 및 썸네일 프리뷰
 */
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";

interface PhotoSlotProps {
  index: number;
  path: string | undefined;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
}

export function PhotoSlot({
  index,
  path,
  uploading,
  disabled,
  onUpload,
}: PhotoSlotProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!path) {
      setPreviewUrl(null);
      return;
    }

    const supabase = createClient();
    supabase.storage
      .from("diet-photos")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        }
      });
  }, [path]);

  function handleClick() {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onUpload(file);
    }
    e.target.value = "";
  }

  return (
    <div
      onClick={handleClick}
      className={`aspect-square overflow-hidden rounded-lg border-2 border-dashed ${
        disabled
          ? "cursor-default border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          : "cursor-pointer border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
      } ${uploading ? "opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <span className="text-sm text-zinc-500">업로드 중...</span>
        </div>
      )}

      {!uploading && previewUrl && (
        <img
          src={previewUrl}
          alt={`식단 ${index + 1}`}
          className="h-full w-full object-cover"
        />
      )}

      {!uploading && !previewUrl && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="text-3xl">📷</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {disabled ? "업로드 완료" : "사진 추가"}
          </span>
        </div>
      )}
    </div>
  );
}
