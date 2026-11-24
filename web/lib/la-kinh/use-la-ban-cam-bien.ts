"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { hopNhatLaBan, type KetQuaHopNhat, type MauCamBien } from "@/lib/la-kinh/hop-nhat";

type SuKienLaBan = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};
type CoXinQuyen = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function doTuSuKien(e: SuKienLaBan, tuyetDoi: boolean): number | null {
  if (typeof e.webkitCompassHeading === "number") return e.webkitCompassHeading;
  if ((tuyetDoi || e.absolute) && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}

export interface TrangThaiCamBien {
  dangDo: boolean;
  ketQua: KetQuaHopNhat | null;
  loi: string | null;
  batDau: () => Promise<void>;
  dung: () => void;
}

/** Một listener DeviceOrientationEvent duy nhất (có rAF throttle + lọc MAD 15 mẫu) dùng chung cho cả trang. */
export function useLaBanCamBien(
  onDocDuoc?: (kq: KetQuaHopNhat) => void,
  thongBao?: {
    khongLaBan: string;
    quyenBiTuChoi: string;
    loiXinQuyen: string;
    khongTra: string;
  },
): TrangThaiCamBien {
  const [dangDo, setDangDo] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaHopNhat | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const mauRef = useRef<MauCamBien[]>([]);
  const huyRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<KetQuaHopNhat | null>(null);
  const onDocRef = useRef(onDocDuoc);
  onDocRef.current = onDocDuoc;

  const dung = useCallback(() => {
    huyRef.current?.();
    huyRef.current = null;
    if (rafRef.current != null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDangDo(false);
  }, []);

  useEffect(() => () => dung(), [dung]);

  const batDau = useCallback(async () => {
    dung();
    setLoi(null);
    mauRef.current = [];
    setKetQua(null);
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setLoi(thongBao?.khongLaBan ?? "Thiết bị hoặc trình duyệt không hỗ trợ la bàn.");
      return;
    }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      try {
        if ((await DOE.requestPermission()) !== "granted") {
          setLoi(thongBao?.quyenBiTuChoi ?? "Chưa được cấp quyền cảm biến la bàn.");
          return;
        }
      } catch {
        setLoi(thongBao?.loiXinQuyen ?? "Không xin được quyền cảm biến.");
        return;
      }
    }
    const coTuyetDoi = "ondeviceorientationabsolute" in window;
    const ten = coTuyetDoi ? "deviceorientationabsolute" : "deviceorientation";
    let nhan = false;
    const nghe = (e: Event) => {
      const ev = e as SuKienLaBan;
      const d = doTuSuKien(ev, coTuyetDoi);
      if (d == null) return;
      nhan = true;
      const acc = typeof ev.webkitCompassAccuracy === "number" && ev.webkitCompassAccuracy > 0 ? ev.webkitCompassAccuracy : null;
      mauRef.current = [
        ...mauRef.current.slice(-14),
        { deg: d, accuracy: acc, beta: ev.beta ?? null, gamma: ev.gamma ?? null },
      ];
      const kq = hopNhatLaBan(mauRef.current);
      pendingRef.current = kq;
      if (rafRef.current == null && typeof requestAnimationFrame !== "undefined") {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const cur = pendingRef.current;
          if (cur) {
            setKetQua(cur);
            onDocRef.current?.(cur);
          }
        });
      } else if (typeof requestAnimationFrame === "undefined") {
        setKetQua(kq);
        onDocRef.current?.(kq);
      }
    };
    window.addEventListener(ten, nghe);
    const timer = window.setTimeout(() => {
      if (!nhan) setLoi(thongBao?.khongTra ?? "Cảm biến không trả về số độ.");
    }, 2500);
    huyRef.current = () => {
      window.removeEventListener(ten, nghe);
      window.clearTimeout(timer);
    };
    setDangDo(true);
  }, [dung, thongBao]);

  return { dangDo, ketQua, loi, batDau, dung };
}
