-- TS-V3 tầng HỌC ("bộ não thứ hai", 2026-10-20): vòng tự cải thiện + ký ức người dùng — port 06/09 của bản SQL V3,
-- đã sửa lỗi và theo quy tắc riêng tư mới (CLAUDE.md, TS-V3):
--   * thanso_phan_hoi: góp ý đúng/chưa đúng cho từng câu trả lời. CHỈ lưu CHỮ KÝ SỐ (các con số đã tính), mã câu,
--     phái, ghi chú đã lọc — KHÔNG họ tên, KHÔNG ngày sinh, KHÔNG user_id. Hết hạn sau 365 ngày.
--   * thanso_cum_bat_thuong: gom góp ý "chưa đúng" theo chữ ký → đủ 5 lần thì chuyển "chờ duyệt" (KHÔNG tự bật luật —
--     bản V3 báo AUTO_PROMOTED mà không làm gì; ở đây người duyệt quyết, luật được sửa trong KB qua PR).
--   * ky_uc_nguoi_dung: điều người dùng CHỦ ĐỘNG bấm ghi nhớ (mã câu băn khoăn + ghi chú ngắn), RLS chủ sở hữu, xoá
--     được ngay, hết hạn 180 ngày, tối đa 50 mục. Chỉ dùng để cá nhân hoá cho chính người đó, không dùng huấn luyện.
-- Không pgvector, không bộ tính trong SQL (phép tính ở engine Python). Chạy SAU 0014. Rollback: 0015_thanso_hoc.down.sql

create table if not exists thanso_phan_hoi (
    id        bigint generated always as identity primary key,
    tao_luc   timestamptz not null default now(),
    het_han   timestamptz not null default now() + interval '365 days',
    phai      text not null check (phai in ('pitago', 'chaldea', 'kabbalah', 'tong_hop')),
    quy_uoc   text not null default 'tong_het' check (quy_uoc in ('tong_het', 'tung_phan')),
    nguon     text not null check (nguon in ('hoi_dap', 'bai_doc', 'noi_dau')),
    linh_vuc  text check (linh_vuc ~ '^[a-z_]{2,30}$'),
    ma_cau    text check (ma_cau ~ '^[a-z]{2}_[a-z_]{2,30}$'),
    chu_ky    jsonb not null,
    dung      boolean not null,
    ghi_chu   text check (char_length(ghi_chu) <= 300),
    dong_y    boolean not null default false,
    check (ghi_chu is null or dong_y)
);
create index if not exists thanso_phan_hoi_tao_luc on thanso_phan_hoi (tao_luc desc);
alter table thanso_phan_hoi enable row level security;   -- không policy: chỉ hàm SECURITY DEFINER / service role

create table if not exists thanso_cum_bat_thuong (
    id          bigint generated always as identity primary key,
    chu_ky_mau  text not null unique check (char_length(chu_ky_mau) <= 200),
    phai        text not null,
    linh_vuc    text,
    ma_cau      text,
    dieu_kien   jsonb not null,
    so_lan      integer not null default 0,
    mau_ghi_chu text[] not null default '{}',
    trang_thai  text not null default 'theo_doi' check (trang_thai in ('theo_doi', 'cho_duyet', 'da_sua', 'bo_qua')),
    luat_de_xuat text check (char_length(luat_de_xuat) <= 1000),
    cap_nhat    timestamptz not null default now()
);
alter table thanso_cum_bat_thuong enable row level security;

create table if not exists ky_uc_nguoi_dung (
    id       bigint generated always as identity primary key,
    user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
    tru      text not null check (tru ~ '^[a-z_]{3,40}$'),
    ma_cau   text check (ma_cau ~ '^[a-z]{2}_[a-z_]{2,30}$'),
    ghi_chu  text check (char_length(ghi_chu) <= 200),
    tao_luc  timestamptz not null default now(),
    het_han  timestamptz not null default now() + interval '180 days'
);
create index if not exists ky_uc_nguoi_dung_user on ky_uc_nguoi_dung (user_id, tao_luc desc);
alter table ky_uc_nguoi_dung enable row level security;
drop policy if exists ky_uc_chu_xem on ky_uc_nguoi_dung;
create policy ky_uc_chu_xem on ky_uc_nguoi_dung for select to authenticated
    using (user_id = (select auth.uid()) and het_han > now());
drop policy if exists ky_uc_chu_them on ky_uc_nguoi_dung;
create policy ky_uc_chu_them on ky_uc_nguoi_dung for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists ky_uc_chu_xoa on ky_uc_nguoi_dung;
create policy ky_uc_chu_xoa on ky_uc_nguoi_dung for delete to authenticated
    using (user_id = (select auth.uid()));
revoke all on ky_uc_nguoi_dung from anon;
revoke update, truncate on ky_uc_nguoi_dung from authenticated;
grant select, insert, delete on ky_uc_nguoi_dung to authenticated;

-- Tối đa 50 ký ức mỗi người: mục cũ nhất bị thay khi thêm mục mới.
create or replace function ky_uc_gioi_han() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    delete from public.ky_uc_nguoi_dung where id in (
        select id from public.ky_uc_nguoi_dung where user_id = new.user_id order by tao_luc desc offset 49);
    return new;
end
$$;
drop trigger if exists ky_uc_gioi_han on ky_uc_nguoi_dung;
create trigger ky_uc_gioi_han before insert on ky_uc_nguoi_dung for each row execute function ky_uc_gioi_han();

-- Chữ ký số chỉ được chứa đúng các khoá con số đã biết, giá trị là số nguyên 0–999 (không lọt chữ/tên/ngày sinh).
create or replace function thanso_chu_ky_hop_le(p jsonb) returns boolean
    language sql immutable set search_path = '' as $$
    select jsonb_typeof(p) = 'object' and pg_column_size(p) <= 1024 and not exists (
        select 1 from jsonb_each(p) phai(k, v)
        where k not in ('pitago', 'chaldea', 'kabbalah') or jsonb_typeof(v) <> 'object' or exists (
            select 1 from jsonb_each(v) so(k2, v2)
            where k2 !~ '^[a-z_]{3,25}$' or jsonb_typeof(v2) <> 'number'
               or (v2::text)::numeric not between 0 and 999 or (v2::text) ~ '\.'))
$$;

-- Nhận một góp ý (web máy chủ gọi bằng service role sau khi lọc ghi chú). Trả {ok, cum, trang_thai}.
create or replace function gui_phan_hoi_thanso(p jsonb) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_ghi text := nullif(btrim(p ->> 'ghi_chu'), '');
    v_dong_y boolean := coalesce((p ->> 'dong_y')::boolean, false);
    v_chu_ky jsonb := p -> 'chu_ky';
    v_mau text;
    v_cum record;
begin
    if not public.thanso_chu_ky_hop_le(v_chu_ky) then raise exception 'chu_ky_khong_hop_le'; end if;
    if v_ghi is not null and not v_dong_y then v_ghi := null; end if;          -- không đồng ý → bỏ ghi chú
    if v_ghi ~ '[0-9]{6,}|@|https?://' then raise exception 'ghi_chu_co_thong_tin_lien_he'; end if;
    insert into public.thanso_phan_hoi (phai, quy_uoc, nguon, linh_vuc, ma_cau, chu_ky, dung, ghi_chu, dong_y)
    values (p ->> 'phai', coalesce(p ->> 'quy_uoc', 'tong_het'), p ->> 'nguon', p ->> 'linh_vuc', p ->> 'ma_cau',
            v_chu_ky, (p ->> 'dung')::boolean, v_ghi, v_dong_y);
    -- dọn hết hạn thỉnh thoảng (≈2% lượt)
    if random() < 0.02 then delete from public.thanso_phan_hoi where het_han < now(); end if;
    if (p ->> 'dung')::boolean then return jsonb_build_object('ok', true, 'cum', null); end if;
    -- Chữ ký cụm: phái + mã câu (hoặc lĩnh vực) + số chính của phái đó — không dùng số tên để cụm không quá vụn.
    v_mau := concat_ws('|', p ->> 'phai', coalesce(p ->> 'ma_cau', p ->> 'linh_vuc', 'chung'),
                       'dd' || coalesce(v_chu_ky -> 'pitago' ->> 'duong_doi', v_chu_ky -> 'chaldea' ->> 'duong_doi', '-'),
                       'k' || coalesce(v_chu_ky -> 'kabbalah' ->> 'sephirah_ngay_sinh', '-'));
    insert into public.thanso_cum_bat_thuong as c (chu_ky_mau, phai, linh_vuc, ma_cau, dieu_kien, so_lan, mau_ghi_chu)
    values (v_mau, p ->> 'phai', p ->> 'linh_vuc', p ->> 'ma_cau', v_chu_ky, 1,
            case when v_ghi is null then '{}' else array[v_ghi] end)
    on conflict (chu_ky_mau) do update set
        so_lan = c.so_lan + 1,
        mau_ghi_chu = (case when v_ghi is null then c.mau_ghi_chu else (array[v_ghi] || c.mau_ghi_chu)[1:5] end),
        trang_thai = case when c.trang_thai = 'theo_doi' and c.so_lan + 1 >= 5 then 'cho_duyet' else c.trang_thai end,
        cap_nhat = now()
    returning id, trang_thai into v_cum;
    return jsonb_build_object('ok', true, 'cum', v_cum.id, 'trang_thai', v_cum.trang_thai);
end
$$;

-- Quản trị: xem cụm (biên tập, chủ sở hữu, thẩm định) — kèm tổng số góp ý 30 ngày.
create or replace function qt_cum_bat_thuong(p_trang_thai text default 'cho_duyet') returns jsonb
    language plpgsql security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh']);
    return jsonb_build_object(
        'tong_30_ngay', (select jsonb_build_object('gop_y', count(*), 'dung', count(*) filter (where dung),
                                                   'co_ghi_chu', count(*) filter (where ghi_chu is not null))
                         from public.thanso_phan_hoi where tao_luc > now() - interval '30 days'),
        'theo_phai', coalesce((select jsonb_object_agg(phai, jsonb_build_object('gop_y', n, 'dung', d))
                               from (select phai, count(*) n, count(*) filter (where dung) d from public.thanso_phan_hoi
                                     where tao_luc > now() - interval '30 days' group by phai) t), '{}'::jsonb),
        'cum', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'chu_ky_mau', chu_ky_mau, 'phai', phai,
                            'linh_vuc', linh_vuc, 'ma_cau', ma_cau, 'so_lan', so_lan, 'mau_ghi_chu', mau_ghi_chu,
                            'trang_thai', trang_thai, 'luat_de_xuat', luat_de_xuat, 'cap_nhat', cap_nhat)
                            order by so_lan desc)
                         from public.thanso_cum_bat_thuong
                         where p_trang_thai is null or trang_thai = p_trang_thai), '[]'::jsonb));
end
$$;

create or replace function qt_cap_nhat_cum(p_id bigint, p_trang_thai text, p_luat text default null) returns void
    language plpgsql security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap']);
    if p_trang_thai not in ('theo_doi', 'cho_duyet', 'da_sua', 'bo_qua') then raise exception 'trang_thai_khong_hop_le'; end if;
    update public.thanso_cum_bat_thuong set trang_thai = p_trang_thai, luat_de_xuat = coalesce(p_luat, luat_de_xuat),
        cap_nhat = now() where id = p_id;
    if not found then raise exception 'khong_tim_thay'; end if;
    perform public.qt_ghi('hoc.cum', p_id::text, jsonb_build_object('trang_thai', p_trang_thai));
end
$$;

revoke all on function thanso_chu_ky_hop_le(jsonb), gui_phan_hoi_thanso(jsonb), qt_cum_bat_thuong(text),
    qt_cap_nhat_cum(bigint, text, text), ky_uc_gioi_han() from public, anon, authenticated;
grant execute on function gui_phan_hoi_thanso(jsonb) to service_role;
grant execute on function qt_cum_bat_thuong(text), qt_cap_nhat_cum(bigint, text, text) to authenticated;
revoke all on thanso_phan_hoi, thanso_cum_bat_thuong from anon, authenticated;
