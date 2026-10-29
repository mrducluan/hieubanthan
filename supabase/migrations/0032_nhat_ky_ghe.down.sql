-- Rollback 0032_nhat_ky_ghe.sql: bỏ bảng nhat_ky_ghe, khôi phục diem_danh() và huy_hieu_cua_toi() bản 0030 (chép nguyên văn).
drop function if exists diem_danh(integer, text);
drop function if exists huy_hieu_cua_toi();
drop table if exists nhat_ky_ghe;

create or replace function diem_danh() returns jsonb
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
    return jsonb_build_object('ngay', v_ngay, 'chuoi', v_c.chuoi, 'dai_nhat', v_c.dai_nhat, 'moi', v_moi,
        'bat', v_bat and v_muc > 0, 'moc', v_moc, 'sao_moc', v_muc, 'con_ngay', v_moc - (v_c.chuoi % v_moc), 'sao', v_sao,
        'da_nghi', coalesce(v_c.nghi_cuoi = v_ngay - 1, false),
        'nghi_con', v_c.nghi_cuoi is null or v_c.nghi_cuoi < v_ngay - 7);
end
$$;

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
        jsonb_build_object('ma', 'hoi_vien', 'dat', v_hv, 'luc', null)
    );
end
$$;

revoke all on function diem_danh(), huy_hieu_cua_toi() from public, anon, authenticated;
grant execute on function diem_danh(), huy_hieu_cua_toi() to authenticated;
