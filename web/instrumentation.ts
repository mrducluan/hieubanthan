// Next 14: chạy một lần khi server khởi động (experimental.instrumentationHook). Bật Sentry phía server nếu có DSN.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { khoiTaoGiamSat } = await import("./lib/giam-sat");
    await khoiTaoGiamSat();
  }
}
