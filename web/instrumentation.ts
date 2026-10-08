// Chạy một lần khi server khởi động (Next 15 bật sẵn instrumentation). Bật Sentry phía server nếu có DSN.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { khoiTaoGiamSat } = await import("./lib/giam-sat");
    await khoiTaoGiamSat();
  }
}
