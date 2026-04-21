/**
 * Asia/Seoul 기준 날짜 유틸리티
 */

/**
 * 오늘 날짜를 Asia/Seoul 기준으로 반환 (YYYY-MM-DD)
 */
export function getTodayAsiaSeoul(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
}

/**
 * Date 객체를 Asia/Seoul 기준 YYYY-MM-DD 문자열로 변환
 */
export function formatDateAsiaSeoul(date: Date): string {
  return date.toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
}
