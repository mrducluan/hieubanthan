-- 0032 — KV-THANG "Tháng của tôi" (docs/DE-XUAT-CO-CHE-V2.md, chủ dự án duyệt 2026-10-29): nhật ký ngày ghé theo
-- TÀI KHOẢN để lịch ghé / tổng kết tháng / huy hiệu "Đủ 9 nhịp" không mất khi đổi máy.
--   (1) Bảng nhat_ky_ghe (user_id, ngay, so = số ngày cá nhân 1–9 do engine tính và web chuyển sang, la = mã lá đã lật):
--       MỘT dòng / ngày, chỉ chủ sở hữu đọc (RLS), không ai ghi thẳng — chỉ diem_danh() ghi; tự dọn dòng > 400 ngày.
--       KHÔNG tính thần số trong SQL (một bộ tính — CLAUDE.md): `so` là con số engine đã trả, SQL chỉ đếm.
--   (2) diem_danh(p_so, p_la) thay diem_danh(): mọi logic chuỗi / ngày nghỉ / thưởng của 0025 + 0030 giữ NGUYÊN; thêm
--       ghi nhật ký và trả `ngay_ghe_thang` (ngày 1–31 đã ghé tháng này) + `thang_truoc` {nam, thang, so_ngay, so_la,
--       so_khac, du_9, ngay} để web dựng lịch + tổng kết mà không truy vấn thêm. Gọi không tham số vẫn được (mặc định null).
--   (3) huy_hieu_cua_toi() thêm mã `du_9_nhip` (tháng có đủ 9 số ngày cá nhân khác nhau; luc = ngày ghé cuối tháng đó).
-- Không đụng Sao, không đổi mức thưởng. Chạy SAU 0030. Rollback: 0032_nhat_ky_ghe.down.sql (khôi phục hai hàm bản 0030).

-- ---------------------------------------------------------------- (1) bảng nhật ký ghé
create table if not exists nhat_ky_ghe (
    user_id  uuid not null references auth.users (id) on delete cascade,
    ngay     date not null,
    so       smallint check (so between 1 and 9),
    la       text check (la in ('viec', 'cau_hoi', 'gio')),
    primary key (user_id, ngay)
);
alter table nhat_ky_ghe enable row level security;
drop policy if exists "nhat_ky_ghe chu doc" on nhat_ky_ghe;
create policy "nhat_ky_ghe chu doc" on nhat_ky_ghe for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on nhat_ky_ghe from anon, authenticated;
revoke all on nhat_ky_ghe from anon;
grant select on nhat_ky_ghe to authenticated;   -- chủ sở hữu đọc qua RLS (Bản thân dựng tổng kết), không dựa default privileges

-- ---------------------------------------------------------------- (2) diem_danh(p_so, p_la)
drop function if exists diem_danh();
create or replace function diem_danh(p_so integer default null, p_la text default null) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_c public.chuoi_ngay;
    v_moi boolean := false;
    v_tiep boolean;     -- ghé hôm qua → nối tiếp
    v_nghi boolean;     -- bỏ đúng hôm qua, còn ngày nghỉ → nối tiếp bằng ngày nghỉ
    v_bat boolean := public.qt_bat_cau_hinh('sao.chuoi.bat');
    v_moc integer := public.qt_so_cau_hinh('sao.chuoi.moc', 7, 2, 30);
    v_muc integer := public.qt_so_cau_hinh('sao.chuoi.sao', 2, 0, 20);
    v_tran integer := public.qt_so_cau_hinh('sao.chuoi.tran_30_ngay', 6, 0, 60);
    v_da integer;
    v_sao integer := 0;
    v_so smallint := case when p_so between 1 and 9 then p_so end;             -- số ngày cá nhân (engine tính, web chuyển)
    v_la text := case when p_la in ('viec', 'cau_hoi', 'gio') then p_la end;   -- mã lá đã lật
    v_thang date := date_trunc('month', v_ngay)::date;
    v_ghe jsonb;
    v_truoc jsonb;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    perform pg_advisory_xact_lock(hashtext('chuoi:' || v_uid));
    select * into v_c from public.chuoi_ngay where user_id = v_uid;
    if v_c.user_id is null then
        insert into public.chuoi_ngay (user_id, ngay_cuoi, chuoi, dai_nhat) values (v_uid, v_ngay, 1, 1)
        returning * into v_c;
        v_moi := true;
    elsif v_c.ngay_cuoi < v_ngay then
        v_tiep := v_c.ngay_cuoi = v_ngay - 1;
        v_nghi := not v_tiep and v_c.ngay_cuoi = v_ngay - 2
                  and (v_c.nghi_cuoi is null or v_c.nghi_cuoi < v_ngay - 7);
        update public.chuoi_ngay set
            chuoi = case when v_tiep or v_nghi then v_c.chuoi + 1 else 1 end,
            dai_nhat = greatest(v_c.dai_nhat, case when v_tiep or v_nghi then v_c.chuoi + 1 else 1 end),
            ngay_cuoi = v_ngay,
            nghi_cuoi = case when v_nghi then v_ngay - 1 else v_c.nghi_cuoi end
        where user_id = v_uid returning * into v_c;
        v_moi := true;
    end if;
    if v_moi and v_bat and v_muc > 0 and v_c.chuoi % v_moc = 0 then
        select coalesce(sum(so_luong), 0) into v_da from public.so_cai_sao
            where user_id = v_uid and loai = 'chuoi' and tao_luc > now() - interval '30 days';
        v_sao := least(v_muc, greatest(0, v_tran - v_da));
        if v_sao > 0 then
            insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
            values (v_uid, v_sao, 'chuoi', 'Ghé ' || v_c.chuoi || ' ngày liên tiếp', 'chuoi:' || v_uid || ':' || v_ngay,
                    current_date + 365)
            on conflict (khoa) do nothing;
            if not found then v_sao := 0; end if;
        end if;
    end if;
    -- (0032) nhật ký ngày ghé: một dòng / ngày; gọi lại trong ngày chỉ bổ sung số / lá. Dọn > 400 ngày của chính người này.
    insert into public.nhat_ky_ghe (user_id, ngay, so, la) values (v_uid, v_ngay, v_so, v_la)
    on conflict (user_id, ngay) do update
        set so = coalesce(excluded.so, public.nhat_ky_ghe.so), la = coalesce(excluded.la, public.nhat_ky_ghe.la);
    delete from public.nhat_ky_ghe where user_id = v_uid and ngay < v_ngay - 400;
    select coalesce(jsonb_agg(extract(day from ngay)::int order by ngay), '[]'::jsonb) into v_ghe
        from public.nhat_ky_ghe where user_id = v_uid and ngay >= v_thang and ngay < v_thang + interval '1 month';
    select jsonb_build_object('nam', extract(year from v_thang - interval '1 month')::int,
                              'thang', extract(month from v_thang - interval '1 month')::int,
                              'so_ngay', count(*), 'so_la', count(la), 'so_khac', count(distinct so),
                              'du_9', count(distinct so) >= 9,
                              'ngay', coalesce(jsonb_agg(extract(day from ngay)::int order by ngay), '[]'::jsonb))
        into v_truoc
        from public.nhat_ky_ghe where user_id = v_uid and ngay >= v_thang - interval '1 month' and ngay < v_thang;
    return jsonb_build_object('ngay', v_ngay, 'chuoi', v_c.chuoi, 'dai_nhat', v_c.dai_nhat, 'moi', v_moi,
        'bat', v_bat and v_muc > 0, 'moc', v_moc, 'sao_moc', v_muc, 'con_ngay', v_moc - (v_c.chuoi % v_moc), 'sao', v_sao,
        'da_nghi', coalesce(v_c.nghi_cuoi = v_ngay - 1, false),
        'nghi_con', v_c.nghi_cuoi is null or v_c.nghi_cuoi < v_ngay - 7,
        'ngay_ghe_thang', v_ghe, 'thang_truoc', v_truoc);
end
$$;

-- ---------------------------------------------------------------- (3) huy hiệu + du_9_nhip
create or replace function huy_hieu_cua_toi() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_dai integer := 0;
    v_ngay_cuoi date;
    v_chuoi integer := 0;
    v_ho_so timestamptz;
    v_moi_1 timestamptz;
    v_moi_5 timestamptz;
    v_hoi integer := 0;
    v_hoi_luc timestamptz;
    v_hv boolean := false;
    v_hv_txt text;
    v_du9 date;          -- (0032) tháng đầu tiên đi qua đủ 9 số ngày cá nhân (nhật ký ghé)
    v_du9_luc date;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    select dai_nhat, ngay_cuoi, chuoi into v_dai, v_ngay_cuoi, v_chuoi from public.chuoi_ngay where user_id = v_uid;
    select tao_luc into v_ho_so from public.ho_so where user_id = v_uid;
    select min(tao_luc) into v_moi_1 from public.gioi_thieu where nguoi_moi_id = v_uid;
    select tao_luc into v_moi_5 from public.gioi_thieu where nguoi_moi_id = v_uid order by tao_luc offset 4 limit 1;
    if to_regclass('public.dem_hoi_tai_khoan') is not null then
        execute 'select so, cap_nhat_luc from public.dem_hoi_tai_khoan where user_id = $1' into v_hoi, v_hoi_luc using v_uid;
    end if;
    -- 0028: hoi_vien_hieu_luc(p_uid uuid default null) — dò đúng chữ ký (uuid); hỏi về chính mình.
    if to_regprocedure('public.hoi_vien_hieu_luc(uuid)') is not null then
        begin
            execute 'select public.hoi_vien_hieu_luc($1)::text' into v_hv_txt using v_uid;
            -- boolean → 'true'/'t'; jsonb → đọc cờ hieu_luc / dat / con_hieu_luc nếu có.
            if v_hv_txt in ('t', 'true') then v_hv := true;
            elsif v_hv_txt like '{%' then
                v_hv := coalesce((v_hv_txt::jsonb->>'hieu_luc')::boolean, (v_hv_txt::jsonb->>'dat')::boolean,
                                 (v_hv_txt::jsonb->>'con_hieu_luc')::boolean, false);
            end if;
        exception when others then v_hv := false;
        end;
    end if;
    -- (0032) "Đủ 9 nhịp": một tháng có đủ 9 số ngày cá nhân khác nhau trong nhật ký ghé (chỉ đếm, không tính thần số).
    select min(thang) into v_du9 from (
        select date_trunc('month', ngay)::date as thang from public.nhat_ky_ghe
        where user_id = v_uid and so is not null group by 1 having count(distinct so) >= 9) t;
    if v_du9 is not null then
        select max(ngay) into v_du9_luc from public.nhat_ky_ghe
            where user_id = v_uid and ngay >= v_du9 and ngay < v_du9 + interval '1 month';
    end if;
    return jsonb_build_array(
        -- Ngày đạt chuỗi: suy được khi chuỗi hiện tại chính là chuỗi dài nhất (ngày thứ N = ngay_cuoi − (chuoi − N)).
        jsonb_build_object('ma', 'chuoi_7',  'dat', coalesce(v_dai, 0) >= 7,
            'luc', case when v_chuoi >= 7 and v_chuoi = v_dai then v_ngay_cuoi - (v_chuoi - 7) end),
        jsonb_build_object('ma', 'chuoi_30', 'dat', coalesce(v_dai, 0) >= 30,
            'luc', case when v_chuoi >= 30 and v_chuoi = v_dai then v_ngay_cuoi - (v_chuoi - 30) end),
        jsonb_build_object('ma', 'da_luu_ho_so', 'dat', v_ho_so is not null, 'luc', (v_ho_so at time zone 'Asia/Ho_Chi_Minh')::date),
        jsonb_build_object('ma', 'hoi_3', 'dat', coalesce(v_hoi, 0) >= 3,
            'luc', case when coalesce(v_hoi, 0) >= 3 then (v_hoi_luc at time zone 'Asia/Ho_Chi_Minh')::date end),
        jsonb_build_object('ma', 'moi_1', 'dat', v_moi_1 is not null, 'luc', (v_moi_1 at time zone 'Asia/Ho_Chi_Minh')::date),
        jsonb_build_object('ma', 'moi_5', 'dat', v_moi_5 is not null, 'luc', (v_moi_5 at time zone 'Asia/Ho_Chi_Minh')::date),
        jsonb_build_object('ma', 'hoi_vien', 'dat', v_hv, 'luc', null),
        jsonb_build_object('ma', 'du_9_nhip', 'dat', v_du9 is not null, 'luc', v_du9_luc)
    );
end
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function diem_danh(integer, text), huy_hieu_cua_toi() from public, anon, authenticated;
grant execute on function diem_danh(integer, text), huy_hieu_cua_toi() to authenticated;

comment on table nhat_ky_ghe is 'KV-THANG: nhật ký ngày ghé Hôm nay theo tài khoản (ngày, số ngày cá nhân engine trả, lá đã lật). Chỉ diem_danh() ghi.';
