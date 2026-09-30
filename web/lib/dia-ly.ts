"use client";
// Danh sách nơi sinh (63 tỉnh) — bảng nằm ở engine, tải một lần mỗi phiên.
import { useEffect, useState } from "react";

export interface Tinh { ma: string; ten: string; vung: "north" | "south" | null }

let boNho: Promise<Tinh[]> | null = null;

function tai(): Promise<Tinh[]> {
  boNho ??= fetch("/api/dia-ly/tinh")
    .then(async (r) => {
      if (!r.ok) throw new Error("Chưa tải được danh sách tỉnh.");
      const d = (await r.json()) as { tinh: Tinh[] };
      return [...d.tinh].sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
    })
    .catch((e: unknown) => { boNho = null; throw e; });
  return boNho;
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
