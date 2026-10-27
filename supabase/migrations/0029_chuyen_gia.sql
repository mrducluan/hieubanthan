-- CG-C "Hỏi chuyên gia" (2026-10-26, chủ dự án chốt cách tiếp cận C của docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §7 ý 2, §9;
-- quy tắc hành nghề: docs/KE-HOACH-CHUYEN-GIA.md CG-1 — trả bằng VND, KHÔNG bằng Sao).
--
-- Người dùng đặt MỘT câu hỏi (≤ 1.500 ký tự) về một mảng, trả VND cố định qua cổng thanh toán (giá 'sao.chuyen_gia.gia_vnd',
-- câu đầu giảm 'sao.chuyen_gia.giam_lan_dau_pt' %), chuyên gia (vai trò chu_so_huu / tham_dinh, đã qua MFA) trả lời bằng văn
-- bản trong 'sao.chuyen_gia.han_gio' giờ (mặc định 48); quá hạn → chủ sở hữu hoàn 100 % ngoài hệ thống rồi đánh dấu.
-- NGOẠI LỆ riêng tư đã duyệt: câu hỏi + câu trả lời là dịch vụ người dùng mua → lưu gắn user_id, RLS chủ sở hữu, xoá được.
--
--   cau_hoi_chuyen_gia  câu hỏi, (tuỳ chọn) ảnh chụp hồ sơ CHỈ khi người dùng tích đồng ý riêng (dong_y_chia_se) — chỉ các
--                       trường cần để lập lá số: họ tên hiển thị, ngày sinh, giờ (+ độ tin giờ), giới tính, nơi sinh; mọi khoá
--                       khác bị bỏ (cg_loc_ho_so). Ảnh chụp bị xoá 30 ngày sau khi trả lời (don_chuyen_gia, cron ngày); câu hỏi
--                       + câu trả lời giữ cho người dùng tới khi họ xoá tài khoản.
--   don_nap             dùng chung cho dịch vụ trả VND: cột `loai` ('sao' mặc định; 'chuyen_gia'), `goi` nullable, `sao` ≥ 0.
--                       0028 (hội viên) cũng thêm `loai` + nới `goi` — hai migration viết "add column if not exists" / "drop not
--                       null" để GIAO HOÁN được; 0029 KHÔNG đặt check trên `loai` (0028 định nghĩa danh sách giá trị).
--                       Check `don_nap_sao_check` nới thành sao >= 0 (đơn dịch vụ không có Sao) — 0028 làm giống thì vô hại.
--   Thanh toán          KHÔNG sửa nap_sao_tu_cong (0028 sửa để đơn loai <> 'sao' không ghi sổ cái 0 Sao). Thay vào đó TRIGGER
--                       cg_don_da_tra: đơn loai = 'chuyen_gia' chuyển 'da_tra' (webhook, đối soát, cổng giả — mọi đường) →
--                       câu hỏi 'cho_tra' (hoặc 'huy' mà tiền vẫn về) sang 'cho_tra_loi' + han_tra_loi = lúc trả + N giờ.
--   Hoàn tiền           hoan_cau_hoi (chủ sở hữu, sau khi đã chuyển tiền ngoài) — KHÔNG gọi hoan_don_nap (hàm đó bút toán trừ
--                       Sao của đơn; đơn chuyên gia không có Sao → so_cai_sao.so_luong <> 0 sẽ vỡ).
--   Lần đầu             = tài khoản chưa có câu hỏi nào ĐÃ THANH TOÁN (cho_tra_loi / da_tra_loi / qua_han / hoan, gia_vnd > 0);
--                       câu hội viên miễn phí không tính là đã mua.
-- Chạy SAU 0028 (hoặc trước — giao hoán). Rollback: 0029_chuyen_gia.down.sql

-- ---------------------------------------------------------------- (0) don_nap dùng chung cho dịch vụ trả VND
alter table don_nap add column if not exists loai text not null default 'sao';
alter table don_nap alter column goi drop not null;
alter table don_nap drop constraint if exists don_nap_sao_check;
alter table don_nap add constraint don_nap_sao_check check (sao >= 0);

-- ---------------------------------------------------------------- (1) bảng câu hỏi
create table if not exists cau_hoi_chuyen_gia (
    id                 bigint generated always as identity primary key,
    user_id            uuid not null references auth.users (id) on delete cascade,
    mang               text not null check (mang in ('than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy')),
    cau_hoi            text not null check (char_length(cau_hoi) between 10 and 1500),
    ho_so              jsonb check (ho_so is null or pg_column_size(ho_so) <= 2048),
    dong_y_chia_se     boolean not null default false,
    ma_don             bigint references don_nap (ma_don) on delete set null,
    gia_vnd            integer not null check (gia_vnd >= 0),
    mien_phi_hoi_vien  boolean not null default false,
    trang_thai         text not null default 'cho_tra'
                       check (trang_thai in ('cho_tra', 'cho_tra_loi', 'da_tra_loi', 'qua_han', 'hoan', 'huy')),
    thanh_toan_luc     timestamptz,
    han_tra_loi        timestamptz,
    tra_loi            text check (tra_loi is null or char_length(tra_loi) <= 6000),
    tra_loi_luc        timestamptz,
    nguoi_tra_loi      uuid references auth.users (id) on delete set null,
    danh_gia           smallint check (danh_gia is null or danh_gia between 1 and 5),
    hoan_luc           timestamptz,
    ly_do_hoan         text check (ly_do_hoan is null or char_length(ly_do_hoan) <= 200),
    tao_luc            timestamptz not null default now()
);
create index if not exists cau_hoi_chuyen_gia_user_idx on cau_hoi_chuyen_gia (user_id, tao_luc desc);
create index if not exists cau_hoi_chuyen_gia_cho_idx on cau_hoi_chuyen_gia (han_tra_loi) where trang_thai = 'cho_tra_loi';
create index if not exists cau_hoi_chuyen_gia_don_idx on cau_hoi_chuyen_gia (ma_don);

alter table cau_hoi_chuyen_gia enable row level security;
drop policy if exists "cau_hoi_chuyen_gia chu doc" on cau_hoi_chuyen_gia;
create policy "cau_hoi_chuyen_gia chu doc" on cau_hoi_chuyen_gia for select to authenticated using ((select auth.uid()) = user_id);
revoke all on cau_hoi_chuyen_gia from public, anon, authenticated;
grant select on cau_hoi_chuyen_gia to authenticated;

-- ---------------------------------------------------------------- (2) cấu hình (kẹp; web khai cùng khoá ở lib/cau-hinh.ts)
create or replace function cg_gia_vnd() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.chuyen_gia.gia_vnd', 199000, 20000, 5000000)
$$;
create or replace function cg_giam_pt() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.chuyen_gia.giam_lan_dau_pt', 30, 0, 90)
$$;
create or replace function cg_han_gio() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.chuyen_gia.han_gio', 48, 12, 168)
$$;
-- Hạn trả lời của MỘT người: hội viên Chuyên gia (0028 hv_han_gio_cho, quyền lợi đóng băng lúc mua) được hạn ngắn hơn;
-- không bao giờ dài hơn hạn chung. 0028 phải chạy trước 0029 (thứ tự bắt buộc).
create or replace function cg_han_gio_cho(p_uid uuid) returns integer
    language sql stable security definer set search_path = '' as $$
    select least(public.cg_han_gio(), coalesce(public.hv_han_gio_cho(p_uid), public.cg_han_gio()))
$$;
-- Đã từng mua câu hỏi (đã thanh toán) chưa — câu hội viên miễn phí không tính.
create or replace function cg_da_tung_tra(p_uid uuid) returns boolean
    language sql stable security definer set search_path = '' as $$
    select exists (select 1 from public.cau_hoi_chuyen_gia
                   where user_id = p_uid and gia_vnd > 0 and trang_thai in ('cho_tra_loi', 'da_tra_loi', 'qua_han', 'hoan'))
$$;
create or replace function cg_gia_cho(p_uid uuid) returns integer
    language sql stable security definer set search_path = '' as $$
    select case when p_uid is not null and public.cg_da_tung_tra(p_uid) then public.cg_gia_vnd()
                -- Làm tròn XUỐNG tới nghìn đồng (199.000 × 70% = 139.300 → 139.000): số hiển thị = số tính tiền, dễ đọc.
                else (floor(public.cg_gia_vnd() * (100 - public.cg_giam_pt()) / 100.0 / 1000) * 1000)::integer end
$$;

-- Ảnh chụp hồ sơ: CHỈ các khoá cho phép, đúng định dạng; thiếu ngày sinh → null (không ghi gì).
create or replace function cg_loc_ho_so(p jsonb) returns jsonb
    language sql immutable as $$
    select case when p is null or jsonb_typeof(p) <> 'object' or coalesce(p ->> 'ngay_sinh', '') !~ '^\d{4}-\d{2}-\d{2}$' then null
           else jsonb_strip_nulls(jsonb_build_object(
               'ho_ten',     case when jsonb_typeof(p -> 'ho_ten') = 'string' then left(trim(p ->> 'ho_ten'), 80) end,
               'ngay_sinh',  p ->> 'ngay_sinh',
               'gio_sinh',   case when (p ->> 'gio_sinh') ~ '^\d{2}:\d{2}$' then p ->> 'gio_sinh' end,
               'do_tin_gio', case when (p ->> 'do_tin_gio') in ('exact', 'approx', 'unknown') then p ->> 'do_tin_gio' end,
               'gioi_tinh',  case when (p ->> 'gioi_tinh') in ('nam', 'nu') then p ->> 'gioi_tinh' end,
               'noi_sinh',   case when (p ->> 'noi_sinh') ~ '^[a-z0-9_-]{2,40}$' then p ->> 'noi_sinh' end,
               'gio_mua_he', case when jsonb_typeof(p -> 'gio_mua_he') = 'boolean' then (p -> 'gio_mua_he')::boolean end)) end
$$;

-- Có link / email / số điện thoại trong văn bản (chuyên gia không được dẫn ra ngoài; người dùng không nên gửi).
create or replace function cg_co_lien_he(p text) returns boolean
    language sql immutable as $$
    select p ~* '(https?://|www\.)' or p ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
        or p ~ '(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}'
$$;

-- ---------------------------------------------------------------- (3) thanh toán: trigger trên don_nap
-- Đơn chuyên gia chuyển 'da_tra' (bất kể đường nào: webhook, đối soát, cổng giả) → câu hỏi sang 'cho_tra_loi', bắt đầu đếm hạn.
-- Câu đã 'huy' mà tiền vẫn về (người dùng huỷ rồi vẫn chuyển khoản) → vẫn mở lại để trả lời (đã trả tiền thật).
create or replace function cg_don_da_tra() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    if new.loai = 'chuyen_gia' and new.trang_thai = 'da_tra' and old.trang_thai is distinct from 'da_tra' then
        update public.cau_hoi_chuyen_gia
        set trang_thai = 'cho_tra_loi', thanh_toan_luc = now(),
            han_tra_loi = now() + make_interval(hours => public.cg_han_gio_cho(new.user_id))
        where ma_don = new.ma_don and trang_thai in ('cho_tra', 'huy');
    end if;
    return new;
end
$$;
drop trigger if exists cg_don_da_tra on don_nap;
create trigger cg_don_da_tra after update of trang_thai on don_nap for each row execute function cg_don_da_tra();

-- ---------------------------------------------------------------- (4) người dùng
-- Ai cũng gọi được: công tắc, giá, hạn; đăng nhập thì thêm "lần đầu", giá lần này, số câu đang chờ trả.
create or replace function chuyen_gia_thong_tin() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'bat', public.qt_bat_cau_hinh('sao.chuyen_gia.bat'),
        'gia_vnd', public.cg_gia_vnd(),
        'giam_lan_dau_pt', public.cg_giam_pt(),
        'han_gio', public.cg_han_gio(),
        -- Hạn của chính người đang xem (hội viên Chuyên gia ngắn hơn); khách = hạn chung.
        'han_gio_cua_toi', case when (select auth.uid()) is null then public.cg_han_gio() else public.cg_han_gio_cho((select auth.uid())) end,
        'gia_lan_dau', public.cg_gia_cho(null),
        'lan_dau', case when (select auth.uid()) is null then null else not public.cg_da_tung_tra((select auth.uid())) end,
        'gia_lan_nay', public.cg_gia_cho((select auth.uid())),
        'dang_cho', case when (select auth.uid()) is null then null
                         else (select count(*) from public.cau_hoi_chuyen_gia c
                               where c.user_id = (select auth.uid()) and c.trang_thai = 'cho_tra_loi') end)
$$;

-- Tạo câu hỏi. p_mien_phi_hoi_vien = true: hàm TỰ trừ lượt hội viên (hoi_vien_dung_cau_hoi của 0028) → vào thẳng
-- 'cho_tra_loi', giá 0, không tạo đơn. Ngược lại tạo đơn don_nap loai 'chuyen_gia' (giá theo cấu hình, câu đầu giảm) và trả
-- ma_don để web tạo link thanh toán. Tối đa 3 câu đang chờ thanh toán (đơn còn hạn) cùng lúc (câu hội viên không tính).
create or replace function tao_cau_hoi_chuyen_gia(p_mang text, p_cau_hoi text, p_ho_so jsonb, p_dong_y boolean,
                                                  p_mien_phi_hoi_vien boolean, p_cong text default 'payos') returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_cau text := regexp_replace(coalesce(p_cau_hoi, ''), '\s+', ' ', 'g');
    v_hs jsonb;
    v_gia integer;
    v_lan_dau boolean;
    v_don public.don_nap;
    v_ch public.cau_hoi_chuyen_gia;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if not public.qt_bat_cau_hinh('sao.chuyen_gia.bat') then return jsonb_build_object('ket_qua', 'tat'); end if;
    if p_mang is null or p_mang not in ('than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy') then
        return jsonb_build_object('ket_qua', 'mang_khong_hop_le');
    end if;
    v_cau := trim(v_cau);
    if char_length(v_cau) not between 10 and 1500 then return jsonb_build_object('ket_qua', 'cau_hoi_khong_hop_le'); end if;
    if not coalesce(p_mien_phi_hoi_vien, false) and (p_cong is null or p_cong not in ('payos', 'gia')) then
        return jsonb_build_object('ket_qua', 'cong_khong_hop_le');
    end if;
    v_hs := case when coalesce(p_dong_y, false) then public.cg_loc_ho_so(p_ho_so) end;
    perform pg_advisory_xact_lock(hashtext('chuyen_gia:' || v_uid));
    if coalesce(p_mien_phi_hoi_vien, false) then
        -- Trừ lượt hội viên NGAY TRONG giao dịch này (0028, nguyên tử, khoá dòng) — không tin cờ từ phía người gọi:
        -- gọi thẳng RPC với p_mien_phi_hoi_vien = true mà không là hội viên / hết lượt → từ chối, không tạo câu.
        if not coalesce((public.hoi_vien_dung_cau_hoi()->>'ok')::boolean, false) then
            return jsonb_build_object('ket_qua', 'het_luot_hoi_vien');
        end if;
        insert into public.cau_hoi_chuyen_gia (user_id, mang, cau_hoi, ho_so, dong_y_chia_se, gia_vnd, mien_phi_hoi_vien,
                                               trang_thai, thanh_toan_luc, han_tra_loi)
        values (v_uid, p_mang, v_cau, v_hs, v_hs is not null, 0, true, 'cho_tra_loi', now(),
                now() + make_interval(hours => public.cg_han_gio_cho(v_uid)))
        returning * into v_ch;
        return jsonb_build_object('ket_qua', 'da_tao', 'id', v_ch.id, 'trang_thai', v_ch.trang_thai, 'han_tra_loi', v_ch.han_tra_loi,
                                  'gia_vnd', 0, 'mien_phi_hoi_vien', true);
    end if;
    -- Trần 3 câu đang chờ THANH TOÁN (đơn còn hạn) — chỉ đường trả tiền; câu hội viên không tạo đơn.
    if (select count(*) from public.cau_hoi_chuyen_gia c join public.don_nap d on d.ma_don = c.ma_don
        where c.user_id = v_uid and c.trang_thai = 'cho_tra' and d.trang_thai = 'cho' and d.het_han > now()) >= 3 then
        return jsonb_build_object('ket_qua', 'qua_nhieu_cau');
    end if;
    v_lan_dau := not public.cg_da_tung_tra(v_uid);
    v_gia := public.cg_gia_cho(v_uid);
    insert into public.don_nap (user_id, goi, so_tien, sao, cong, loai)
    values (v_uid, null, v_gia, 0, p_cong, 'chuyen_gia')
    returning * into v_don;
    insert into public.cau_hoi_chuyen_gia (user_id, mang, cau_hoi, ho_so, dong_y_chia_se, ma_don, gia_vnd)
    values (v_uid, p_mang, v_cau, v_hs, v_hs is not null, v_don.ma_don, v_gia)
    returning * into v_ch;
    return jsonb_build_object('ket_qua', 'da_tao', 'id', v_ch.id, 'trang_thai', v_ch.trang_thai, 'ma_don', v_don.ma_don,
                              'so_tien', v_don.so_tien, 'het_han', v_don.het_han, 'lan_dau', v_lan_dau, 'gia_vnd', v_gia,
                              'mien_phi_hoi_vien', false);
end
$$;

-- Câu hỏi của chính mình (không trả ảnh chụp hồ sơ — chỉ cờ có/không). Trạng thái HIỂN THỊ: 'qua_han' khi đang chờ mà đã quá
-- hạn (cron đánh dấu sau), 'het_han_don' khi chưa trả mà đơn đã hết hạn / huỷ.
create or replace function cau_hoi_cua_toi() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'mang', c.mang, 'cau_hoi', c.cau_hoi, 'gia_vnd', c.gia_vnd, 'mien_phi_hoi_vien', c.mien_phi_hoi_vien,
        'trang_thai', case when c.trang_thai = 'cho_tra_loi' and c.han_tra_loi < now() then 'qua_han'
                           when c.trang_thai = 'cho_tra' and (d.trang_thai is distinct from 'cho' or d.het_han < now()) then 'het_han_don'
                           else c.trang_thai end,
        'ma_don', c.ma_don, 'het_han_don', d.het_han, 'thanh_toan_luc', c.thanh_toan_luc, 'han_tra_loi', c.han_tra_loi,
        'tra_loi', c.tra_loi, 'tra_loi_luc', c.tra_loi_luc, 'danh_gia', c.danh_gia, 'hoan_luc', c.hoan_luc,
        'co_ho_so', c.ho_so is not null, 'tao_luc', c.tao_luc) order by c.tao_luc desc), '[]'::jsonb)
    from (select * from public.cau_hoi_chuyen_gia where user_id = (select auth.uid()) order by tao_luc desc limit 50) c
    left join public.don_nap d on d.ma_don = c.ma_don
$$;

create or replace function danh_gia_cau_hoi(p_id bigint, p_diem integer) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_diem is null or p_diem not between 1 and 5 then return jsonb_build_object('ket_qua', 'diem_khong_hop_le'); end if;
    update public.cau_hoi_chuyen_gia set danh_gia = p_diem
    where id = p_id and user_id = v_uid and trang_thai = 'da_tra_loi';
    return jsonb_build_object('ket_qua', case when found then 'da_ghi' else 'khong_doi' end);
end
$$;

-- Huỷ khi còn chờ thanh toán: câu → 'huy' (bỏ luôn ảnh chụp hồ sơ), đơn đang 'cho' → 'huy'.
create or replace function huy_cau_hoi(p_id bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_don bigint;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    update public.cau_hoi_chuyen_gia set trang_thai = 'huy', ho_so = null
    where id = p_id and user_id = v_uid and trang_thai = 'cho_tra' returning ma_don into v_don;
    if not found then return jsonb_build_object('ket_qua', 'khong_doi'); end if;
    update public.don_nap set trang_thai = 'huy' where ma_don = v_don and user_id = v_uid and trang_thai = 'cho';
    return jsonb_build_object('ket_qua', 'da_huy');
end
$$;

-- ---------------------------------------------------------------- (5) chuyên gia / quản trị (MFA, ghi nhật ký)
create or replace function cg_dong_quan_tri(c public.cau_hoi_chuyen_gia, p_email boolean) returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'id', c.id, 'mang', c.mang, 'cau_hoi', c.cau_hoi, 'ho_so', c.ho_so, 'gia_vnd', c.gia_vnd,
        'mien_phi_hoi_vien', c.mien_phi_hoi_vien, 'ma_don', c.ma_don,
        'trang_thai', c.trang_thai, 'qua_han', c.trang_thai = 'cho_tra_loi' and c.han_tra_loi < now(),
        'thanh_toan_luc', c.thanh_toan_luc, 'han_tra_loi', c.han_tra_loi, 'tra_loi', c.tra_loi, 'tra_loi_luc', c.tra_loi_luc,
        'danh_gia', c.danh_gia, 'hoan_luc', c.hoan_luc, 'ly_do_hoan', c.ly_do_hoan, 'tao_luc', c.tao_luc,
        'email', case when p_email then (select u.email from auth.users u where u.id = c.user_id) end)
$$;

-- Hàng đợi: mặc định mọi câu đã thanh toán (không gồm 'cho_tra' / 'huy'); p_trang_thai lọc một trạng thái. Chờ trả lời xếp theo
-- hạn gần nhất lên đầu. Email chỉ trả cho chủ sở hữu (để liên hệ hoàn tiền). Mỗi lần đọc ghi nhật ký (đọc ảnh chụp hồ sơ).
create or replace function ds_cau_hoi_chuyen_gia(p_trang_thai text default null, p_gioi_han integer default 50) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_vai text; v_kq jsonb;
begin
    v_vai := public.qt_can_vai_tro(array['chu_so_huu', 'tham_dinh']);
    v_kq := coalesce((select jsonb_agg(public.cg_dong_quan_tri(c, v_vai = 'chu_so_huu')
                                       order by (c.trang_thai = 'cho_tra_loi') desc, c.han_tra_loi asc nulls last, c.tao_luc desc)
                      from (select * from public.cau_hoi_chuyen_gia
                            where case when p_trang_thai is null then trang_thai not in ('cho_tra', 'huy') else trang_thai = p_trang_thai end
                            order by (trang_thai = 'cho_tra_loi') desc, han_tra_loi asc nulls last, tao_luc desc
                            limit least(greatest(coalesce(p_gioi_han, 50), 1), 200)) c), '[]'::jsonb);
    perform public.qt_ghi('chuyen_gia.doc', coalesce(p_trang_thai, 'tat_ca'), jsonb_build_object('so', jsonb_array_length(v_kq)));
    return v_kq;
end
$$;

create or replace function doc_cau_hoi_chuyen_gia(p_id bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_vai text; v_c public.cau_hoi_chuyen_gia;
begin
    v_vai := public.qt_can_vai_tro(array['chu_so_huu', 'tham_dinh']);
    select * into v_c from public.cau_hoi_chuyen_gia where id = p_id;
    if v_c.id is null then return null; end if;
    perform public.qt_ghi('chuyen_gia.doc_mot', p_id::text, null);
    return public.cg_dong_quan_tri(v_c, v_vai = 'chu_so_huu');
end
$$;

-- Trả lời: 20–6000 ký tự, không link / email / số điện thoại. Câu quá hạn chưa hoàn vẫn trả lời được (chủ sở hữu quyết hoàn riêng).
create or replace function tra_loi_cau_hoi(p_id bigint, p_tra_loi text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_tl text := trim(coalesce(p_tra_loi, '')); v_c public.cau_hoi_chuyen_gia;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'tham_dinh']);
    if char_length(v_tl) not between 20 and 6000 then return jsonb_build_object('ket_qua', 'tra_loi_khong_hop_le'); end if;
    if public.cg_co_lien_he(v_tl) then return jsonb_build_object('ket_qua', 'co_lien_he'); end if;
    select * into v_c from public.cau_hoi_chuyen_gia where id = p_id for update;
    if v_c.id is null then return jsonb_build_object('ket_qua', 'khong_co'); end if;
    if v_c.trang_thai not in ('cho_tra_loi', 'qua_han') then
        return jsonb_build_object('ket_qua', 'khong_doi', 'trang_thai', v_c.trang_thai);
    end if;
    update public.cau_hoi_chuyen_gia
    set trang_thai = 'da_tra_loi', tra_loi = v_tl, tra_loi_luc = now(), nguoi_tra_loi = (select auth.uid())
    where id = p_id;
    perform public.qt_ghi('chuyen_gia.tra_loi', p_id::text, jsonb_build_object('mang', v_c.mang, 'do_dai', char_length(v_tl),
        'tre_han', v_c.trang_thai = 'qua_han' or v_c.han_tra_loi < now()));
    return jsonb_build_object('ket_qua', 'da_tra_loi', 'id', p_id);
end
$$;

-- Đánh dấu quá hạn: cron ngày (service role) hoặc quản trị bấm. Trả số câu vừa đánh dấu; có thì ghi nhật ký.
create or replace function danh_dau_qua_han_chuyen_gia() returns integer
    language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
    if (select auth.uid()) is not null then perform public.qt_can_vai_tro(array['chu_so_huu', 'tham_dinh']); end if;
    update public.cau_hoi_chuyen_gia set trang_thai = 'qua_han' where trang_thai = 'cho_tra_loi' and han_tra_loi < now();
    get diagnostics v_n = row_count;
    if v_n > 0 then
        insert into public.nhat_ky_quan_tri (user_id, hanh_dong, doi_tuong, chi_tiet)
        values ((select auth.uid()), 'chuyen_gia.qua_han', null, jsonb_build_object('so', v_n));
    end if;
    return v_n;
end
$$;

-- Hoàn 100 %: chủ sở hữu đã chuyển tiền ngoài hệ thống rồi bấm → câu 'hoan', đơn 'hoan'. KHÔNG dùng hoan_don_nap (đơn không có Sao).
create or replace function hoan_cau_hoi(p_id bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_c public.cau_hoi_chuyen_gia;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_ly_do is null or char_length(trim(p_ly_do)) not between 5 and 120 then return jsonb_build_object('ket_qua', 'thieu_ly_do'); end if;
    select * into v_c from public.cau_hoi_chuyen_gia where id = p_id for update;
    if v_c.id is null then return jsonb_build_object('ket_qua', 'khong_co'); end if;
    if v_c.trang_thai not in ('cho_tra_loi', 'qua_han', 'da_tra_loi') or v_c.gia_vnd <= 0 then
        return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', v_c.trang_thai);
    end if;
    update public.cau_hoi_chuyen_gia set trang_thai = 'hoan', hoan_luc = now(), ly_do_hoan = left(trim(p_ly_do), 200) where id = p_id;
    update public.don_nap set trang_thai = 'hoan', ghi_chu = left('Hoàn câu hỏi chuyên gia #' || p_id || ': ' || trim(p_ly_do), 200)
    where ma_don = v_c.ma_don and trang_thai = 'da_tra';
    perform public.qt_ghi('chuyen_gia.hoan', p_id::text, jsonb_build_object('ma_don', v_c.ma_don, 'gia_vnd', v_c.gia_vnd,
                                                                            'ly_do', left(trim(p_ly_do), 120)));
    return jsonb_build_object('ket_qua', 'da_hoan', 'gia_vnd', v_c.gia_vnd, 'ma_don', v_c.ma_don);
end
$$;

-- Thống kê (chủ sở hữu + thẩm định): số câu theo trạng thái, doanh thu N ngày (đã thanh toán, chưa hoàn), đánh giá, giờ trả lời.
create or replace function thong_ke_chuyen_gia(p_ngay integer default 30) returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_tu timestamptz := now() - make_interval(days => least(greatest(coalesce(p_ngay, 30), 1), 365));
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'tham_dinh']);
    return jsonb_build_object(
        'ngay', least(greatest(coalesce(p_ngay, 30), 1), 365),
        'dang_cho', (select count(*) from public.cau_hoi_chuyen_gia where trang_thai = 'cho_tra_loi' and han_tra_loi >= now()),
        'qua_han', (select count(*) from public.cau_hoi_chuyen_gia
                    where trang_thai = 'qua_han' or (trang_thai = 'cho_tra_loi' and han_tra_loi < now())),
        'da_tra_loi', (select count(*) from public.cau_hoi_chuyen_gia where trang_thai = 'da_tra_loi' and tra_loi_luc >= v_tu),
        'hoan', (select count(*) from public.cau_hoi_chuyen_gia where trang_thai = 'hoan' and hoan_luc >= v_tu),
        'hoi_vien', (select count(*) from public.cau_hoi_chuyen_gia where mien_phi_hoi_vien and thanh_toan_luc >= v_tu),
        'doanh_thu_vnd', (select coalesce(sum(gia_vnd), 0) from public.cau_hoi_chuyen_gia
                          where thanh_toan_luc >= v_tu and trang_thai in ('cho_tra_loi', 'da_tra_loi', 'qua_han')),
        'so_danh_gia', (select count(*) from public.cau_hoi_chuyen_gia where danh_gia is not null and tra_loi_luc >= v_tu),
        'danh_gia_tb', (select round(avg(danh_gia)::numeric, 2) from public.cau_hoi_chuyen_gia where danh_gia is not null and tra_loi_luc >= v_tu),
        'gio_tra_loi_tb', (select round((avg(extract(epoch from tra_loi_luc - thanh_toan_luc)) / 3600)::numeric, 1)
                           from public.cau_hoi_chuyen_gia where trang_thai = 'da_tra_loi' and tra_loi_luc >= v_tu and thanh_toan_luc is not null));
end
$$;

-- Dọn (cron ngày, service role): bỏ ảnh chụp hồ sơ 30 ngày sau khi trả lời / hoàn / quá hạn, bỏ ngay với câu đã huỷ hoặc chưa trả
-- quá 30 ngày; xoá hẳn câu chưa thanh toán / đã huỷ sau 30 ngày. Câu hỏi + câu trả lời đã mua giữ nguyên.
create or replace function don_chuyen_gia() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare a integer; b integer;
begin
    update public.cau_hoi_chuyen_gia set ho_so = null
    where ho_so is not null and (
        (trang_thai = 'da_tra_loi' and tra_loi_luc < now() - interval '30 days')
        or (trang_thai in ('hoan', 'qua_han') and coalesce(hoan_luc, han_tra_loi, tao_luc) < now() - interval '30 days')
        or trang_thai = 'huy'
        or (trang_thai = 'cho_tra' and tao_luc < now() - interval '30 days'));
    get diagnostics a = row_count;
    delete from public.cau_hoi_chuyen_gia where trang_thai in ('cho_tra', 'huy') and tao_luc < now() - interval '30 days';
    get diagnostics b = row_count;
    return jsonb_build_object('xoa_ho_so', a, 'xoa_chua_tra', b);
end
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function cg_gia_vnd(), cg_giam_pt(), cg_han_gio(), cg_han_gio_cho(uuid), cg_da_tung_tra(uuid), cg_gia_cho(uuid), cg_loc_ho_so(jsonb),
    cg_co_lien_he(text), cg_don_da_tra(), cg_dong_quan_tri(public.cau_hoi_chuyen_gia, boolean),
    chuyen_gia_thong_tin(), tao_cau_hoi_chuyen_gia(text, text, jsonb, boolean, boolean, text), cau_hoi_cua_toi(),
    danh_gia_cau_hoi(bigint, integer), huy_cau_hoi(bigint), ds_cau_hoi_chuyen_gia(text, integer), doc_cau_hoi_chuyen_gia(bigint),
    tra_loi_cau_hoi(bigint, text), danh_dau_qua_han_chuyen_gia(), hoan_cau_hoi(bigint, text), thong_ke_chuyen_gia(integer),
    don_chuyen_gia() from public, anon, authenticated;
grant execute on function chuyen_gia_thong_tin() to anon, authenticated;
grant execute on function tao_cau_hoi_chuyen_gia(text, text, jsonb, boolean, boolean, text), cau_hoi_cua_toi(),
    danh_gia_cau_hoi(bigint, integer), huy_cau_hoi(bigint), ds_cau_hoi_chuyen_gia(text, integer), doc_cau_hoi_chuyen_gia(bigint),
    tra_loi_cau_hoi(bigint, text), danh_dau_qua_han_chuyen_gia(), hoan_cau_hoi(bigint, text), thong_ke_chuyen_gia(integer)
    to authenticated;
grant execute on function danh_dau_qua_han_chuyen_gia(), don_chuyen_gia() to service_role;
