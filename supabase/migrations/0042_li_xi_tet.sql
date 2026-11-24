-- LX-2027 (chủ dự án duyệt 24/11/2026: migration 0042 + giá 99.000 / 249.000 / 399.000 ₫ — docs/LI-XI-TET-2027.md).
-- "Lì xì Tết 2027": người mua trả VND (Pay2S) lấy 1 / 3 / 5 mã; mỗi mã mở trọn báo cáo "Thời gian tới" NĂM 2027 cho
-- MỘT người (một ngày sinh). Tặng NỘI DUNG — không phải Sao, không đổi ra tiền, không chuyển nhượng sau khi nhận.
--
-- Quyền của một bao (LX-QUYEN, chủ dự án giao em chọn 25/11/2026):
--   * Người nhận đăng nhập bấm "Nhận" → bao gắn với tài khoản (nhan_li_xi_tet).
--   * Lần đầu họ BẤM mở báo cáo năm 2027 bằng bao → bao gắn với khoá hồ sơ (HMAC ngày sinh do máy chủ web tính bằng bí mật
--     của nó, DB không thấy ngày sinh) → từ đó đọc lại báo cáo 2027 của đúng người ấy bao nhiêu lần cũng được, tới hết 2027.
--   * Một bao = một người. Muốn mở cho người thứ hai → cần bao thứ hai (combo 3 / 5 bao vì vậy có nghĩa).
-- Chữ người tặng gõ (tên ≤ 40, lời chúc ≤ 160) đi qua `lx_chu_bi_chan` (chặn link, email, số điện thoại / số tài khoản,
-- từ ngữ lừa đảo hay gặp) — web lọc trước bằng cùng luật (web/lib/li-xi-tet.ts). Tên không được chứa chữ số.
-- Bảng KHÔNG có policy: mọi truy cập qua hàm (như qua_tang_chuong, 0025).
-- Công tắc `sao.li_xi.bat` mặc định TẮT. Chạy SAU 0041. Rollback: 0042_li_xi_tet.down.sql

-- ---------------------------------------------------------------- (1) Nới don_nap.loai nhận 'li_xi'
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap add constraint don_nap_loai_check
    check (loai in ('sao', 'hoi_vien', 'chuyen_gia', 'li_xi'));

-- ---------------------------------------------------------------- (2) Bảng li_xi_tet
create table if not exists li_xi_tet (
    id              bigint generated always as identity primary key,
    ma              text not null unique check (ma ~ '^[a-f0-9]{16}$'),
    ma_don          bigint not null references don_nap (ma_don) on delete cascade,
    nguoi_tang_id   uuid not null references auth.users (id) on delete cascade,
    ten_nguoi_tang  text check (ten_nguoi_tang is null or char_length(ten_nguoi_tang) between 1 and 40),
    loi_chuc        text check (loi_chuc is null or char_length(loi_chuc) between 1 and 160),
    mau_thiep       text not null default 'do_son'
                    check (mau_thiep in ('do_son', 'mai_vang', 'ngoc_bich', 'dem_giao_thua')),
    nam             integer not null default 2027 check (nam between 2026 and 2099),
    trang_thai      text not null default 'cho_tra'
                    check (trang_thai in ('cho_tra', 'san_sang', 'da_nhan', 'hoan')),
    nguoi_nhan_id   uuid references auth.users (id) on delete set null,
    nhan_luc        timestamptz,
    -- LX-QUYEN: khoá hồ sơ (HMAC ngày sinh, web máy chủ ký) — gắn lần đầu người nhận bấm mở báo cáo bằng bao.
    khoa_ho_so      text check (khoa_ho_so is null or khoa_ho_so ~ '^lx:[a-f0-9]{40}$'),
    dung_luc        timestamptz,
    het_han         date not null default date '2027-03-31',
    tao_luc         timestamptz not null default now(),
    check ((khoa_ho_so is null) = (dung_luc is null)),
    check (khoa_ho_so is null or trang_thai = 'da_nhan')
);
create index if not exists li_xi_tet_don_idx on li_xi_tet (ma_don);
create index if not exists li_xi_tet_tang_idx on li_xi_tet (nguoi_tang_id, tao_luc desc);
create index if not exists li_xi_tet_nhan_idx on li_xi_tet (nguoi_nhan_id, nam) where trang_thai = 'da_nhan';

alter table li_xi_tet enable row level security;
revoke all on li_xi_tet from public, anon, authenticated;

-- ---------------------------------------------------------------- (3) Cấu hình (chủ sở hữu đổi ở /quan-tri/cai-dat)
insert into public.cau_hinh (khoa, gia_tri, mo_ta) values
    ('sao.li_xi.bat',   'false',  'LX-2027: bật bán Lì xì Tết 2027'),
    ('sao.li_xi.gia_1', '99000',  'LX-2027: giá 1 bao (VND)'),
    ('sao.li_xi.gia_3', '249000', 'LX-2027: giá 3 bao (VND)'),
    ('sao.li_xi.gia_5', '399000', 'LX-2027: giá 5 bao (VND)')
on conflict (khoa) do nothing;

-- Kẹp cùng khoảng với web/lib/cau-hinh.ts.
create or replace function lx_gia_goi(p_so_bao integer) returns integer
    language sql stable security definer set search_path = '' as $$
    select case p_so_bao
        when 1 then public.qt_so_cau_hinh('sao.li_xi.gia_1', 99000, 20000, 5000000)
        when 3 then public.qt_so_cau_hinh('sao.li_xi.gia_3', 249000, 50000, 10000000)
        when 5 then public.qt_so_cau_hinh('sao.li_xi.gia_5', 399000, 80000, 20000000)
        else 0
    end
$$;

create or replace function lx_bat() returns boolean
    language sql stable security definer set search_path = '' as $$
    select public.qt_bat_cau_hinh('sao.li_xi.bat')
$$;

-- Chữ người tặng gõ có chứa thứ không được hiện dưới tên miền hieuban.com không (true = chặn).
-- Giống hệt `chuBiChan` ở web/lib/li-xi-tet.ts (test hai phía cùng bộ câu).
create or replace function lx_chu_bi_chan(p text) returns boolean
    language sql immutable set search_path = '' as $$
    select p is not null and (
        p ~* '(https?:|www\.|\.(com|vn|net|org|io|me|xyz|top|info|link|app|site|online|shop)([^a-z]|$)|@|bit\.ly|tinyurl)'
        or p ~ '[0-9][0-9 .\-]{5,}[0-9]'
        or p ~* '(zalo|telegram|viber|whatsapp|facebook|\ystk\y|t[aà]i kho[aả]n|chuy[eể]n kho[aả]n|ng[aâ]n h[aà]ng|\yotp\y|m[aậ]t kh[aẩ]u|m[aã] x[aá]c (nh[aậ]n|th[uự]c)|tr[uú]ng th[uư][oở]ng|nh[aậ]n th[uư][oở]ng|b[aấ]m v[aà]o|nh[aấ]n v[aà]o|đăng nh[aậ]p|dang nhap)'
    )
$$;

-- ---------------------------------------------------------------- (4) Trả tiền → bao sẵn sàng gửi (idempotent)
create or replace function lx_don_doi_trang_thai() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    if new.loai = 'li_xi' and old.trang_thai is distinct from new.trang_thai then
        if new.trang_thai = 'da_tra' then
            update public.li_xi_tet set trang_thai = 'san_sang' where ma_don = new.ma_don and trang_thai = 'cho_tra';
        elsif new.trang_thai = 'hoan' then
            update public.li_xi_tet set trang_thai = 'hoan' where ma_don = new.ma_don and trang_thai in ('cho_tra', 'san_sang');
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists lx_don_da_tra_trg on don_nap;
create trigger lx_don_da_tra_trg
    after update of trang_thai on don_nap
    for each row execute function lx_don_doi_trang_thai();

-- ---------------------------------------------------------------- (5) Hàm công khai & người dùng
create or replace function li_xi_thong_tin() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('bat', public.lx_bat(), 'gia_1', public.lx_gia_goi(1), 'gia_3', public.lx_gia_goi(3),
        'gia_5', public.lx_gia_goi(5), 'nam', 2027, 'han', '2027-03-31')
$$;

create or replace function tao_don_li_xi(p_cong text, p_so_bao integer, p_mau_thiep text default 'do_son',
                                         p_ten_nguoi_tang text default null, p_loi_chuc text default null)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_gia integer;
    v_don bigint;
    v_ten text := nullif(btrim(coalesce(p_ten_nguoi_tang, '')), '');
    v_chuc text := nullif(btrim(coalesce(p_loi_chuc, '')), '');
    v_ma text;
    v_ds text[] := '{}';
begin
    if v_uid is null then return jsonb_build_object('ket_qua', 'chua_dang_nhap'); end if;
    if not public.lx_bat() then return jsonb_build_object('ket_qua', 'chua_mo'); end if;
    if p_cong is null or p_cong not in ('pay2s', 'gia') then return jsonb_build_object('ket_qua', 'cong_khong_hop_le'); end if;
    if p_so_bao is null or p_so_bao not in (1, 3, 5) then return jsonb_build_object('ket_qua', 'goi_khong_hop_le'); end if;
    if p_mau_thiep is null or p_mau_thiep not in ('do_son', 'mai_vang', 'ngoc_bich', 'dem_giao_thua') then
        return jsonb_build_object('ket_qua', 'mau_khong_hop_le');
    end if;
    if v_ten is not null and (char_length(v_ten) > 40 or v_ten ~ '[0-9]' or public.lx_chu_bi_chan(v_ten)) then
        return jsonb_build_object('ket_qua', 'ten_khong_hop_le');
    end if;
    if v_chuc is not null and (char_length(v_chuc) > 160 or public.lx_chu_bi_chan(v_chuc)) then
        return jsonb_build_object('ket_qua', 'loi_chuc_khong_hop_le');
    end if;
    -- Như tao_don_nap (0012): tối đa 5 đơn đang chờ mỗi tài khoản.
    perform pg_advisory_xact_lock(hashtext('don_nap:' || v_uid::text));
    if (select count(*) from public.don_nap
        where user_id = v_uid and trang_thai = 'cho' and het_han > now()) >= 5 then
        return jsonb_build_object('ket_qua', 'qua_nhieu_don');
    end if;

    v_gia := public.lx_gia_goi(p_so_bao);
    insert into public.don_nap (user_id, loai, goi, sao, so_tien, cong, trang_thai)
    values (v_uid, 'li_xi', null, 0, v_gia, p_cong, 'cho')
    returning ma_don into v_don;

    for i in 1..p_so_bao loop
        v_ma := encode(substring(public.sao_byte_ngau_nhien() from 1 for 8), 'hex');
        insert into public.li_xi_tet (ma, ma_don, nguoi_tang_id, ten_nguoi_tang, loi_chuc, mau_thiep, nam)
        values (v_ma, v_don, v_uid, v_ten, v_chuc, p_mau_thiep, 2027);
        v_ds := array_append(v_ds, v_ma);
    end loop;

    return jsonb_build_object('ket_qua', 'da_tao', 'ma_don', v_don, 'so_tien', v_gia, 'so_bao', p_so_bao, 'ma_ds', to_jsonb(v_ds));
end;
$$;

-- Xem một bao (trang /li-xi/[ma]): chỉ tên hiển thị + lời chúc + mẫu thiệp + trạng thái. Không người mua, không người nhận.
create or replace function xem_li_xi_tet(p_ma text) returns jsonb
    language sql stable security definer set search_path = '' as $$
    select coalesce((
        select jsonb_build_object('co', true, 'ma', l.ma, 'ten_nguoi_tang', l.ten_nguoi_tang, 'loi_chuc', l.loi_chuc,
            'mau_thiep', l.mau_thiep, 'nam', l.nam, 'trang_thai', l.trang_thai, 'het_han', l.het_han,
            'con_han', (l.het_han >= (now() at time zone 'Asia/Ho_Chi_Minh')::date))
        from public.li_xi_tet l
        where l.ma = p_ma and l.trang_thai in ('san_sang', 'da_nhan')
    ), jsonb_build_object('co', false))
$$;

-- Người nhận nhận bao (một mã dùng một lần).
create or replace function nhan_li_xi_tet(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    r public.li_xi_tet;
begin
    if v_uid is null then return jsonb_build_object('ket_qua', 'chua_dang_nhap'); end if;
    select * into r from public.li_xi_tet where ma = p_ma for update;
    if not found or r.trang_thai not in ('san_sang', 'da_nhan') then return jsonb_build_object('ket_qua', 'khong_co'); end if;
    if r.trang_thai = 'da_nhan' then
        if r.nguoi_nhan_id = v_uid then return jsonb_build_object('ket_qua', 'da_nhan_boi_ban', 'nam', r.nam); end if;
        return jsonb_build_object('ket_qua', 'da_co_nguoi_nhan');
    end if;
    if r.het_han < (now() at time zone 'Asia/Ho_Chi_Minh')::date then return jsonb_build_object('ket_qua', 'het_han'); end if;
    update public.li_xi_tet set trang_thai = 'da_nhan', nguoi_nhan_id = v_uid, nhan_luc = now() where id = r.id;
    return jsonb_build_object('ket_qua', 'da_nhan', 'nam', r.nam);
end;
$$;

-- LX-QUYEN: tình trạng quyền đọc báo cáo năm p_nam của khoá hồ sơ p_khoa với tài khoản đang đăng nhập.
--   da_gan = đã có bao gắn với hồ sơ này · con = số bao đã nhận, chưa gắn, còn dùng được trong năm p_nam.
create or replace function li_xi_trang_thai(p_khoa text, p_nam integer) returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'da_gan', exists (select 1 from public.li_xi_tet
            where nguoi_nhan_id = (select auth.uid()) and trang_thai = 'da_nhan' and nam = p_nam and khoa_ho_so = p_khoa),
        'con', (select count(*) from public.li_xi_tet
            where nguoi_nhan_id = (select auth.uid()) and trang_thai = 'da_nhan' and nam = p_nam and khoa_ho_so is null
              and (now() at time zone 'Asia/Ho_Chi_Minh')::date <= make_date(p_nam, 12, 31)))
$$;

-- LX-QUYEN: dùng một bao cho hồ sơ p_khoa (người dùng đã BẤM mở). Đã gắn sẵn → không tốn bao nào nữa.
create or replace function li_xi_dung(p_khoa text, p_nam integer) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_id bigint;
begin
    if v_uid is null then return jsonb_build_object('ket_qua', 'chua_dang_nhap'); end if;
    if p_khoa is null or p_khoa !~ '^lx:[a-f0-9]{40}$' then return jsonb_build_object('ket_qua', 'khoa_khong_hop_le'); end if;
    if exists (select 1 from public.li_xi_tet where nguoi_nhan_id = v_uid and trang_thai = 'da_nhan'
               and nam = p_nam and khoa_ho_so = p_khoa) then
        return jsonb_build_object('ket_qua', 'da_gan');
    end if;
    if (now() at time zone 'Asia/Ho_Chi_Minh')::date > make_date(p_nam, 12, 31) then
        return jsonb_build_object('ket_qua', 'khong_con');
    end if;
    select id into v_id from public.li_xi_tet
    where nguoi_nhan_id = v_uid and trang_thai = 'da_nhan' and nam = p_nam and khoa_ho_so is null
    order by nhan_luc, id limit 1 for update skip locked;
    if v_id is null then return jsonb_build_object('ket_qua', 'khong_con'); end if;
    update public.li_xi_tet set khoa_ho_so = p_khoa, dung_luc = now() where id = v_id;
    return jsonb_build_object('ket_qua', 'da_dung');
end;
$$;

-- Bao đã tặng & đã nhận của chính tài khoản. Bao của đơn đã huỷ / quá hạn chờ không hiện.
create or replace function ds_li_xi_cua_toi() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'da_tang', coalesce((
            select jsonb_agg(jsonb_build_object('ma', l.ma, 'ma_don', l.ma_don, 'ten_nguoi_tang', l.ten_nguoi_tang,
                'loi_chuc', l.loi_chuc, 'mau_thiep', l.mau_thiep, 'nam', l.nam, 'trang_thai', l.trang_thai,
                'het_han', l.het_han, 'nhan_luc', l.nhan_luc, 'tao_luc', l.tao_luc) order by l.tao_luc desc, l.id)
            from public.li_xi_tet l join public.don_nap d on d.ma_don = l.ma_don
            where l.nguoi_tang_id = (select auth.uid())
              and (l.trang_thai <> 'cho_tra' or (d.trang_thai = 'cho' and d.het_han > now()))
        ), '[]'::jsonb),
        'da_nhan', coalesce((
            select jsonb_agg(jsonb_build_object('ma', l.ma, 'ten_nguoi_tang', l.ten_nguoi_tang, 'loi_chuc', l.loi_chuc,
                'mau_thiep', l.mau_thiep, 'nam', l.nam, 'nhan_luc', l.nhan_luc, 'da_dung', l.khoa_ho_so is not null)
                order by l.nhan_luc desc)
            from public.li_xi_tet l where l.nguoi_nhan_id = (select auth.uid()) and l.trang_thai = 'da_nhan'
        ), '[]'::jsonb)
    )
$$;

-- Hoàn tiền một đơn Lì xì — CHỈ chạy ở Supabase SQL Editor (không cấp cho tài khoản web nào), SAU khi chủ dự án đã
-- chuyển trả tiền ngoài. Chỉ đơn đã trả và CHƯA có bao nào được nhận. Không dùng hoan_don_nap (0028) cho đơn này.
create or replace function hoan_don_li_xi(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_da_nhan integer;
begin
    if p_ly_do is null or char_length(btrim(p_ly_do)) not between 5 and 120 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don and loai = 'li_xi' for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.trang_thai <> 'da_tra' then
        return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', v_don.trang_thai);
    end if;
    perform 1 from public.li_xi_tet where ma_don = p_ma_don for update;
    select count(*) into v_da_nhan from public.li_xi_tet where ma_don = p_ma_don and trang_thai = 'da_nhan';
    if v_da_nhan > 0 then return jsonb_build_object('ket_qua', 'da_co_bao_duoc_nhan', 'so_da_nhan', v_da_nhan); end if;
    update public.don_nap set trang_thai = 'hoan', ghi_chu = left('Hoàn lì xì: ' || btrim(p_ly_do), 200)
    where ma_don = p_ma_don;   -- trigger lx_don_da_tra_trg chuyển các bao sang 'hoan'
    return jsonb_build_object('ket_qua', 'da_hoan', 'ma_don', p_ma_don, 'so_tien', v_don.so_tien);
end;
$$;

revoke all on function lx_gia_goi(integer), lx_bat(), lx_chu_bi_chan(text), lx_don_doi_trang_thai(), li_xi_thong_tin(),
    tao_don_li_xi(text, integer, text, text, text), xem_li_xi_tet(text), nhan_li_xi_tet(text),
    li_xi_trang_thai(text, integer), li_xi_dung(text, integer), ds_li_xi_cua_toi(), hoan_don_li_xi(bigint, text)
    from public, anon, authenticated;

grant execute on function li_xi_thong_tin(), xem_li_xi_tet(text) to anon, authenticated;
grant execute on function tao_don_li_xi(text, integer, text, text, text), nhan_li_xi_tet(text),
    li_xi_trang_thai(text, integer), li_xi_dung(text, integer), ds_li_xi_cua_toi() to authenticated;
