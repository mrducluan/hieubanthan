# Review f0f09c6..HEAD (AUD / AUD-P1)

Verified OK: engine tests for new modules (165 pass), `tsc --noEmit` clean; Next redirect hash with param is supported
(prepare-destination substitutes params in hash); `/tuoi-:nam(\d{4})` rule does not catch `.md` nor `cung-*`;
`/phong-thuy/tuoi-:nam-:gioi` only matches directly under /phong-thuy; quẻ structure (KW[ha][thuong] consistent with
info(); Càn/Cấu/Khôn/Thái/Ký Tế bát cung, thế/ứng, hỗ/thác/tổng spot-checked correct); Tử vi palace offsets (Mệnh−k)
correct; namTuoiSeo vs xongDatIndex consistent across Tết and the ~Oct switch (both engine-driven); dem_viec_thang uses
the same chon_ngay as viec_thang; CungTuoi boQua correct.

## Findings (most severe first)

1. MEDIUM — llms.txt points AI to a noindexed xông-đất page for ~8 months/year.
   web/lib/llms.ts (Mùa Tết block + "Tuổi xông đất" line): uses `nam = namTuoiSeo()` for `/tuoi-xong-dat/${nam}/tuoi-1990`.
   xongDatIndex indexes only `namAm + 1`. From Tết until ~Oct, namTuoiSeo = namAm → example URL and "Tuổi xông đất Tết
   ${nam}" refer to the Tết just passed (noindex, stale). Fix: use `namAmHienTai() + 1` for the xông-đất links.

2. LOW-MED — broken internal links (404) on per-age pages for years < 2006.
   web/components/tuoi/KetQuaTuoi.tsx: `duongLamNhaNam(d.nam_xay)` (fallback for missing cach_tinh) and
   `duongXongDatNam(d.nam.nam)` (mung-mot-gon). Child pages accept docNam 1901–2099 but year tables use docNamBang ≥ 2006
   → `/xem-tuoi-lam-nha/2000` 404. The page itself guards with `x.n >= NAM_BANG_TU`; these new links don't. Fix: same guard.

3. LOW-MED — CMS mẫu cụm migrated with stale `{nam}` variable.
   cms/src/migrations/20261103_090000_aud_q2_cung_phi.ts moves the old template (bien tieu_de, nam) to `{slug}`; cung pages
   pass only tieu_de/slug. Any editor text using `{nam}` renders literally (thayBien keeps unknown vars). Fix: in the
   migration, log/strip `{nam}` occurrences, or have the page map unknown vars to "".

4. LOW — nguon-vao: `(^|\.)bing\.com\/chat` (web/lib/nguon-vao.ts:10) can never match a hostname (tenMien returns host
   only); Copilot-in-Bing referrals become `tim_kiem`. Also bare `utm_source=chatgpt`/`perplexity` (no domain) is missed.
   Fix: drop the dead branch; also map plain utm names (chatgpt, perplexity, gemini, copilot, claude).
   Minor: TIM_KIEM `google\.[a-z.]+` classes mail/docs.google.com as search.

5. LOW — engine `/v1/lich/viec-thang-dem/{nam}/{thang}?so=` (hoang_lich_api.py): nam ≤ 2097 + so ≤ 30 can reach 2100 →
   chon_ngay out of range → 500. Fix: cap so so the last month ≤ 2099-12 (or Path le tighter).

6. LOW — CungTuoi links hướng to `/phong-thuy/huong-hop-tuoi#tuoi-YYYY` (fine, not a redirect), but would be stronger to
   link the specific cung page (engine already knows quai). Design note only.

7. LOW — per-age pages now link 10 future years each (muoi_nam / nam_toi / tet_toi), all noindex,follow. Not a bug, but
   ~10 internal links per indexed page to noindex pages dilutes link equity; consider linking only the indexed year +
   year tables.

8. NIT — phongthuy_tuoi.cung_phi hỏi đáp "Cùng nhóm …: <3 cung> — bốn cung này chung bốn hướng tốt" lists only three
   (excludes q). Fix: include q or say "cùng cung {q}, bốn cung …". `sao_toa_menh.doan` says "tam phương tứ chính" for 3
   palaces. llms.ts `catMo`: lastIndexOf(" ") = −1 → slice(0,-1). Fallback in namThoiGianToi (m>=10) can differ from
   engine by ~1–9 days in early Oct if engine is down (sitemap/robots mismatch only then).
