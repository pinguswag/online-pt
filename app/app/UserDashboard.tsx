"use client";

/**
 * 사용자 대시보드 - 클라이언트 인터랙션
 * 식단 사진 업로드, 운동 체크, 제출 버튼
 */
import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { PhotoSlot } from "./PhotoSlot";
import type { Database } from "@/lib/database.types";

type UsersProfile = Database["public"]["Tables"]["users_profile"]["Row"];
type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];

interface UserDashboardProps {
  userId: string;
  profile: UsersProfile;
  dailyLog: DailyLog;
  today: string;
}

export function UserDashboard({
  userId,
  profile,
  dailyLog: initialLog,
  today,
}: UserDashboardProps) {
  const router = useRouter();
  const [dailyLog, setDailyLog] = useState(initialLog);
  const [uploading, setUploading] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredCount = profile.required_diet_photos ?? 1;
  const photos = dailyLog.diet_photos ?? [];
  const photoCount = photos.filter(Boolean).length;
  const canSubmit =
    photoCount >= requiredCount &&
    (dailyLog.workout_checked ?? false) &&
    dailyLog.status !== "submitted";

  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handleUpload(slotIndex: number, file: File) {
    setError(null);
    setUploading(slotIndex);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const random = crypto.randomUUID().slice(0, 8);
    const path = `${userId}/${today}/${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("diet-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(null);
      return;
    }

    const pathsToStore = [...(dailyLog.diet_photos ?? [])];
    while (pathsToStore.length <= slotIndex) {
      pathsToStore.push("");
    }
    pathsToStore[slotIndex] = path;

    const { error: updateError } = await supabase
      .from("daily_logs")
      .update({ diet_photos: pathsToStore })
      .eq("id", dailyLog.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDailyLog((prev) => ({
        ...prev,
        diet_photos: pathsToStore,
      }));
    }

    setUploading(null);
    refreshData();
  }

  async function handleWorkoutChange(checked: boolean) {
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("daily_logs")
      .update({ workout_checked: checked })
      .eq("id", dailyLog.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDailyLog((prev) => ({ ...prev, workout_checked: checked }));
    refreshData();
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("daily_logs")
      .update({ status: "submitted" })
      .eq("id", dailyLog.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setDailyLog((prev) => ({ ...prev, status: "submitted" }));

    // 축하 confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setSubmitting(false);
    refreshData();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Progress Header */}
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            오늘의 기록
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {today}
          </p>
          <div
            className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
              dailyLog.status === "submitted"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {dailyLog.status === "submitted" ? "제출 완료" : "대기 중"}
          </div>
        </header>

        {dailyLog.status === "submitted" && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            오늘의 기록을 제출했습니다!
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Diet Photo Slots */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            식단 사진 ({photoCount}/{requiredCount})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: requiredCount }).map((_, i) => (
              <PhotoSlot
                key={i}
                index={i}
                path={photos[i]}
                uploading={uploading === i}
                disabled={dailyLog.status === "submitted"}
                onUpload={(file) => handleUpload(i, file)}
              />
            ))}
          </div>
        </section>

        {/* Workout Checkbox */}
        <section className="mb-8">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={dailyLog.workout_checked ?? false}
              onChange={(e) => handleWorkoutChange(e.target.checked)}
              disabled={dailyLog.status === "submitted"}
              className="h-5 w-5 rounded border-zinc-300"
            />
            <span className="font-medium text-zinc-900 dark:text-white">
              운동 완료
            </span>
          </label>
        </section>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {submitting ? "제출 중..." : "오늘 기록 제출"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          식단 사진 {requiredCount}장과 운동 완료 체크가 필요합니다.
        </p>
      </div>
    </div>
  );
}
