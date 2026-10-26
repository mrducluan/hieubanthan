-- SAO-HV (2026-10-26, chủ dự án chốt cách tiếp cận B "Hội viên năm" — docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §3, §9;
-- giá 3.990.000 ₫/năm do chủ dự án chốt, chính sách hoàn tiền do em chốt — ghi ở (4)).
-- Hội viên năm = mua MỘT LẦN bằng VND qua payOS (QR chuyển khoản không trừ tiền định kỳ → KHÔNG tự gia hạn). Quyền lợi:
--   • mở MỌI chương Luận giải toàn bộ (Tử vi / Bát tự / Bản đồ con số) không trừ Sao trong thời hạn — web kiểm bằng
--     hoi_vien_hieu_luc() rồi ghi hoi_vien_ghi_mo(khoá báo cáo) (chỉ đếm, không lưu nội dung / lá số);
--   • Sao tặng mỗi tháng (sao.hoi_vien.sao_thang, mặc định 15) — KHÔNG cộng dồn: lô cấp một lần mỗi tháng, hết hạn ngày
--     cuối tháng đó, khoá 'hoi_vien:<uid>:<yyyy-mm>' duy nhất → gọi lặp (mở trang, cron) không cộng hai lần;
--   • câu hỏi chuyên gia mỗi năm (sao.hoi_vien.cau_hoi_nam, mặc định 2) — hợp đồng giao diện cho mảng "Hỏi chuyên gia":
--     hoi_vien_cua_toi() → {bat, dang_la, tu_ngay, den_ngay, cau_hoi_con, sao_thang, con_ngay}; hoi_vien_dung_cau_hoi()
--     → {ok, con} (trừ 1 lượt, nguyên tử, chỉ khi đang là hội viên). Mảng chuyên gia không được gọi gì khác ở đây.
-- Sao vẫn là credit nội bộ: KHÔNG đổi ra tiền, KHÔNG chuyển nhượng. Không đếm ngược, không giới hạn suất, không gạch giá.
--
--   (1) don_nap thêm cột loai ('sao' | 'hoi_vien' | 'chuyen_gia' — 'chuyen_gia' chỉ thêm giá trị cho mảng khác dùng, không
--       có logic ở đây); đơn không phải 'sao' có goi null + sao = 0. tao_don_nap (0027) GIỮ NGUYÊN; thêm tao_don_hoi_vien.
--   (2) nap_sao_tu_cong (thay bản 0027, giữ toàn bộ logic Sao / nạp đầu / hoa hồng cho đơn 'sao'): đơn 'hoi_vien' trả xong →
--       KÍCH HOẠT hội viên 365 ngày (từ hôm nay, hoặc nối tiếp hạn cũ khi gia hạn) thay vì cộng Sao. Idempotent theo mã
--       đơn (đơn 'da_tra' → 'da_xu_ly'; hv_kich_hoat còn kiểm mã đơn đã ghi vào hoi_vien). **Không hoa hồng, không tặng
--       lần nạp đầu trên đơn hội viên** (em chốt): hoa hồng là % SỐ SAO của đơn, đơn hội viên không có Sao; tránh trả hoa
--       hồng lớn trên 3,99 triệu khi chưa có hợp đồng affiliate riêng; giữ hoa hồng cho gói Sao như 0025.
--   (3) Gia hạn: chỉ khi còn ≤ 30 ngày (tao_don_hoi_vien từ chối 'da_la_hoi_vien' khi còn dài hơn) → cộng 365 ngày vào
--       den_ngay, lượt câu hỏi chuyên gia về 0 cho năm mới.
--   (4) Hoàn tiền (chính sách chốt): hoàn 100 % trong 14 ngày nếu chưa mở chương nào bằng quyền hội viên và chưa dùng câu
--       hỏi chuyên gia; sau đó hoàn theo tỉ lệ THÁNG TRÒN còn lại / 12, trừ giá trị câu hỏi chuyên gia đã dùng (giá lẻ
--       sao.chuyen_gia.gia_vnd, mặc định 199.000 ₫); Sao tháng đã cấp KHÔNG thu hồi. Tiền hoàn chuyển ngoài hệ thống bởi
--       chủ sở hữu: hoan_don_nap (thay bản 0027, giữ logic đơn Sao) với đơn hội viên chỉ TÍNH số tiền gợi ý, chuyển hội
--       viên sang 'hoan' (đơn gia hạn: lùi 365 ngày), ghi nhật ký, trả {so_tien_hoan_goi_y, ly_do}.
-- Mọi công tắc / mức đọc từ cau_hinh (web/lib/cau-hinh.ts nhóm "Hội viên năm"), sao.hoi_vien.bat mặc định TẮT.
-- Chạy SAU 0027. Rollback: 0028_hoi_vien.down.sql

-- ---------------------------------------------------------------- sổ cái: loại mới (Sao tháng của hội viên)
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi', 'nap_dau',
                    'hoi_vien'));

-- ---------------------------------------------------------------- (1) đơn: loại đơn
alter table don_nap add column if not exists loai text not null default 'sao';
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap add constraint don_nap_loai_check check (loai in ('sao', 'hoi_vien', 'chuyen_gia'));
alter table don_nap alter column goi drop not null;
-- Đơn Sao: phải có gói + Sao > 0. Đơn khác: không gói, Sao = 0 (sổ cái không nhận bút toán 0 nên không bao giờ cộng Sao).
alter table don_nap drop constraint if exists don_nap_sao_check;
alter table don_nap add constraint don_nap_sao_check check ((loai = 'sao' and sao > 0) or (loai <> 'sao' and sao = 0));
alter table don_nap drop constraint if exists don_nap_goi_theo_loai;
alter table don_nap add constraint don_nap_goi_theo_loai check ((loai = 'sao') = (goi is not null));

-- ---------------------------------------------------------------- bảng hội viên
create table if not exists hoi_vien (
    id               bigint generated always as identity primary key,
    user_id          uuid not null references auth.users (id) on delete cascade,
    tu_ngay          date not null,
    den_ngay         date not null,
    gia_vnd          integer not null check (gia_vnd > 0),          -- tổng tiền đã trả (gồm các lần gia hạn)
    ma_don           bigint references don_nap (ma_don) on delete set null,   -- đơn mua đầu
    don_gia_han      bigint[] not null default '{}',                -- đơn gia hạn đã nối thêm (idempotent + hoàn tiền)
    cau_hoi_da_dung  integer not null default 0 check (cau_hoi_da_dung >= 0),
    trang_thai       text not null default 'hieu_luc' check (trang_thai in ('hieu_luc', 'hoan', 'het_han')),
    tao_luc          timestamptz not null default now(),
    cap_nhat_luc     timestamptz not null default now(),
    check (den_ngay > tu_ngay)
);
-- Một dòng hiệu lực / người (dòng cũ 'hoan' / 'het_han' giữ làm lịch sử).
create unique index if not exists hoi_vien_mot_hieu_luc on hoi_vien (user_id) where trang_thai = 'hieu_luc';
create index if not exists hoi_vien_den_ngay_idx on hoi_vien (den_ngay) where trang_thai = 'hieu_luc';

-- Mỗi lần mở một báo cáo bằng quyền hội viên: chỉ khoá báo cáo (HMAC do web tính, cùng khoá "đã mở hôm nay") + lúc.
-- Không nội dung, không lá số. Dùng cho chính sách hoàn tiền 14 ngày. Không policy: chỉ ghi / đọc qua hàm.
create table if not exists hoi_vien_mo (
    user_id  uuid not null references auth.users (id) on delete cascade,
    khoa     text not null check (char_length(khoa) between 3 and 120),
    luc      timestamptz not null default now(),
    primary key (user_id, khoa)
);

alter table hoi_vien enable row level security;
alter table hoi_vien_mo enable row level security;
drop policy if exists "hoi_vien chu doc" on hoi_vien;
create policy "hoi_vien chu doc" on hoi_vien for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- hàm phụ (nội bộ)
-- Ngày hôm nay theo giờ Việt Nam (hạn hội viên, tháng cấp Sao đều tính theo ngày VN).
create or replace function hv_hom_nay() returns date
    language sql stable set search_path = '' as $$
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date
$$;

-- Dòng hội viên đang hiệu lực của một người (null nếu không có / đã quá hạn).
create or replace function hv_dong_hieu_luc(p_uid uuid) returns public.hoi_vien
    language sql stable security definer set search_path = '' as $$
    select * from public.hoi_vien
    where user_id = p_uid and trang_thai = 'hieu_luc' and den_ngay >= public.hv_hom_nay()
    limit 1
$$;

-- Số tháng TRÒN từ p_tu tới p_den (p_den < p_tu → 0).
create or replace function hv_thang_tron(p_tu date, p_den date) returns integer
    language sql immutable set search_path = '' as $$
    select case when p_den <= p_tu then 0
                else (extract(year from age(p_den, p_tu)) * 12 + extract(month from age(p_den, p_tu)))::integer end
$$;

-- ---------------------------------------------------------------- (1) tạo đơn hội viên (người dùng)
-- Giá LUÔN đọc ở máy chủ từ cau_hinh (kẹp 100.000–50.000.000). Công tắc tắt → 'chua_mo'. Đang là hội viên còn > 30 ngày →
-- 'da_la_hoi_vien' (không bán chồng); còn ≤ 30 ngày → tạo đơn gia hạn (gia_han = true). Trần 5 đơn chờ như tao_don_nap.
create or replace function tao_don_hoi_vien(p_cong text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_gia integer := public.qt_so_cau_hinh('sao.hoi_vien.gia_vnd', 3990000, 100000, 50000000);
    v_hv public.hoi_vien;
    v_don public.don_nap;
    v_gia_han boolean := false;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_cong is null or p_cong not in ('payos', 'gia') then return jsonb_build_object('ket_qua', 'cong_khong_hop_le'); end if;
    if not public.qt_bat_cau_hinh('sao.hoi_vien.bat') then return jsonb_build_object('ket_qua', 'chua_mo'); end if;
    perform pg_advisory_xact_lock(hashtext('don_nap:' || v_uid));
    v_hv := public.hv_dong_hieu_luc(v_uid);
    if v_hv.id is not null then
        if v_hv.den_ngay - public.hv_hom_nay() > 30 then
            return jsonb_build_object('ket_qua', 'da_la_hoi_vien', 'den_ngay', v_hv.den_ngay);
        end if;
        v_gia_han := true;
    end if;
    if (select count(*) from public.don_nap
        where user_id = v_uid and trang_thai = 'cho' and het_han > now()) >= 5 then
        return jsonb_build_object('ket_qua', 'qua_nhieu_don');
    end if;
    insert into public.don_nap (user_id, goi, so_tien, sao, cong, loai)
    values (v_uid, null, v_gia, 0, p_cong, 'hoi_vien')
    returning * into v_don;
    return jsonb_build_object('ket_qua', 'da_tao', 'ma_don', v_don.ma_don, 'so_tien', v_don.so_tien, 'sao', 0,
                              'ten_goi', case when v_gia_han then 'Gia hạn hội viên năm' else 'Hội viên năm' end,
                              'loai', 'hoi_vien', 'gia_han', v_gia_han, 'het_han', v_don.het_han);
end
$$;

-- ---------------------------------------------------------------- (2) kích hoạt (nội bộ, gọi trong nap_sao_tu_cong)
-- Đơn hội viên đã 'da_tra' → dòng hội viên mới 365 ngày từ hôm nay (VN), hoặc nối tiếp hạn cũ khi đang còn hiệu lực
-- (gia hạn). Idempotent: mã đơn đã nằm trong hoi_vien (ma_don / don_gia_han) → không làm gì.
create or replace function hv_kich_hoat(p_ma_don bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_hv public.hoi_vien;
    v_hom date := public.hv_hom_nay();
begin
    select * into v_don from public.don_nap where ma_don = p_ma_don;
    if v_don.ma_don is null or v_don.loai <> 'hoi_vien' or v_don.trang_thai <> 'da_tra' then
        return jsonb_build_object('ket_qua', 'khong_ap_dung');
    end if;
    perform pg_advisory_xact_lock(hashtext('hoi_vien:' || v_don.user_id));
    if exists (select 1 from public.hoi_vien where ma_don = p_ma_don or p_ma_don = any (don_gia_han)) then
        return jsonb_build_object('ket_qua', 'da_xu_ly');
    end if;
    -- Dòng hiệu lực đã quá hạn → đóng lại trước (chỉ mục duy nhất một dòng hiệu lực / người).
    update public.hoi_vien set trang_thai = 'het_han', cap_nhat_luc = now()
    where user_id = v_don.user_id and trang_thai = 'hieu_luc' and den_ngay < v_hom;
    select * into v_hv from public.hoi_vien where user_id = v_don.user_id and trang_thai = 'hieu_luc' for update;
    if v_hv.id is not null then
        update public.hoi_vien
        set den_ngay = den_ngay + 365, gia_vnd = gia_vnd + v_don.so_tien, don_gia_han = don_gia_han || p_ma_don,
            cau_hoi_da_dung = 0, cap_nhat_luc = now()
        where id = v_hv.id
        returning * into v_hv;
        return jsonb_build_object('ket_qua', 'gia_han', 'tu_ngay', v_hv.tu_ngay, 'den_ngay', v_hv.den_ngay);
    end if;
    insert into public.hoi_vien (user_id, tu_ngay, den_ngay, gia_vnd, ma_don)
    values (v_don.user_id, v_hom, v_hom + 365, v_don.so_tien, p_ma_don)
    returning * into v_hv;
    return jsonb_build_object('ket_qua', 'kich_hoat', 'tu_ngay', v_hv.tu_ngay, 'den_ngay', v_hv.den_ngay);
end
$$;

-- Thay bản 0027: đơn 'hoi_vien' → kích hoạt hội viên, không cộng Sao, không tặng lần nạp đầu, không hoa hồng (xem đầu tệp).
-- Lỗi kích hoạt KHÔNG nuốt (khác hoa hồng): là quyền lợi chính của đơn → giao dịch huỷ, webhook trả 500 để cổng gửi lại.
-- Đơn 'sao' giữ nguyên từng dòng của 0027.
create or replace function nap_sao_tu_cong(p_ma_don bigint, p_so_tien integer, p_cong text, p_ma_giao_dich text)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_tang integer := 0;
    v_hv jsonb;
begin
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.cong <> p_cong then return jsonb_build_object('ket_qua', 'sai_cong'); end if;
    if v_don.trang_thai in ('da_tra', 'hoan') then return jsonb_build_object('ket_qua', 'da_xu_ly', 'sao', v_don.sao); end if;
    if p_so_tien is distinct from v_don.so_tien then
        update public.don_nap set trang_thai = 'sai_tien', ma_giao_dich = left(p_ma_giao_dich, 100),
            ghi_chu = left('Cổng báo ' || coalesce(p_so_tien::text, 'null') || ' ₫, đơn ' || v_don.so_tien || ' ₫', 200)
        where ma_don = p_ma_don;
        return jsonb_build_object('ket_qua', 'sai_tien');
    end if;
    if v_don.loai = 'hoi_vien' then
        update public.don_nap set trang_thai = 'da_tra', tra_luc = now(), ma_giao_dich = left(p_ma_giao_dich, 100)
        where ma_don = p_ma_don;
        v_hv := public.hv_kich_hoat(p_ma_don);
        return jsonb_build_object('ket_qua', 'da_nap', 'sao', 0, 'sao_tang', 0, 'loai', 'hoi_vien', 'hoi_vien', v_hv);
    end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_don.user_id, v_don.sao, 'mua', left('Nạp gói ' || v_don.goi || ' · đơn ' || v_don.ma_don, 120),
            'mua:' || v_don.ma_don, null)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'da_tra', tra_luc = now(), ma_giao_dich = left(p_ma_giao_dich, 100)
    where ma_don = p_ma_don;
    begin
        v_tang := public.nd_tang_cho_don(p_ma_don);
    exception when others then
        v_tang := 0;
        raise warning 'nap_dau don % loi: %', p_ma_don, sqlerrm;
    end;
    begin
        perform public.hh_cho_don(p_ma_don);
    exception when others then
        raise warning 'hoa_hong don % loi: %', p_ma_don, sqlerrm;
    end;
    return jsonb_build_object('ket_qua', 'da_nap', 'sao', v_don.sao, 'sao_tang', v_tang);
end
$$;

-- ---------------------------------------------------------------- quyền lợi (người dùng)
-- Đang là hội viên? p_uid null → chính mình. Người đăng nhập chỉ hỏi được về mình; service role (không có sub) hỏi ai cũng được.
create or replace function hoi_vien_hieu_luc(p_uid uuid default null) returns boolean
    language plpgsql stable security definer set search_path = '' as $$
declare
    v_me uuid := (select auth.uid());
    v_uid uuid := coalesce(p_uid, v_me);
begin
    if v_uid is null then return false; end if;
    if v_me is not null and v_uid <> v_me then raise exception 'khong_co_quyen'; end if;
    return (public.hv_dong_hieu_luc(v_uid)).id is not null;
end
$$;

-- Ghi "đã mở một báo cáo bằng quyền hội viên" (khoá báo cáo do web tính; cùng khoá trong ngày chỉ ghi một lần).
create or replace function hoi_vien_ghi_mo(p_khoa text) returns boolean
    language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_khoa is null or char_length(p_khoa) not between 3 and 120 then return false; end if;
    if (public.hv_dong_hieu_luc(v_uid)).id is null then return false; end if;
    insert into public.hoi_vien_mo (user_id, khoa) values (v_uid, p_khoa) on conflict do nothing;
    return found;
end
$$;

-- Cấp Sao tháng cho MỘT người (nội bộ): lô 'hoi_vien:<uid>:<yyyy-mm>', hết hạn ngày cuối tháng (VN), không cộng dồn.
-- Trả số Sao vừa cấp (0 = đã cấp tháng này / không là hội viên / mức 0).
create or replace function hv_cap_sao_thang_cho(p_uid uuid) returns integer
    language plpgsql security definer set search_path = '' as $$
declare
    v_muc integer := public.qt_so_cau_hinh('sao.hoi_vien.sao_thang', 15, 0, 100);
    v_hom date := public.hv_hom_nay();
    v_thang text := to_char(v_hom, 'YYYY-MM');
    v_cuoi date := (date_trunc('month', v_hom) + interval '1 month - 1 day')::date;
begin
    if v_muc <= 0 or p_uid is null then return 0; end if;
    if (public.hv_dong_hieu_luc(p_uid)).id is null then return 0; end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (p_uid, v_muc, 'hoi_vien', 'Sao hội viên tháng ' || to_char(v_hom, 'MM/YYYY') || ' (hết hạn cuối tháng)',
            'hoi_vien:' || p_uid || ':' || v_thang, v_cuoi)
    on conflict (khoa) do nothing;
    return case when found then v_muc else 0 end;
end
$$;

-- Người dùng tự gọi khi mở /tai-khoan hoặc /hoi-vien (lần đầu mở trang trong tháng). Trả Sao vừa cấp.
create or replace function hoi_vien_cap_sao_thang() returns integer
    language sql security definer set search_path = '' as $$
    select public.hv_cap_sao_thang_cho((select auth.uid()))
$$;

-- Cron ngày (service role): cấp cho mọi hội viên đang hiệu lực chưa nhận tháng này. Trả số người vừa cấp.
create or replace function hoi_vien_cap_sao_thang_tat_ca() returns integer
    language plpgsql security definer set search_path = '' as $$
declare
    r record;
    v_n integer := 0;
begin
    for r in select user_id from public.hoi_vien where trang_thai = 'hieu_luc' and den_ngay >= public.hv_hom_nay() loop
        if public.hv_cap_sao_thang_cho(r.user_id) > 0 then v_n := v_n + 1; end if;
    end loop;
    return v_n;
end
$$;

-- Hợp đồng giao diện cho web + mảng "Hỏi chuyên gia". Khách / không là hội viên → dang_la = false (vẫn trả bat + giá).
create or replace function hoi_vien_cua_toi() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_hv public.hoi_vien;
    v_nam integer := public.qt_so_cau_hinh('sao.hoi_vien.cau_hoi_nam', 2, 0, 12);
    v_sao integer := public.qt_so_cau_hinh('sao.hoi_vien.sao_thang', 15, 0, 100);
    v_hom date := public.hv_hom_nay();
    v_chung jsonb := jsonb_build_object(
        'bat', public.qt_bat_cau_hinh('sao.hoi_vien.bat'),
        'gia_vnd', public.qt_so_cau_hinh('sao.hoi_vien.gia_vnd', 3990000, 100000, 50000000),
        'sao_thang', v_sao, 'cau_hoi_nam', v_nam);
begin
    if v_uid is not null then v_hv := public.hv_dong_hieu_luc(v_uid); end if;
    if v_hv.id is null then
        return v_chung || jsonb_build_object('dang_la', false, 'tu_ngay', null, 'den_ngay', null, 'cau_hoi_con', 0, 'con_ngay', 0,
                                             'gia_han_duoc', false, 'sao_thang_da_cap', false);
    end if;
    return v_chung || jsonb_build_object(
        'dang_la', true, 'tu_ngay', v_hv.tu_ngay, 'den_ngay', v_hv.den_ngay,
        'cau_hoi_con', greatest(0, v_nam - v_hv.cau_hoi_da_dung), 'cau_hoi_da_dung', v_hv.cau_hoi_da_dung,
        'con_ngay', v_hv.den_ngay - v_hom, 'gia_han_duoc', v_hv.den_ngay - v_hom <= 30,
        'sao_thang_da_cap', exists (select 1 from public.so_cai_sao
                                    where khoa = 'hoi_vien:' || v_uid || ':' || to_char(v_hom, 'YYYY-MM')));
end
$$;

-- Trừ 1 lượt câu hỏi chuyên gia (nguyên tử: khoá dòng). Không là hội viên / hết lượt → ok = false.
create or replace function hoi_vien_dung_cau_hoi() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_hv public.hoi_vien;
    v_nam integer := public.qt_so_cau_hinh('sao.hoi_vien.cau_hoi_nam', 2, 0, 12);
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    select * into v_hv from public.hoi_vien
    where user_id = v_uid and trang_thai = 'hieu_luc' and den_ngay >= public.hv_hom_nay() for update;
    if v_hv.id is null then return jsonb_build_object('ok', false, 'con', 0); end if;
    if v_hv.cau_hoi_da_dung >= v_nam then return jsonb_build_object('ok', false, 'con', 0); end if;
    update public.hoi_vien set cau_hoi_da_dung = cau_hoi_da_dung + 1, cap_nhat_luc = now() where id = v_hv.id;
    return jsonb_build_object('ok', true, 'con', v_nam - v_hv.cau_hoi_da_dung - 1);
end
$$;

-- ---------------------------------------------------------------- (4) hoàn tiền (quản trị, MFA)
-- Thay bản 0027: đơn 'sao' giữ nguyên từng dòng. Đơn 'hoi_vien': tính số tiền gợi ý theo chính sách (đầu tệp), chuyển hội
-- viên sang 'hoan' (đơn gia hạn: lùi 365 ngày, bỏ mã đơn khỏi don_gia_han), không bút toán Sao (Sao tháng không thu hồi).
create or replace function hoan_don_nap(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_hh public.hoa_hong;
    v_nd integer := 0;
    v_hv public.hoi_vien;
    v_hom date := public.hv_hom_nay();
    v_gia_han boolean;
    v_moc date;
    v_thang integer;
    v_da_mo integer;
    v_cau integer;
    v_gia_cg integer := public.qt_so_cau_hinh('sao.chuyen_gia.gia_vnd', 199000, 20000, 5000000);
    v_goi_y integer;
    v_ly_do text;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_ly_do is null or char_length(trim(p_ly_do)) not between 5 and 120 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.trang_thai <> 'da_tra' then return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', v_don.trang_thai); end if;

    if v_don.loai = 'hoi_vien' then
        select * into v_hv from public.hoi_vien
        where (ma_don = p_ma_don or p_ma_don = any (don_gia_han)) and trang_thai = 'hieu_luc' for update;
        if v_hv.id is null then return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', 'hoi_vien_khong_hieu_luc'); end if;
        v_gia_han := p_ma_don = any (v_hv.don_gia_han);
        -- Đã dùng gì kể từ khi trả đơn này: chương mở bằng quyền hội viên + câu hỏi chuyên gia (gia hạn: lượt về 0 lúc gia hạn).
        select count(*) into v_da_mo from public.hoi_vien_mo where user_id = v_don.user_id and luc >= v_don.tra_luc;
        v_cau := v_hv.cau_hoi_da_dung;
        if v_hom - v_don.tra_luc::date <= 14 and v_da_mo = 0 and v_cau = 0 then
            v_goi_y := v_don.so_tien; v_thang := null; v_ly_do := 'trong_14_ngay_chua_dung';
        else
            -- Tháng tròn còn lại của PHẦN đơn này trả (đơn gia hạn: 365 ngày cuối), tối đa 12.
            v_moc := case when v_gia_han then greatest(v_hom, v_hv.den_ngay - 365) else v_hom end;
            v_thang := least(12, public.hv_thang_tron(v_moc, v_hv.den_ngay));
            v_goi_y := greatest(0, round(v_don.so_tien * v_thang / 12.0)::integer - v_cau * v_gia_cg);
            v_ly_do := 'theo_thang_tron_con_lai';
        end if;
        if v_gia_han then
            update public.hoi_vien
            set den_ngay = den_ngay - 365, gia_vnd = greatest(1, gia_vnd - v_don.so_tien),
                don_gia_han = array_remove(don_gia_han, p_ma_don), cap_nhat_luc = now(),
                trang_thai = case when den_ngay - 365 < v_hom then 'het_han' else trang_thai end
            where id = v_hv.id;
        else
            update public.hoi_vien set trang_thai = 'hoan', cap_nhat_luc = now() where id = v_hv.id;
        end if;
        update public.don_nap set trang_thai = 'hoan', ghi_chu = left(trim(p_ly_do), 200) where ma_don = p_ma_don;
        perform public.qt_ghi('don_nap.hoan', p_ma_don::text, jsonb_build_object('loai', 'hoi_vien', 'so_tien', v_don.so_tien,
            'ly_do', left(trim(p_ly_do), 120), 'so_tien_hoan_goi_y', v_goi_y, 'ly_do_goi_y', v_ly_do, 'thang_con', v_thang,
            'da_mo', v_da_mo, 'cau_hoi_da_dung', v_cau, 'gia_han', v_gia_han));
        return jsonb_build_object('ket_qua', 'da_hoan', 'loai', 'hoi_vien', 'sao', 0, 'so_tien_hoan_goi_y', v_goi_y,
                                  'ly_do', v_ly_do, 'thang_con', v_thang, 'da_mo', v_da_mo, 'cau_hoi_da_dung', v_cau);
    end if;

    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
    values (v_don.user_id, -v_don.sao, 'dieu_chinh', left('Hoàn tiền đơn ' || v_don.ma_don || ': ' || trim(p_ly_do), 120),
            'hoan:' || v_don.ma_don)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'hoan', ghi_chu = left(trim(p_ly_do), 200) where ma_don = p_ma_don;
    if coalesce(v_don.sao_tang_dau, 0) > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
        values (v_don.user_id, -v_don.sao_tang_dau, 'dieu_chinh', left('Thu hồi Sao tặng lần nạp đầu — đơn ' || v_don.ma_don
                || ' đã hoàn tiền', 120), 'thu_hoi:nap_dau:' || v_don.user_id)
        on conflict (khoa) do nothing;
        if found then v_nd := v_don.sao_tang_dau; end if;
    end if;
    select * into v_hh from public.hoa_hong where ma_don = p_ma_don for update;
    if v_hh.ma_don is not null and v_hh.trang_thai <> 'thu_hoi' then
        if v_hh.sao > 0 then
            insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
            values (v_hh.nguoi_moi_id, -v_hh.sao, 'dieu_chinh', 'Thu hồi hoa hồng — đơn của bạn bè đã hoàn tiền',
                    'thu_hoi:hoa_hong:' || p_ma_don)
            on conflict (khoa) do nothing;
        end if;
        update public.hoa_hong set trang_thai = 'thu_hoi', thu_hoi_luc = now() where ma_don = p_ma_don;
    end if;
    perform public.qt_ghi('don_nap.hoan', p_ma_don::text, jsonb_build_object('sao', v_don.sao, 'so_tien', v_don.so_tien,
        'ly_do', left(trim(p_ly_do), 120), 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0), 'thu_hoi_nap_dau', v_nd));
    return jsonb_build_object('ket_qua', 'da_hoan', 'sao', v_don.sao, 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0),
                              'thu_hoi_nap_dau', v_nd);
end
$$;

-- ---------------------------------------------------------------- quản trị: thống kê (chủ sở hữu, MFA, ghi nhật ký)
create or replace function thong_ke_hoi_vien(p_ngay integer default 30) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_tu timestamptz;
    v_hom date := public.hv_hom_nay();
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    p_ngay := least(greatest(coalesce(p_ngay, 30), 1), 365);
    v_tu := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh' - make_interval(days => p_ngay - 1);
    perform public.qt_ghi('hoi_vien.xem', p_ngay::text, null);
    return jsonb_build_object(
        'ngay', p_ngay,
        'bat', public.qt_bat_cau_hinh('sao.hoi_vien.bat'),
        'gia_vnd', public.qt_so_cau_hinh('sao.hoi_vien.gia_vnd', 3990000, 100000, 50000000),
        'hieu_luc', (select count(*) from public.hoi_vien where trang_thai = 'hieu_luc' and den_ngay >= v_hom),
        'moi_trong_ky', (select count(*) from public.hoi_vien where tao_luc >= v_tu),
        'gia_han_trong_ky', (select count(*) from public.don_nap
                             where loai = 'hoi_vien' and trang_thai in ('da_tra', 'hoan') and tra_luc >= v_tu
                               and exists (select 1 from public.hoi_vien h where public.don_nap.ma_don = any (h.don_gia_han))),
        'doanh_thu', (select coalesce(sum(so_tien), 0) from public.don_nap
                      where loai = 'hoi_vien' and trang_thai = 'da_tra' and tra_luc >= v_tu),
        'het_han_30_ngay', (select count(*) from public.hoi_vien
                            where trang_thai = 'hieu_luc' and den_ngay between v_hom and v_hom + 30),
        'hoan', (select count(*) from public.don_nap where loai = 'hoi_vien' and trang_thai = 'hoan' and tra_luc >= v_tu),
        'cau_hoi_da_dung', (select coalesce(sum(cau_hoi_da_dung), 0) from public.hoi_vien where trang_thai = 'hieu_luc'),
        'sao_thang_da_cap', (select coalesce(sum(so_luong), 0) from public.so_cai_sao where loai = 'hoi_vien' and tao_luc >= v_tu)
    );
end
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function hv_hom_nay(), hv_dong_hieu_luc(uuid), hv_thang_tron(date, date), tao_don_hoi_vien(text),
    hv_kich_hoat(bigint), hoi_vien_hieu_luc(uuid), hoi_vien_ghi_mo(text), hv_cap_sao_thang_cho(uuid),
    hoi_vien_cap_sao_thang(), hoi_vien_cap_sao_thang_tat_ca(), hoi_vien_cua_toi(), hoi_vien_dung_cau_hoi(),
    thong_ke_hoi_vien(integer)
    from public, anon, authenticated;
grant execute on function tao_don_hoi_vien(text), hoi_vien_hieu_luc(uuid), hoi_vien_ghi_mo(text), hoi_vien_cap_sao_thang(),
    hoi_vien_cua_toi(), hoi_vien_dung_cau_hoi(), thong_ke_hoi_vien(integer) to authenticated;
grant execute on function hoi_vien_cua_toi() to anon;   -- khách thấy công tắc + giá (không có dữ liệu riêng)
grant execute on function hoi_vien_hieu_luc(uuid), hoi_vien_cap_sao_thang_tat_ca(), hv_kich_hoat(bigint) to service_role;
-- Hàm thay thế giữ nguyên quyền cũ (create or replace không đổi quyền); ghi lại cho chắc.
revoke all on function nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text) from public, anon, authenticated;
grant execute on function hoan_don_nap(bigint, text) to authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;
grant select on hoi_vien to authenticated;
revoke insert, update, delete on hoi_vien from anon, authenticated;
revoke all on hoi_vien_mo from anon, authenticated;
