"use client";
// Danh sách nơi sinh (63 tỉnh) — bảng nằm ở engine, tải một lần mỗi phiên.
import { useEffect, useState } from "react";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";

export interface Tinh { ma: string; ten: string; vung: "north" | "south" | null }

// EN-ALL: một bản nhớ mỗi URL (trang Anh tải tên tỉnh tiếng Anh qua `?ngon_ngu=`; trang Việt giữ URL cũ).
const boNho = new Map<string, Promise<Tinh[]>>();

function tai(): Promise<Tinh[]> {
  const url = urlTheoNgonNgu("/api/dia-ly/tinh");
  const sapXep = url.includes("ngon_ngu=") ? "en" : "vi";
  let p = boNho.get(url);
  if (!p) {
    p = fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(sapXep === "en" ? "Could not load the list of provinces." : "Chưa tải được danh sách tỉnh.");
        const d = (await r.json()) as { tinh: Tinh[] };
        return [...d.tinh].sort((a, b) => a.ten.localeCompare(b.ten, sapXep));
      })
      .catch((e: unknown) => { boNho.delete(url); throw e; });
    boNho.set(url, p);
  }
  return p;
}

export function useDanhSachTinh(): { tinh: Tinh[] | null; loi: string | null; thuLai: () => void } {
  const [tinh, setTinh] = useState<Tinh[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    let huy = false;
    setLoi(null);
    tai().then((t) => { if (!huy) setTinh(t); }).catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Lỗi"); });
    return () => { huy = true; };
  }, [lan]);
  return { tinh, loi, thuLai: () => setLan((n) => n + 1) };
}
