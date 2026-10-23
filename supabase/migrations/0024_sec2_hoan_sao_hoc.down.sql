-- Rollback 0024: bỏ hàm hoàn Sao, mốc từng ghi chú, trả quy tắc tự bật ý định về ≥ 1 người đăng nhập (như 0016/0017).
drop function if exists hoan_sao_hoi(uuid, text);
drop trigger if exists thanso_cum_moc_ghi_chu on thanso_cum_bat_thuong;
drop function if exists thanso_cum_moc_ghi_chu();
alter table thanso_cum_bat_thuong drop column if exists ghi_chu_luc;
create or replace function don_du_lieu_hoc() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare a int; b int; c int;
begin
    delete from public.thanso_phan_hoi where het_han < now();
    get diagnostics a = row_count;
    delete from public.ky_uc_nguoi_dung where het_han < now();
    get diagnostics b = row_count;
    update public.thanso_cum_bat_thuong set mau_ghi_chu = '{}'
        where mau_ghi_chu <> '{}' and cap_nhat < now() - interval '365 days';
    get diagnostics c = row_count;
    return jsonb_build_object('phan_hoi', a, 'ky_uc', b, 'cum_lam_sach', c);
end
$$;
revoke all on function don_du_lieu_hoc() from public, anon, authenticated;
grant execute on function don_du_lieu_hoc() to service_role;
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
revoke all on function xac_nhan_y_dinh(text, text, text, jsonb, text, text, boolean) from public, anon, authenticated;
grant execute on function xac_nhan_y_dinh(text, text, text, jsonb, text, text, boolean) to service_role;
