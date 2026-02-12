/**
 * 사용자 대시보드 - /app
 * 로그인한 사용자의 오늘 일일 기록 (식단 사진, 운동 체크, 제출)
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTodayAsiaSeoul } from "@/lib/date-utils";
import { UserDashboard } from "./UserDashboard";
import type { Database } from "@/lib/database.types";

type UsersProfile = Database["public"]["Tables"]["users_profile"]["Row"];
type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];

export default async function AppPage() {
  const supabase = await createClient();

  // 1) 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = getTodayAsiaSeoul();

  // 2) users_profile 조회 또는 생성
  let profile: UsersProfile | null = null;
  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    profile = existingProfile;
  } else {
    const { data: newProfile, error: insertProfileError } = await supabase
      .from("users_profile")
      .insert({
        id: user.id,
        required_diet_photos: 1,
      })
      .select()
      .single();

    if (insertProfileError) {
      // 동시 요청 등으로 이미 생성된 경우 재조회
      const { data: retry } = await supabase
        .from("users_profile")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = retry;
    } else {
      profile = newProfile;
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 3) 오늘 daily_log 조회 또는 생성
  let dailyLog: DailyLog | null = null;
  const { data: existingLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .single();

  if (existingLog) {
    dailyLog = existingLog;
  } else {
    const { data: newLog, error: insertLogError } = await supabase
      .from("daily_logs")
      .insert({
        user_id: user.id,
        log_date: today,
        status: "pending",
        diet_photos: [],
        workout_checked: false,
      })
      .select()
      .single();

    if (insertLogError) {
      const { data: retry } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .single();
      dailyLog = retry;
    } else {
      dailyLog = newLog;
    }
  }

  if (!dailyLog) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">일일 기록을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <UserDashboard
      userId={user.id}
      profile={profile}
      dailyLog={dailyLog}
      today={today}
    />
  );
}
