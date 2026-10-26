-- Rollback 0030_chuoi_huy_hieu.sql: bỏ huy_hieu_cua_toi(), khôi phục diem_danh() bản 0025 (không ngày nghỉ), bỏ cột
-- nghi_cuoi. Chuỗi đang có giữ nguyên số (chuoi / dai_nhat không đổi) — chỉ mất khả năng nối tiếp qua ngày nghỉ.
drop function if exists huy_hieu_cua_toi();

create or replace function diem_danh() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_c public.chuoi_ngay;
    v_moi boolean := false;
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
        update public.chuoi_ngay set
            chuoi = case when v_c.ngay_cuoi = v_ngay - 1 then v_c.chuoi + 1 else 1 end,
            dai_nhat = greatest(v_c.dai_nhat, case when v_c.ngay_cuoi = v_ngay - 1 then v_c.chuoi + 1 else 1 end),
            ngay_cuoi = v_ngay
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
        'bat', v_bat and v_muc > 0, 'moc', v_moc, 'sao_moc', v_muc, 'con_ngay', v_moc - (v_c.chuoi % v_moc), 'sao', v_sao);
end
$$;
revoke all on function diem_danh() from public, anon, authenticated;
grant execute on function diem_danh() to authenticated;

alter table chuoi_ngay drop column if exists nghi_cuoi;
