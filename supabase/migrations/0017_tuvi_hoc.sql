-- LG-ĐS tầng HỌC Tử vi (2026-10-21, chủ dự án duyệt — docs/LUAN-GIAI-DOI-SONG.md mục 3–5): GĐ1 + GĐ2 (pgvector).
--   * kiem_chung_phieu: phiếu "Đúng với mình / Chưa đúng" trên thẻ Tử vi — MỘT phiếu / người / mã (đổi ý = cập nhật,
--     không cộng dồn). `khoa` = HMAC máy chủ của user_id hoặc IP (không lưu IP); user_id chỉ có khi đăng nhập (để chủ
--     xem/xoá phiếu của mình, cascade khi xoá tài khoản). Chỉ MÃ tất định, không chữ, không lá số. Hết hạn 24 tháng.
--   * ty_le_kiem_chung: số đúng / chưa đúng theo mã (≥ ngưỡng) — web công khai "x% thấy đúng" qua route có cache.
--   * luan_giai_luu: bài luận người dùng CHỦ ĐỘNG lưu (hoặc bật "tự lưu" — không tích sẵn). RLS chủ sở hữu, ≤ 100 bài,
--     ≤ 256 KB / bài, hết hạn 365 ngày, xoá ngay.  * tuy_chon_hoc: công tắc tự lưu (mặc định tắt).
--   * cau_hoi_vec: kho vectơ ý định câu hỏi (câu ĐÃ LỌC bởi engine, không user_id). Người dùng bấm "Đúng ý tôi hỏi"
--     → gộp vào câu gần trùng (cos ≥ 0,95 cùng ý định) hoặc thêm "chờ duyệt"; ≥ 3 khoá khác nhau (≥ 1 người đăng nhập) → "hoạt động".
--     Quản trị tắt được. Máy KHÔNG sinh câu luận, KHÔNG sửa KB, chữ người dùng không bao giờ vào lời nhắc AI.
-- Mọi hàm: security definer + search_path = ''. Không BEGIN/COMMIT (chạy bằng psql -1 hoặc SQL Editor).
-- Cần extension pgvector (Supabase: Database → Extensions → vector, schema `extensions`; lệnh dưới tự bật nếu được).
-- Chạy SAU 0016. Rollback: 0017_tuvi_hoc.down.sql (không gỡ extension).

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- ------------------------------------------------------------------ 1. Kiểm chứng (GĐ1)
create table if not exists kiem_chung_phieu (
    id       bigint generated always as identity primary key,
    khoa     text not null check (khoa ~ '^[a-f0-9]{32,64}$'),
    user_id  uuid references auth.users (id) on delete cascade,
    loai     text not null check (loai in ('phi_hoa', 'nhip_3_thang', 'doi_song')),
    mau      text not null check (mau ~ '^[a-z0-9_.+-]{3,60}$'),
    phai     text not null check (phai ~ '^[a-z0-9_]{2,32}$'),
    ket_qua  text not null check (ket_qua in ('dung', 'chua_dung')),
    tao_luc  timestamptz not null default now(),
    cap_nhat timestamptz not null default now(),
    het_han  timestamptz not null default now() + interval '24 months',
    unique (khoa, loai, mau)
);
create index if not exists kiem_chung_phieu_mau on kiem_chung_phieu (mau);
create index if not exists kiem_chung_phieu_user on kiem_chung_phieu (user_id) where user_id is not null;
create index if not exists kiem_chung_phieu_het_han on kiem_chung_phieu (het_han);
alter table kiem_chung_phieu enable row level security;
drop policy if exists kiem_chung_chu_xem on kiem_chung_phieu;
create policy kiem_chung_chu_xem on kiem_chung_phieu for select to authenticated
    using (user_id = (select auth.uid()) and het_han > now());
drop policy if exists kiem_chung_chu_xoa on kiem_chung_phieu;
create policy kiem_chung_chu_xoa on kiem_chung_phieu for delete to authenticated
    using (user_id = (select auth.uid()));
revoke all on kiem_chung_phieu from public, anon, authenticated;
grant select, delete on kiem_chung_phieu to authenticated;

-- Mã có hợp lệ không (dùng chung ghi + kiểm thử). phi_hoa / nhip_3_thang: danh mục cố định (khớp web/lib/kiem-chung.ts
-- và calc/tuvi_luu_nguyet.PHAI — thêm phái mới = sửa cả hai). doi_song: mã `ds.*` engine dựng (tuvi_doi_song).
create or replace function kiem_chung_ma_hop_le(p_loai text, p_mau text, p_phai text) returns boolean
    language plpgsql immutable set search_path = '' as $$
declare
    c_cung constant text[] := array['menh','phu_mau','phuc_duc','dien_trach','quan_loc','no_boc',
                                    'thien_di','tat_ach','tai_bach','tu_nu','phu_the','huynh_de'];
    c_phai_nhip constant text[] := array['dau_quan_thai_tue','dau_quan_tieu_han','tieu_han','luu_nien','dia_chi_thang'];
    v text[] := string_to_array(coalesce(p_mau, ''), '.');
begin
    if p_mau is null or p_mau !~ '^[a-z0-9_.+-]{3,60}$' or p_phai is null or p_phai !~ '^[a-z0-9_]{2,32}$' then
        return false;
    end if;
    if p_loai = 'phi_hoa' then
        return p_phai = 'phi_tinh' and coalesce(array_length(v, 1), 0) = 4
           and v[1] = any (array['mau','ky_xung','loc_nhap','tu_hoa'])
           and v[2] = any (c_cung)
           and v[3] = any (array['loc','quyen','khoa','ky'])
           and v[4] = any (c_cung || array['tu']);
    elsif p_loai = 'nhip_3_thang' then
        return p_phai = any (c_phai_nhip) and coalesce(array_length(v, 1), 0) = 2
           and v[1] = any (array['thuan','binh','can_than'])
           and (v[2] = '-' or string_to_array(v[2], '+') <@ array['ck','kg','kx','ln','sl']);
    elsif p_loai = 'doi_song' then
        return p_mau ~ '^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$';
    end if;
    return false;
end
$$;

-- Ghi / đổi một phiếu (web máy chủ, service role, sau hạn mức). Trả true nếu đã lưu.
create or replace function ghi_kiem_chung(p_khoa text, p_user_id uuid, p_loai text, p_mau text, p_phai text,
                                          p_ket_qua text) returns boolean
    language plpgsql security definer set search_path = '' as $$
begin
    if p_ket_qua is null or p_ket_qua not in ('dung', 'chua_dung') then return false; end if;
    if p_khoa is null or p_khoa !~ '^[a-f0-9]{32,64}$' then return false; end if;
    if not public.kiem_chung_ma_hop_le(p_loai, p_mau, p_phai) then return false; end if;
    -- Chặn bơm: một khoá tối đa 3000 mã còn hạn (người thật bấm vài chục).
    if not exists (select 1 from public.kiem_chung_phieu where khoa = p_khoa and loai = p_loai and mau = p_mau)
       and (select count(*) from public.kiem_chung_phieu where khoa = p_khoa) >= 3000 then
        return false;
    end if;
    insert into public.kiem_chung_phieu as k (khoa, user_id, loai, mau, phai, ket_qua)
    values (p_khoa, p_user_id, p_loai, p_mau, p_phai, p_ket_qua)
    on conflict (khoa, loai, mau) do update
        set ket_qua = excluded.ket_qua, phai = excluded.phai, user_id = coalesce(excluded.user_id, k.user_id),
            cap_nhat = now(), het_han = now() + interval '24 months';
    return true;
end
$$;

-- Số đúng / chưa đúng theo mã (gộp mọi phái, chỉ phiếu còn hạn), chỉ mã ≥ p_toi_thieu phiếu, tối đa 5000 mã.
create or replace function ty_le_kiem_chung(p_mau text[] default null, p_toi_thieu integer default 30)
    returns table (mau text, dung integer, chua_dung integer)
    language sql stable security definer set search_path = '' as $$
    select k.mau, (count(*) filter (where k.ket_qua = 'dung'))::int, (count(*) filter (where k.ket_qua = 'chua_dung'))::int
    from public.kiem_chung_phieu k
    where k.het_han > now() and (p_mau is null or k.mau = any (p_mau[1:1000]))
    group by k.mau
    having count(*) >= greatest(coalesce(p_toi_thieu, 30), 1)
    order by count(*) desc, k.mau
    limit 5000
$$;

-- ------------------------------------------------------------------ 2. Bài luận đã lưu + tuỳ chọn
create table if not exists luan_giai_luu (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
    mo_dun         text not null check (mo_dun ~ '^[a-z0-9_]{2,20}$'),
    tieu_de        text not null check (char_length(tieu_de) between 1 and 200),
    noi_dung       jsonb not null,
    engine_version text check (char_length(engine_version) <= 20),
    tao_luc        timestamptz not null default now(),
    het_han        timestamptz not null default now() + interval '365 days'
);
create index if not exists luan_giai_luu_user on luan_giai_luu (user_id, tao_luc desc);
create index if not exists luan_giai_luu_het_han on luan_giai_luu (het_han);
alter table luan_giai_luu enable row level security;
drop policy if exists luan_giai_chu_xem on luan_giai_luu;
create policy luan_giai_chu_xem on luan_giai_luu for select to authenticated
    using (user_id = (select auth.uid()) and het_han > now());
drop policy if exists luan_giai_chu_them on luan_giai_luu;
create policy luan_giai_chu_them on luan_giai_luu for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists luan_giai_chu_xoa on luan_giai_luu;
create policy luan_giai_chu_xoa on luan_giai_luu for delete to authenticated
    using (user_id = (select auth.uid()));
revoke all on luan_giai_luu from public, anon, authenticated;
grant select, insert, delete on luan_giai_luu to authenticated;

-- Máy chủ đặt chủ sở hữu + mốc thời gian (người dùng không tự kéo dài hạn), dọn bài hết hạn, chặn > 256 KB và > 100 bài.
create or replace function luan_giai_luu_gioi_han() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    new.user_id := coalesce((select auth.uid()), new.user_id);
    new.tao_luc := now();
    new.het_han := now() + interval '365 days';
    if octet_length(new.noi_dung::text) > 262144 then raise exception 'bai_qua_lon'; end if;
    delete from public.luan_giai_luu where user_id = new.user_id and het_han <= now();
    if (select count(*) from public.luan_giai_luu where user_id = new.user_id) >= 100 then
        raise exception 'qua_100_bai';
    end if;
    return new;
end
$$;
drop trigger if exists luan_giai_luu_gioi_han on luan_giai_luu;
create trigger luan_giai_luu_gioi_han before insert on luan_giai_luu for each row execute function luan_giai_luu_gioi_han();

create table if not exists tuy_chon_hoc (
    user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
    tu_luu_luan_giai boolean not null default false,
    dong_y_luc       timestamptz,
    cap_nhat         timestamptz not null default now()
);
alter table tuy_chon_hoc enable row level security;
drop policy if exists tuy_chon_chu_xem on tuy_chon_hoc;
create policy tuy_chon_chu_xem on tuy_chon_hoc for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists tuy_chon_chu_them on tuy_chon_hoc;
create policy tuy_chon_chu_them on tuy_chon_hoc for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists tuy_chon_chu_sua on tuy_chon_hoc;
create policy tuy_chon_chu_sua on tuy_chon_hoc for update to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists tuy_chon_chu_xoa on tuy_chon_hoc;
create policy tuy_chon_chu_xoa on tuy_chon_hoc for delete to authenticated using (user_id = (select auth.uid()));
revoke all on tuy_chon_hoc from public, anon, authenticated;
grant select, insert, update, delete on tuy_chon_hoc to authenticated;

-- Mốc đồng ý do máy chủ đặt: bật → now(), tắt → null.
create or replace function tuy_chon_hoc_moc() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    new.user_id := coalesce((select auth.uid()), new.user_id);
    new.cap_nhat := now();
    if new.tu_luu_luan_giai then
        new.dong_y_luc := case when tg_op = 'UPDATE' and old.tu_luu_luan_giai then old.dong_y_luc else now() end;
    else
        new.dong_y_luc := null;
    end if;
    return new;
end
$$;
drop trigger if exists tuy_chon_hoc_moc on tuy_chon_hoc;
create trigger tuy_chon_hoc_moc before insert or update on tuy_chon_hoc for each row execute function tuy_chon_hoc_moc();

-- ------------------------------------------------------------------ 3. Kho vectơ ý định (GĐ2, pgvector)
create table if not exists cau_hoi_vec (
    id            bigint generated always as identity primary key,
    mo_dun        text not null check (mo_dun ~ '^[a-z_]{2,20}$'),
    y_dinh        text not null check (y_dinh ~ '^[a-z_]{2,40}$'),
    cau           text not null check (char_length(cau) between 3 and 300),
    vec           extensions.vector(512) not null,
    mo_hinh       text not null check (mo_hinh ~ '^[a-z0-9_.-]{2,40}$'),
    nguon         text not null check (nguon in ('kho', 'nguoi_dung', 'bien_tap')),
    so_xac_nhan   integer not null default 0 check (so_xac_nhan >= 0),
    khoa_xac_nhan text[] not null default '{}' check (cardinality(khoa_xac_nhan) <= 20),
    -- Số khoá xác nhận là người ĐĂNG NHẬP — tự bật cần ≥ 1 (chặn 3 IP giả tự đưa câu vào kho).
    so_dang_nhap  integer not null default 0 check (so_dang_nhap >= 0),
    trang_thai    text not null default 'cho_duyet' check (trang_thai in ('hoat_dong', 'cho_duyet', 'tat')),
    tao_luc       timestamptz not null default now(),
    cap_nhat      timestamptz not null default now(),
    unique (mo_dun, mo_hinh, cau)
);
create index if not exists cau_hoi_vec_hnsw on cau_hoi_vec using hnsw (vec extensions.vector_cosine_ops);
create index if not exists cau_hoi_vec_loc on cau_hoi_vec (mo_dun, mo_hinh, trang_thai);
alter table cau_hoi_vec enable row level security;          -- không policy: chỉ hàm service role / quản trị
revoke all on cau_hoi_vec from public, anon, authenticated;

-- Ý định hợp lệ theo mô-đun (khớp engine hoidap/tuvi.Y_DINH_CAU_HINH — thêm ý định = sửa cả hai, test bắt).
create or replace function y_dinh_hop_le(p_mo_dun text, p_y_dinh text) returns boolean
    language sql immutable set search_path = '' as $$
    select coalesce(p_mo_dun = 'tuvi' and p_y_dinh = any (array['di_hay_o','tai_van','hoc_hanh_con','phan_van',
        'ba_thang_toi','chon_thoi_diem','tong_quan_nam','hieu_ban_than']), false)
$$;

-- jsonb mảng 512 số → vector (null nếu sai dạng).
create or replace function vec_tu_jsonb(p jsonb) returns extensions.vector
    language plpgsql immutable set search_path = '' as $$
begin
    if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 512 then return null; end if;
    return (p::text)::extensions.vector(512);
exception when others then
    return null;
end
$$;

-- Láng giềng gần nhất (cosine, HNSW) trong các câu đang hoạt động. Trả 0–p_so dòng có độ gần ≥ ngưỡng.
create or replace function tim_y_dinh_gan(p_mo_dun text, p_vec jsonb, p_mo_hinh text, p_nguong real default 0.82,
                                          p_so integer default 1)
    returns table (id bigint, y_dinh text, do_gan real)
    language plpgsql stable security definer set search_path = '' as $$
declare v extensions.vector := public.vec_tu_jsonb(p_vec);
begin
    if v is null then return; end if;
    return query
        select g.id, g.y_dinh, g.do_gan from (
            select c.id, c.y_dinh, (1 - (c.vec operator(extensions.<=>) v))::real as do_gan
            from public.cau_hoi_vec c
            where c.mo_dun = p_mo_dun and c.mo_hinh = p_mo_hinh and c.trang_thai = 'hoat_dong'
            order by c.vec operator(extensions.<=>) v
            limit least(greatest(coalesce(p_so, 1), 1), 5)) g
        where g.do_gan >= coalesce(p_nguong, 0.82);
end
$$;

-- Người dùng bấm "Đúng ý tôi hỏi": gộp vào câu gần trùng (cos ≥ 0,95, cùng ý định) hoặc thêm câu "chờ duyệt".
-- ≥ 3 khoá khác nhau (≥ 1 người đăng nhập) → "hoạt động". Câu đã bị quản trị tắt thì không bật lại. `p_cau` là câu ĐÃ LỌC bởi engine.
create or replace function xac_nhan_y_dinh(p_mo_dun text, p_y_dinh text, p_cau text, p_vec jsonb, p_mo_hinh text,
                                           p_khoa text, p_dang_nhap boolean default false) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v extensions.vector := public.vec_tu_jsonb(p_vec);
    v_cau text := btrim(coalesce(p_cau, ''));
    g record;
    v_khoa text[];
    v_tt text;
begin
    if v is null or not public.y_dinh_hop_le(p_mo_dun, p_y_dinh) or p_khoa is null or p_khoa !~ '^[a-f0-9]{32,64}$'
       or p_mo_hinh is null or p_mo_hinh !~ '^[a-z0-9_.-]{2,40}$' or char_length(v_cau) not between 3 and 300 then
        return jsonb_build_object('ok', false, 'ly_do', 'khong_hop_le');
    end if;
    -- Không lọt thông tin liên hệ (engine đã lọc; chặn lần nữa).
    if v_cau ~ '[0-9]{6,}|@|https?://' then return jsonb_build_object('ok', false, 'ly_do', 'khong_hop_le'); end if;
    select c.id, c.trang_thai, c.khoa_xac_nhan, c.so_dang_nhap, (1 - (c.vec operator(extensions.<=>) v)) as do_gan into g
    from public.cau_hoi_vec c
    where c.mo_dun = p_mo_dun and c.mo_hinh = p_mo_hinh and c.y_dinh = p_y_dinh
    order by c.vec operator(extensions.<=>) v limit 1;
    if g.id is not null and g.do_gan >= 0.95 then
        if g.trang_thai = 'tat' then
            return jsonb_build_object('ok', true, 'id', g.id, 'trang_thai', 'tat', 'gop', true);
        end if;
        if p_khoa = any (g.khoa_xac_nhan) then
            return jsonb_build_object('ok', true, 'id', g.id, 'trang_thai', g.trang_thai, 'gop', true, 'da_co', true);
        end if;
        v_khoa := (array[p_khoa] || g.khoa_xac_nhan)[1:20];
        update public.cau_hoi_vec set khoa_xac_nhan = v_khoa, so_xac_nhan = so_xac_nhan + 1, cap_nhat = now(),
            so_dang_nhap = so_dang_nhap + (case when coalesce(p_dang_nhap, false) then 1 else 0 end),
            trang_thai = case when trang_thai = 'cho_duyet' and cardinality(v_khoa) >= 3
                                   and g.so_dang_nhap + (case when coalesce(p_dang_nhap, false) then 1 else 0 end) >= 1
                              then 'hoat_dong' else trang_thai end
        where id = g.id returning trang_thai into v_tt;
        return jsonb_build_object('ok', true, 'id', g.id, 'trang_thai', v_tt, 'gop', true);
    end if;
    -- Chặn bơm câu mới: một khoá ≤ 50 câu chờ duyệt, cả kho ≤ 20000 câu chờ duyệt.
    if (select count(*) from public.cau_hoi_vec where trang_thai = 'cho_duyet' and p_khoa = any (khoa_xac_nhan)) >= 50
       or (select count(*) from public.cau_hoi_vec where trang_thai = 'cho_duyet') >= 20000 then
        return jsonb_build_object('ok', false, 'ly_do', 'qua_nhieu');
    end if;
    insert into public.cau_hoi_vec (mo_dun, y_dinh, cau, vec, mo_hinh, nguon, so_xac_nhan, khoa_xac_nhan, so_dang_nhap, trang_thai)
    values (p_mo_dun, p_y_dinh, v_cau, v, p_mo_hinh, 'nguoi_dung', 1, array[p_khoa],
            case when coalesce(p_dang_nhap, false) then 1 else 0 end, 'cho_duyet')
    on conflict (mo_dun, mo_hinh, cau) do nothing
    returning id into g;
    -- Trùng nguyên câu đã có với ý định KHÁC → không ghi (để người duyệt xử lý câu sẵn có), không báo "đã lưu".
    if g.id is null then return jsonb_build_object('ok', false, 'ly_do', 'trung_cau'); end if;
    return jsonb_build_object('ok', true, 'id', g.id, 'trang_thai', 'cho_duyet', 'gop', false);
end
$$;

-- Nạp kho gốc (nút "Dựng kho vectơ"): p_ds = [{y_dinh, cau, vec}] từ engine /v1/nhung/kho. Câu kho → hoạt động;
-- câu đã có thì cập nhật vectơ + ý định (không bật lại câu quản trị đã tắt). Trả số dòng nạp.
create or replace function nap_kho_vec(p_mo_dun text, p_mo_hinh text, p_ds jsonb) returns integer
    language plpgsql security definer set search_path = '' as $$
declare e jsonb; v extensions.vector; n integer := 0;
begin
    if jsonb_typeof(p_ds) <> 'array' or jsonb_array_length(p_ds) > 500 then raise exception 'dau_vao_khong_hop_le'; end if;
    for e in select * from jsonb_array_elements(p_ds) loop
        v := public.vec_tu_jsonb(e -> 'vec');
        continue when v is null or not public.y_dinh_hop_le(p_mo_dun, e ->> 'y_dinh')
                      or char_length(coalesce(e ->> 'cau', '')) not between 3 and 300;
        insert into public.cau_hoi_vec as c (mo_dun, y_dinh, cau, vec, mo_hinh, nguon, trang_thai)
        values (p_mo_dun, e ->> 'y_dinh', e ->> 'cau', v, p_mo_hinh, 'kho', 'hoat_dong')
        on conflict (mo_dun, mo_hinh, cau) do update
            set y_dinh = excluded.y_dinh, vec = excluded.vec, nguon = 'kho', cap_nhat = now(),
                trang_thai = case when c.trang_thai = 'tat' then 'tat' else 'hoat_dong' end;
        n := n + 1;
    end loop;
    return n;
end
$$;

-- ------------------------------------------------------------------ 4. Quản trị + dọn dẹp
create or replace function thong_ke_hoc_tuvi(p_trang_thai text default 'cho_duyet') returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh']);
    return jsonb_build_object(
        'kiem_chung', coalesce((
            select jsonb_agg(jsonb_build_object('loai', loai, 'mau', mau, 'dung', dung, 'chua_dung', chua_dung)
                             order by dung::real / greatest(dung + chua_dung, 1), dung + chua_dung desc)
            from (select loai, mau, (count(*) filter (where ket_qua = 'dung'))::int dung,
                         (count(*) filter (where ket_qua = 'chua_dung'))::int chua_dung
                  from public.kiem_chung_phieu where het_han > now() group by loai, mau
                  order by count(*) desc limit 2000) t), '[]'::jsonb),
        'phieu', (select jsonb_build_object('tong', count(*), 'trong_30_ngay', count(*) filter (where cap_nhat > now() - interval '30 days'),
                                            'nguoi', count(distinct khoa))
                  from public.kiem_chung_phieu where het_han > now()),
        'luan_giai_luu', (select jsonb_build_object('bai', count(*), 'nguoi', count(distinct user_id))
                          from public.luan_giai_luu where het_han > now()),
        'tu_luu', (select count(*) from public.tuy_chon_hoc where tu_luu_luan_giai),
        'vec_theo_trang_thai', coalesce((select jsonb_object_agg(k, n) from (
            select trang_thai || '.' || nguon k, count(*) n from public.cau_hoi_vec group by 1) t), '{}'::jsonb),
        'vec', coalesce((
            select jsonb_agg(jsonb_build_object('id', id, 'mo_dun', mo_dun, 'y_dinh', y_dinh, 'cau', cau, 'nguon', nguon,
                             'so_xac_nhan', so_xac_nhan, 'trang_thai', trang_thai, 'mo_hinh', mo_hinh, 'cap_nhat', cap_nhat)
                             order by so_xac_nhan desc, cap_nhat desc)
            from (select * from public.cau_hoi_vec
                  where (p_trang_thai is null or trang_thai = p_trang_thai) and nguon <> 'kho'
                  order by so_xac_nhan desc, cap_nhat desc limit 200) t), '[]'::jsonb));
end
$$;

create or replace function duyet_cau_hoi_vec(p_id bigint, p_trang_thai text) returns void
    language plpgsql security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap']);
    if p_trang_thai not in ('hoat_dong', 'cho_duyet', 'tat') then raise exception 'trang_thai_khong_hop_le'; end if;
    update public.cau_hoi_vec set trang_thai = p_trang_thai, cap_nhat = now() where id = p_id;
    if not found then raise exception 'khong_tim_thay'; end if;
    perform public.qt_ghi('hoc.vec', p_id::text, jsonb_build_object('trang_thai', p_trang_thai));
end
$$;

-- Xoá thật dữ liệu hết hạn (cron hằng ngày /api/cron/don-du-lieu-hoc, service role): phiếu > 24 tháng, bài luận > 365 ngày.
create or replace function don_du_lieu_hoc_tuvi() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare a int; b int;
begin
    delete from public.kiem_chung_phieu where het_han < now();
    get diagnostics a = row_count;
    delete from public.luan_giai_luu where het_han < now();
    get diagnostics b = row_count;
    return jsonb_build_object('phieu', a, 'luan_giai', b);
end
$$;

revoke all on function kiem_chung_ma_hop_le(text, text, text), ghi_kiem_chung(text, uuid, text, text, text, text),
    ty_le_kiem_chung(text[], integer), luan_giai_luu_gioi_han(), tuy_chon_hoc_moc(), y_dinh_hop_le(text, text),
    vec_tu_jsonb(jsonb), tim_y_dinh_gan(text, jsonb, text, real, integer),
    xac_nhan_y_dinh(text, text, text, jsonb, text, text, boolean), nap_kho_vec(text, text, jsonb), thong_ke_hoc_tuvi(text),
    duyet_cau_hoi_vec(bigint, text), don_du_lieu_hoc_tuvi() from public, anon, authenticated;
grant execute on function ghi_kiem_chung(text, uuid, text, text, text, text), ty_le_kiem_chung(text[], integer),
    tim_y_dinh_gan(text, jsonb, text, real, integer), xac_nhan_y_dinh(text, text, text, jsonb, text, text, boolean),
    nap_kho_vec(text, text, jsonb), don_du_lieu_hoc_tuvi() to service_role;
grant execute on function thong_ke_hoc_tuvi(text), duyet_cau_hoi_vec(bigint, text) to authenticated;
