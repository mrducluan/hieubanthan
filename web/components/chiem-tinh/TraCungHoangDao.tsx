"use client";
// CHT-1 — ô "tra cung hoàng đạo theo ngày sinh": gửi ngày (+ giờ, vùng nơi sinh) cho engine, hiện câu trả lời engine dựng.
// Web không tự tính mốc nào, không lưu ngày sinh (chỉ nằm trong ô nhập của trình duyệt).
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import type { KetQuaTraCung } from "@/lib/cung-hoang-dao";

const DUONG = "/chiem-tinh/cung-hoang-dao";

export function TraCungHoangDao() {
  const [ngay, datNgay] = useState("");
  const [gio, datGio] = useState("");
  const [vung, datVung] = useState<"north" | "south">("north");
  const [kq, datKq] = useState<KetQuaTraCung | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dang, datDang] = useState(false);

  async function tra(e: React.FormEvent) {
    e.preventDefault();
    if (!ngay) return;
    datDang(true); datLoi(null);
    try {
      const r = await fetch("/api/chiem-tinh/cung-hoang-dao", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ngay, gio: gio || null, vung }),
      });
      const b = await r.json().catch(() => null);
      if (!r.ok) { datKq(null); datLoi((b && typeof b.error === "string" && b.error) || "Chưa tra được, thử lại sau."); return; }
      datKq(b as KetQuaTraCung);
    } catch {
      datLoi("Không kết nối được, thử lại sau.");
    } finally { datDang(false); }
  }

  const cung = kq?.cung;
  return (
    <section aria-labelledby="tra-cung" className="glass mt-8 rounded-2xl p-5 sm:p-6" data-tra-cung="">
      <h2 id="tra-cung" className="text-2xl">Tra cung hoàng đạo theo ngày sinh</h2>
      <p className="mt-1 text-sm text-fg-muted">Nhập ngày sinh dương lịch. Sinh đúng ngày đổi cung thì thêm giờ sinh để biết chắc. Không lưu dữ liệu.</p>
      <form onSubmit={tra} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <label className="grid gap-1 text-sm">Ngày sinh
          <input type="date" required min="1900-01-01" max="2099-12-31" value={ngay} onChange={(e) => datNgay(e.target.value)}
            name="ngay-sinh" className="rounded-xl border border-line bg-surface px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">Giờ sinh (nếu biết)
          <input type="time" value={gio} onChange={(e) => datGio(e.target.value)} name="gio-sinh"
            className="rounded-xl border border-line bg-surface px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">Nơi sinh
          <select value={vung} onChange={(e) => datVung(e.target.value as "north" | "south")} name="vung"
            className="rounded-xl border border-line bg-surface px-3 py-2">
            <option value="north">Miền Bắc, miền Trung</option>
            <option value="south">Miền Nam</option>
          </select>
        </label>
        <Button type="submit" disabled={dang || !ngay}>{dang ? "Đang tra…" : "Xem cung"}</Button>
      </form>
      <div aria-live="polite" className="mt-4">
        {loi && <p className="text-sm text-fg" role="alert">{loi}</p>}
        {kq && (
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4" data-ket-qua-cung="">
            <p>{kq.cau}</p>
            <p className="mt-3 flex flex-wrap gap-3 text-sm">
              {cung ? <Link href={`${DUONG}/${cung.slug}`} className="text-gold underline">Đọc về cung {cung.ten} {cung.ky_hieu}</Link>
                : <>
                  <Link href={`${DUONG}/${kq.cung_truoc.slug}`} className="text-gold underline">Cung {kq.cung_truoc.ten}</Link>
                  <Link href={`${DUONG}/${kq.cung_sau.slug}`} className="text-gold underline">Cung {kq.cung_sau.ten}</Link>
                </>}
              <Link href="/chiem-tinh" className="text-gold underline">Lập bản đồ sao đủ ngày, giờ, nơi sinh</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
