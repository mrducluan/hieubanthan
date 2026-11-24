-- LX-2027 (2026-11-24, chủ dự án duyệt migration 0042 + thang giá 99k / 249k / 399k — docs/LI-XI-TET-2027.md).
-- "Lì xì Báo cáo Tết Đinh Mùi 2027": tặng NỘI DUNG mở trọn báo cáo /thoi-gian-toi (2027) cho người nhận, KHÔNG phải Sao,
-- KHÔNG phải voucher đổi tiền mặt, KHÔNG chuyển nhượng lại sau khi nhận (tuân thủ NĐ 52/2024 & điều khoản Pay2S).
-- Luật 91/2025: người tặng KHÔNG nhập ngày sinh người nhận; người nhận tự nhập hồ sơ của chính họ trên /li-xi/[ma].
-- Công tắc `sao.li_xi.bat` mặc định TẮT để chủ dự án kiểm thử xong mới mở. Rollback: 0042_li_xi_tet.down.sql

-- ---------------------------------------------------------------- (1) Nới don_nap.loai nhận 'li_xi'
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap add constraint don_nap_loai_check
    check (loai in ('sao', 'hoi_vien', 'chuyen_gia', 'li_xi'));

-- ---------------------------------------------------------------- (2) Bảng li_xi_tet
create table if not exists li_xi_tet (
    id              bigint generated always as identity primary key,
    ma              text not null unique check (ma ~ '^[a-z0-9]{12,16}$'),
    ma_don          bigint not null references don_nap (ma_don) on delete cascade,
    nguoi_tang_id   uuid not null references auth.users (id) on delete cascade,
    ten_nguoi_tang  text check (ten_nguoi_tang is null or char_length(ten_nguoi_tang) <= 40),
    loi_chuc        text check (loi_chuc is null or char_length(loi_chuc) <= 160),
    mau_thiep       text not null default 'do_son'
                    check (mau_thiep in ('do_son', 'mai_vang', 'ngoc_bich', 'dem_giao_thua')),
    nam             integer not null default 2027 check (nam between 2026 and 2099),
    trang_thai      text not null default 'cho_tra'
                    check (trang_thai in ('cho_tra', 'san_sang', 'da_nhan', 'hoan')),
    nguoi_nhan_id   uuid references auth.users (id) on delete set null,
    nhan_luc        timestamptz,
    het_han         date not null default date '2027-03-31',
    tao_luc         timestamptz not null default now()
);
create index if not exists li_xi_tet_don_idx on li_xi_tet (ma_don);
create index if not exists li_xi_tet_tang_idx on li_xi_tet (nguoi_tang_id, tao_luc desc);
create index if not exists li_xi_tet_nhan_idx on li_xi_tet (nguoi_nhan_id, nam) where trang_thai = 'da_nhan';

alter table li_xi_tet enable row level security;
drop policy if exists "li_xi_tet chu doc" on li_xi_tet;
create policy "li_xi_tet chu doc" on li_xi_tet for select to authenticated
    using ((select auth.uid()) = nguoi_tang_id or (select auth.uid()) = nguoi_nhan_id);
revoke all on li_xi_tet from public, anon, authenticated;
grant select on li_xi_tet to authenticated;

-- ---------------------------------------------------------------- (3) Cấu hình mặc định (chủ sở hữu đổi ở /quan-tri/cai-dat)
insert into public.cau_hinh (khoa, gia_tri, mo_ta) values
    ('sao.li_xi.bat',   'false',  'LX-2027: bật bán Lì xì Báo cáo Tết 2027'),
    ('sao.li_xi.gia_1', '99000',  'LX-2027: giá 1 bao Lì xì Tết 2027 (VND)'),
    ('sao.li_xi.gia_3', '249000', 'LX-2027: giá combo 3 bao Lì xì Gia đình (VND)'),
    ('sao.li_xi.gia_5', '399000', 'LX-2027: giá combo 5 bao Lì xì Doanh nghiệp (VND)')
on conflict (khoa) do nothing;

create or replace function lx_gia_goi(p_so_bao integer) returns integer
    language sql stable security definer set search_path = '' as $$
    select case p_so_bao
        when 1 then public.qt_so_cau_hinh('sao.li_xi.gia_1', 99000, 10000, 5000000)
        when 3 then public.qt_so_cau_hinh('sao.li_xi.gia_3', 249000, 20000, 10000000)
        when 5 then public.qt_so_cau_hinh('sao.li_xi.gia_5', 399000, 30000, 20000000)
        else 0
    end
$$;

create or replace function lx_bat() returns boolean
    language sql stable security definer set search_path = '' as $$
    select coalesce((select gia_tri = 'true' from public.cau_hinh where khoa = 'sao.li_xi.bat'), false)
$$;

-- ---------------------------------------------------------------- (4) Trigger kích hoạt bao lì xì khi Pay2S báo đã trả (idempotent)
create or replace function lx_don_da_tra() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
    if new.loai = 'li_xi'
       and new.trang_thai in ('da_tra', 'da_xu_ly')
       and (old.trang_thai is distinct from new.trang_thai) then
        update public.li_xi_tet
           set trang_thai = 'san_sang'
         where ma_don = new.ma_don
           and trang_thai = 'cho_tra';
    end if;
    return new;
end;
$$;

drop trigger if exists lx_don_da_tra_trg on don_nap;
create trigger lx_don_da_tra_trg
    after update on don_nap
    for each row execute function lx_don_da_tra();

-- ---------------------------------------------------------------- (5) RPC công khai & người dùng
create or replace function li_xi_thong_tin() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'bat',   public.lx_bat(),
        'gia_1', public.lx_gia_goi(1),
        'gia_3', public.lx_gia_goi(3),
        'gia_5', public.lx_gia_goi(5),
        'nam',   2027,
        'han',   '2027-03-31'
    )
$$;

create or replace function tao_don_li_xi(
    p_cong text,
    p_so_bao integer,
    p_mau_thiep text default 'do_son',
    p_ten_nguoi_tang text default null,
    p_loi_chuc text default null
) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_gia integer;
    v_don bigint;
    v_ten text := nullif(trim(coalesce(p_ten_nguoi_tang, '')), '');
    v_chuc text := nullif(trim(coalesce(p_loi_chuc, '')), '');
    v_ma text;
    v_ds text[] := '{}';
    i integer;
begin
    if v_uid is null then
        return jsonb_build_object('ket_qua', 'chua_dang_nhap');
    end if;
    if not public.lx_bat() then
        return jsonb_build_object('ket_qua', 'chua_mo');
    end if;
    if p_cong not in ('pay2s', 'gia') then
        return jsonb_build_object('ket_qua', 'cong_khong_hop_le');
    end if;
    if p_so_bao not in (1, 3, 5) then
        return jsonb_build_object('ket_qua', 'goi_khong_hop_le');
    end if;
    if p_mau_thiep not in ('do_son', 'mai_vang', 'ngoc_bich', 'dem_giao_thua') then
        return jsonb_build_object('ket_qua', 'mau_khong_hop_le');
    end if;
    if v_ten is not null and char_length(v_ten) > 40 then
        return jsonb_build_object('ket_qua', 'ten_qua_dai');
    end if;
    if v_chuc is not null and (char_length(v_chuc) > 160 or v_chuc ~* '(https?://|@|\b0[0-9]{8,10}\b)') then
        return jsonb_build_object('ket_qua', 'loi_chuc_khong_hop_le');
    end if;

    v_gia := public.lx_gia_goi(p_so_bao);
    insert into public.don_nap (user_id, loai, goi, sao, so_tien_vnd, cong, trang_thai)
    values (v_uid, 'li_xi', null, 0, v_gia, p_cong, 'cho')
    returning ma_don into v_don;

    for i in 1..p_so_bao loop
        v_ma := encode(extensions.gen_random_bytes(6), 'hex');
        insert into public.li_xi_tet (ma, ma_don, nguoi_tang_id, ten_nguoi_tang, loi_chuc, mau_thiep, nam, trang_thai, het_han)
        values (v_ma, v_don, v_uid, v_ten, v_chuc, p_mau_thiep, 2027, 'cho_tra', date '2027-03-31');
        v_ds := array_append(v_ds, v_ma);
    end loop;

    return jsonb_build_object(
        'ket_qua', 'da_tao',
        'ma_don', v_don,
        'so_tien_vnd', v_gia,
        'so_bao', p_so_bao,
        'ma_ds', to_jsonb(v_ds)
    );
end;
$$;

-- Xem bao lì xì công khai (chỉ trả thông tin an toàn Zero-PII: tên hiển thị người tặng + lời chúc + mẫu thiệp + trạng thái)
create or replace function xem_li_xi_tet(p_ma text) returns jsonb
    language sql stable security definer set search_path = '' as $$
    select coalesce((
        select jsonb_build_object(
            'co', true,
            'ma', l.ma,
            'ten_nguoi_tang', l.ten_nguoi_tang,
            'loi_chuc', l.loi_chuc,
            'mau_thiep', l.mau_thiep,
            'nam', l.nam,
            'trang_thai', l.trang_thai,
            'het_han', l.het_han,
            'con_han', (l.het_han >= (now() at time zone 'Asia/Ho_Chi_Minh')::date)
        )
        from public.li_xi_tet l
        where l.ma = p_ma
          and l.trang_thai in ('san_sang', 'da_nhan')
        limit 1
    ), jsonb_build_object('co', false))
$$;

-- Người nhận mở & nhận bao lì xì (mỗi mã dùng đúng 1 lần; mở khoá trọn báo cáo /thoi-gian-toi 2027 cho chính auth.uid())
create or replace function nhan_li_xi_tet(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    r public.li_xi_tet;
begin
    if v_uid is null then
        return jsonb_build_object('ket_qua', 'chua_dang_nhap');
    end if;
    select * into r from public.li_xi_tet where ma = p_ma for update;
    if not found or r.trang_thai not in ('san_sang', 'da_nhan') then
        return jsonb_build_object('ket_qua', 'khong_co');
    end if;
    if r.trang_thai = 'da_nhan' then
        if r.nguoi_nhan_id = v_uid then
            return jsonb_build_object('ket_qua', 'da_nhan_boi_ban', 'nam', r.nam);
        end if;
        return jsonb_build_object('ket_qua', 'da_co_nguoi_nhan');
    end if;
    if r.het_han < v_hom_nay then
        return jsonb_build_object('ket_qua', 'het_han');
    end if;

    update public.li_xi_tet
       set trang_thai = 'da_nhan',
           nguoi_nhan_id = v_uid,
           nhan_luc = now()
     where id = r.id;

    return jsonb_build_object('ket_qua', 'da_nhan', 'nam', r.nam, 'het_han', r.het_han);
end;
$$;

-- Kiểm tra quyền mở khoá trọn báo cáo /thoi-gian-toi (2027) từ Lì xì đã nhận
create or replace function li_xi_hieu_luc() returns boolean
    language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.li_xi_tet
        where nguoi_nhan_id = (select auth.uid())
          and trang_thai = 'da_nhan'
          and nam >= 2027
    )
$$;

-- Danh sách bao lì xì đã tặng & đã nhận của chính tài khoản
create or replace function ds_li_xi_cua_toi() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'da_tang', coalesce((
            select jsonb_agg(jsonb_build_object(
                'ma', l.ma, 'ma_don', l.ma_don, 'ten_nguoi_tang', l.ten_nguoi_tang,
                'loi_chuc', l.loi_chuc, 'mau_thiep', l.mau_thiep, 'nam', l.nam,
                'trang_thai', l.trang_thai, 'het_han', l.het_han, 'nhan_luc', l.nhan_luc, 'tao_luc', l.tao_luc
            ) order by l.tao_luc desc, l.id asc)
            from public.li_xi_tet l where l.nguoi_tang_id = (select auth.uid())
        ), '[]'::jsonb),
        'da_nhan', coalesce((
            select jsonb_agg(jsonb_build_object(
                'ma', l.ma, 'ten_nguoi_tang', l.ten_nguoi_tang, 'loi_chuc', l.loi_chuc,
                'mau_thiep', l.mau_thiep, 'nam', l.nam, 'nhan_luc', l.nhan_luc
            ) order by l.nhan_luc desc)
            from public.li_xi_tet l where l.nguoi_nhan_id = (select auth.uid()) and l.trang_thai = 'da_nhan'
        ), '[]'::jsonb)
    )
$$;

-- Hoàn tiền đơn Lì xì (chỉ chủ sở hữu, sau khi đã chuyển tiền ngoài; CHỈ khi 0 bao trong đơn đã được nhận)
create or replace function hoan_don_li_xi(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_da_nhan integer;
begin
    if v_uid is null or not exists (select 1 from public.vai_tro_quan_tri where user_id = v_uid and vai_tro = 'chu_so_huu') then
        return jsonb_build_object('ket_qua', 'khong_du_quyen');
    end if;
    if char_length(trim(coalesce(p_ly_do, ''))) < 5 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    select count(*) into v_da_nhan from public.li_xi_tet where ma_don = p_ma_don and trang_thai = 'da_nhan';
    if v_da_nhan > 0 then
        return jsonb_build_object('ket_qua', 'da_co_bao_duoc_nhan', 'so_da_nhan', v_da_nhan);
    end if;
    update public.li_xi_tet set trang_thai = 'hoan' where ma_don = p_ma_don and trang_thai in ('cho_tra', 'san_sang');
    update public.don_nap set trang_thai = 'hoan' where ma_don = p_ma_don and loai = 'li_xi';
    return jsonb_build_object('ket_qua', 'da_hoan', 'ma_don', p_ma_don);
end;
$$;

revoke all on function lx_gia_goi(integer), lx_bat(), lx_don_da_tra(), li_xi_thong_tin(),
    tao_don_li_xi(text, integer, text, text, text), xem_li_xi_tet(text), nhan_li_xi_tet(text),
    li_xi_hieu_luc(), ds_li_xi_cua_toi(), hoan_don_li_xi(bigint, text) from public, anon, authenticated;

grant execute on function li_xi_thong_tin(), xem_li_xi_tet(text) to anon, authenticated;
grant execute on function tao_don_li_xi(text, integer, text, text, text), nhan_li_xi_tet(text),
    li_xi_hieu_luc(), ds_li_xi_cua_toi(), hoan_don_li_xi(bigint, text) to authenticated;
