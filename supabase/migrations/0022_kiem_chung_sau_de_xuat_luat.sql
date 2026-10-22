-- Q7 tầng HỌC (chủ dự án giao 2026-10-22; docs/VONG-TU-CAI-THIEN.md mục 4–5, docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md Q7):
-- (1) kiem_chung_sau — PHIẾU SAU 30 NGÀY: người dùng từng bấm "Đúng với mình" một hộp lưu ý / lời khuyên, sau ≥ 30 ngày
--     Hôm nay hỏi lại hai câu ba mức: đã làm theo chưa (da_lam · mot_phan · chua) và thấy khác gì (tot_hon · nhu_cu · kho_noi).
--     Chỉ MÃ hộp + phái + hai mức — không chữ, không nhà, không ngày sinh; một phiếu / người / mã; khoá HMAC như 0017;
--     hết hạn 24 tháng. Thay cho rating 1–5 + outcome 30 ngày gắn user_id của bộ tài liệu Drive.
-- (2) de_xuat_luat — HÀNG ĐỢI ĐỀ XUẤT LUẬT cho NGƯỜI DUYỆT: máy chỉ GOM (mã, số phiếu, tỉ lệ, số phiếu sau, lý do mã) khi
--     một hộp vượt ngưỡng (≥ 100 phiếu và < 40 % đúng, hoặc ≥ 30 phiếu sau 30 ngày mà ≥ 60 % "như cũ"); người đọc, sửa KB /
--     viết luật RULES qua PR rồi đánh dấu. KHÔNG có cột lời luận, KHÔNG tự bật gì (trái AUTO_PATCHED của Drive).
-- Mọi hàm: security definer + search_path = ''. Không BEGIN/COMMIT. Chạy SAU 0017 (dùng kiem_chung_ma_hop_le, qt_can_vai_tro, qt_ghi).
-- Rollback: 0022_kiem_chung_sau_de_xuat_luat.down.sql.

-- ------------------------------------------------------------------ 1. Phiếu sau 30 ngày
create table if not exists kiem_chung_sau (
    id        bigint generated always as identity primary key,
    khoa      text not null check (khoa ~ '^[a-f0-9]{32,64}$'),
    user_id   uuid references auth.users (id) on delete cascade,
    loai      text not null check (loai in ('doi_song', 'hai_nguoi')),
    mau       text not null check (mau ~ '^[a-z0-9_.+-]{3,60}$'),
    phai      text not null check (phai ~ '^[a-z0-9_]{2,32}$'),
    da_lam    text not null check (da_lam in ('da_lam', 'mot_phan', 'chua')),
    thay_khac text not null check (thay_khac in ('tot_hon', 'nhu_cu', 'kho_noi')),
    sau_ngay  smallint not null check (sau_ngay between 30 and 400),       -- số ngày kể từ phiếu đầu (web tính trên máy)
    tao_luc   timestamptz not null default now(),
    het_han   timestamptz not null default now() + interval '24 months',
    unique (khoa, loai, mau)
);
create index if not exists kiem_chung_sau_mau on kiem_chung_sau (mau);
create index if not exists kiem_chung_sau_het_han on kiem_chung_sau (het_han);
alter table kiem_chung_sau enable row level security;
drop policy if exists kiem_chung_sau_chu_xem on kiem_chung_sau;
create policy kiem_chung_sau_chu_xem on kiem_chung_sau for select to authenticated
    using (user_id = (select auth.uid()) and het_han > now());
drop policy if exists kiem_chung_sau_chu_xoa on kiem_chung_sau;
create policy kiem_chung_sau_chu_xoa on kiem_chung_sau for delete to authenticated
    using (user_id = (select auth.uid()));
revoke all on kiem_chung_sau from public, anon, authenticated;
grant select, delete on kiem_chung_sau to authenticated;

create or replace function ghi_kiem_chung_sau(p_khoa text, p_user_id uuid, p_loai text, p_mau text, p_phai text,
                                              p_da_lam text, p_thay_khac text, p_sau_ngay integer) returns boolean
    language plpgsql security definer set search_path = '' as $$
begin
    if p_khoa is null or p_khoa !~ '^[a-f0-9]{32,64}$' then return false; end if;
    if p_loai not in ('doi_song', 'hai_nguoi') then return false; end if;
    if p_da_lam not in ('da_lam', 'mot_phan', 'chua') or p_thay_khac not in ('tot_hon', 'nhu_cu', 'kho_noi') then return false; end if;
    if p_sau_ngay is null or p_sau_ngay < 30 or p_sau_ngay > 400 then return false; end if;
    if not public.kiem_chung_ma_hop_le(p_loai, p_mau, p_phai) then return false; end if;
    if not exists (select 1 from public.kiem_chung_sau where khoa = p_khoa and loai = p_loai and mau = p_mau)
       and (select count(*) from public.kiem_chung_sau where khoa = p_khoa) >= 1000 then
        return false;
    end if;
    insert into public.kiem_chung_sau as k (khoa, user_id, loai, mau, phai, da_lam, thay_khac, sau_ngay)
    values (p_khoa, p_user_id, p_loai, p_mau, p_phai, p_da_lam, p_thay_khac, p_sau_ngay)
    on conflict (khoa, loai, mau) do update
        set da_lam = excluded.da_lam, thay_khac = excluded.thay_khac, sau_ngay = excluded.sau_ngay,
            user_id = coalesce(excluded.user_id, k.user_id), tao_luc = now(), het_han = now() + interval '24 months';
    return true;
end
$$;

-- Tổng hợp theo mã: số phiếu sau, đã làm (da_lam + mot_phan), thấy tốt hơn / như cũ — chỉ mã ≥ p_toi_thieu phiếu.
create or replace function ty_le_kiem_chung_sau(p_toi_thieu integer default 30)
    returns table (loai text, mau text, so_phieu integer, da_lam integer, tot_hon integer, nhu_cu integer)
    language sql stable security definer set search_path = '' as $$
    select k.loai, k.mau, count(*)::int,
           (count(*) filter (where k.da_lam in ('da_lam', 'mot_phan')))::int,
           (count(*) filter (where k.thay_khac = 'tot_hon'))::int,
           (count(*) filter (where k.thay_khac = 'nhu_cu'))::int
    from public.kiem_chung_sau k
    where k.het_han > now()
    group by k.loai, k.mau
    having count(*) >= greatest(coalesce(p_toi_thieu, 30), 1)
    order by count(*) desc, k.mau
    limit 5000
$$;

-- ------------------------------------------------------------------ 2. Hàng đợi đề xuất luật (người duyệt)
create table if not exists de_xuat_luat (
    id          bigint generated always as identity primary key,
    loai        text not null check (loai in ('doi_song', 'hai_nguoi', 'phi_hoa', 'nhip_3_thang')),
    mau         text not null check (mau ~ '^[a-z0-9_.+-]{3,60}$'),
    ly_do       text not null check (ly_do in ('ti_le_thap', 'sau_30_nhu_cu')),
    so_phieu    integer not null default 0,
    ti_le_dung  real,
    so_phieu_sau integer not null default 0,
    ti_le_nhu_cu real,
    trang_thai  text not null default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_sua', 'bo_qua')),
    ghi_chu     text check (ghi_chu is null or length(ghi_chu) <= 500),  -- người duyệt ghi (PR nào, vì sao bỏ qua)
    tao_luc     timestamptz not null default now(),
    cap_nhat    timestamptz not null default now(),
    unique (loai, mau, ly_do)
);
alter table de_xuat_luat enable row level security;
revoke all on de_xuat_luat from public, anon, authenticated;

-- Máy chỉ GOM: chạy bởi cron ngày (service role). Thêm dòng mới hoặc cập nhật số; không đụng dòng đã "da_sua" / "bo_qua".
create or replace function gom_de_xuat_luat(p_nguong_phieu integer default 100, p_ti_le real default 0.40,
                                           p_nguong_sau integer default 30, p_ti_le_nhu_cu real default 0.60) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare a int := 0; b int := 0;
begin
    with t as (
        select loai, mau, count(*)::int so_phieu,
               (count(*) filter (where ket_qua = 'dung'))::real / count(*) ti_le
        from public.kiem_chung_phieu where het_han > now()
        group by loai, mau
        having count(*) >= p_nguong_phieu and (count(*) filter (where ket_qua = 'dung'))::real / count(*) < p_ti_le
    )
    insert into public.de_xuat_luat as d (loai, mau, ly_do, so_phieu, ti_le_dung)
    select loai, mau, 'ti_le_thap', so_phieu, ti_le from t
    on conflict (loai, mau, ly_do) do update
        set so_phieu = excluded.so_phieu, ti_le_dung = excluded.ti_le_dung, cap_nhat = now()
        where d.trang_thai = 'cho_duyet';
    get diagnostics a = row_count;
    with s as (
        select loai, mau, count(*)::int so_phieu_sau,
               (count(*) filter (where thay_khac = 'nhu_cu'))::real / count(*) ti_le_nhu_cu
        from public.kiem_chung_sau where het_han > now()
        group by loai, mau
        having count(*) >= p_nguong_sau and (count(*) filter (where thay_khac = 'nhu_cu'))::real / count(*) >= p_ti_le_nhu_cu
    )
    insert into public.de_xuat_luat as d (loai, mau, ly_do, so_phieu_sau, ti_le_nhu_cu)
    select loai, mau, 'sau_30_nhu_cu', so_phieu_sau, ti_le_nhu_cu from s
    on conflict (loai, mau, ly_do) do update
        set so_phieu_sau = excluded.so_phieu_sau, ti_le_nhu_cu = excluded.ti_le_nhu_cu, cap_nhat = now()
        where d.trang_thai = 'cho_duyet';
    get diagnostics b = row_count;
    return jsonb_build_object('ti_le_thap', a, 'sau_30_nhu_cu', b);
end
$$;

-- Người duyệt đọc hàng đợi + thống kê phiếu sau (vai trò quản trị như 0017).
create or replace function thong_ke_de_xuat_luat(p_trang_thai text default 'cho_duyet') returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh']);
    return jsonb_build_object(
        'de_xuat', coalesce((
            select jsonb_agg(jsonb_build_object('id', id, 'loai', loai, 'mau', mau, 'ly_do', ly_do, 'so_phieu', so_phieu,
                             'ti_le_dung', ti_le_dung, 'so_phieu_sau', so_phieu_sau, 'ti_le_nhu_cu', ti_le_nhu_cu,
                             'trang_thai', trang_thai, 'ghi_chu', ghi_chu, 'cap_nhat', cap_nhat)
                             order by cap_nhat desc)
            from (select * from public.de_xuat_luat where p_trang_thai is null or trang_thai = p_trang_thai
                  order by cap_nhat desc limit 300) t), '[]'::jsonb),
        'theo_trang_thai', coalesce((select jsonb_object_agg(trang_thai, n) from (
            select trang_thai, count(*) n from public.de_xuat_luat group by 1) t), '{}'::jsonb),
        'phieu_sau', (select jsonb_build_object('tong', count(*), 'trong_30_ngay', count(*) filter (where tao_luc > now() - interval '30 days'),
                                                'da_lam', count(*) filter (where da_lam in ('da_lam', 'mot_phan')),
                                                'tot_hon', count(*) filter (where thay_khac = 'tot_hon'))
                      from public.kiem_chung_sau where het_han > now()),
        'phieu_sau_theo_ma', coalesce((select jsonb_agg(to_jsonb(x)) from public.ty_le_kiem_chung_sau(30) x), '[]'::jsonb));
end
$$;

create or replace function duyet_de_xuat_luat(p_id bigint, p_trang_thai text, p_ghi_chu text default null) returns void
    language plpgsql security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap']);
    if p_trang_thai not in ('cho_duyet', 'da_sua', 'bo_qua') then raise exception 'trang_thai_khong_hop_le'; end if;
    update public.de_xuat_luat set trang_thai = p_trang_thai, ghi_chu = left(p_ghi_chu, 500), cap_nhat = now() where id = p_id;
    if not found then raise exception 'khong_tim_thay'; end if;
    perform public.qt_ghi('hoc.de_xuat_luat', p_id::text, jsonb_build_object('trang_thai', p_trang_thai));
end
$$;

-- Dọn phiếu sau hết hạn (gọi cùng don_du_lieu_hoc_tuvi trong cron ngày).
create or replace function don_kiem_chung_sau() returns integer
    language plpgsql security definer set search_path = '' as $$
declare a int;
begin
    delete from public.kiem_chung_sau where het_han < now();
    get diagnostics a = row_count;
    return a;
end
$$;

revoke all on function ghi_kiem_chung_sau(text, uuid, text, text, text, text, text, integer), ty_le_kiem_chung_sau(integer),
    gom_de_xuat_luat(integer, real, integer, real), thong_ke_de_xuat_luat(text), duyet_de_xuat_luat(bigint, text, text),
    don_kiem_chung_sau() from public, anon, authenticated;
grant execute on function ghi_kiem_chung_sau(text, uuid, text, text, text, text, text, integer), ty_le_kiem_chung_sau(integer),
    gom_de_xuat_luat(integer, real, integer, real), don_kiem_chung_sau() to service_role;
grant execute on function thong_ke_de_xuat_luat(text), duyet_de_xuat_luat(bigint, text, text) to authenticated;
