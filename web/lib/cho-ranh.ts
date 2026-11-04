"use client";
// PERF-2: hoãn việc KHÔNG cần để vẽ + hydrate trang (đo lường, kiểm tra tài khoản) tới khi người dùng thật sự
// tương tác (chạm / cuộn / phím) hoặc quá HAN_CHO_MS sau khi trang tải xong — để chúng không nằm trong
// Total Blocking Time (PostHog 97 KB, Supabase 68 KB, GTM + GA4 trước đây nạp ngay sau hydrate).
// Hạn chót vẫn có nên người không tương tác (đọc rồi đi) vẫn được đo, chỉ chậm vài giây.
const HAN_CHO_MS = 8000;
const SU_KIEN = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const;

let hua: Promise<void> | null = null;

/** Giải quyết khi: người dùng tương tác đầu tiên, HOẶC HAN_CHO_MS sau sự kiện load. Gọi nhiều lần cùng một lời hứa. */
export function choRanh(): Promise<void> {
  if (typeof window === "undefined") return new Promise(() => { /* máy chủ: không bao giờ chạy */ });
  hua ??= new Promise<void>((xong) => {
    let da = false;
    let hen: ReturnType<typeof setTimeout> | undefined;
    const chay = () => {
      if (da) return;
      da = true;
      if (hen) clearTimeout(hen);
      for (const s of SU_KIEN) window.removeEventListener(s, chay);
      xong();
    };
    for (const s of SU_KIEN) window.addEventListener(s, chay, { passive: true, once: true });
    const datHen = () => { hen = setTimeout(chay, HAN_CHO_MS); };
    if (document.readyState === "complete") datHen();
    else window.addEventListener("load", datHen, { once: true });
  });
  return hua;
}
