-- SEC-2 đợt 2 (2026-10-23, docs/BAO-MAT.md mục SEC-2). Chỉ thêm / thay hàm + một cột — không xoá dữ liệu.
-- (1) hoan_sao_hoi(): web trừ Sao TRƯỚC khi gọi engine (chặn N câu song song với 1 Sao) → engine lỗi thì hoàn đúng dòng
--     vừa trừ. CHỈ service role; chỉ dòng 'dung' khoá 'dung:<uid>:hoi:…' trong 15 phút; mỗi dòng hoàn một lần.
-- (2) Ghi chú góp ý thần số (0016, quy tắc (a) hết hạn 12 tháng): cụm còn nhận phiếu thì mau_ghi_chu cũ sống mãi (dọn
--     chỉ xét cap_nhat của cụm). Thêm thời điểm cho TỪNG ghi chú (trigger) + dọn theo từng ghi chú.
-- (3) Kho vectơ ý định (0017): câu do người dùng xác nhận tự bật khi ≥ 3 khoá VÀ ≥ 2 người đăng nhập (trước: ≥ 1) —
--     một tài khoản + hai IP (VPN) không còn tự bật được câu của mình.

-- (1)
create or replace function hoan_sao_hoi(p_user_id uuid, p_khoa text) returns boolean
    language plpgsql security definer set search_path = '' as $$
declare r record;
begin
    if p_user_id is null or p_khoa is null or p_khoa not like 'dung:' || p_user_id || ':hoi:%' then return false; end if;
    perform pg_advisory_xact_lock(hashtext('sao:' || p_user_id));
    select * into r from public.so_cai_sao
        where khoa = p_khoa and user_id = p_user_id and loai = 'dung' and tao_luc > now() - interval '15 minutes';
    if r.id is null then return false; end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
    values (p_user_id, -r.so_luong, 'dieu_chinh', 'Hoàn Sao — câu hỏi chưa trả lời được', left('hoan:' || p_khoa, 120))
    on conflict (khoa) do nothing;
    return found;
end; $$;
revoke all on function hoan_sao_hoi(uuid, text) from public, anon, authenticated;
grant execute on function hoan_sao_hoi(uuid, text) to service_role;

-- (2)
alter table thanso_cum_bat_thuong add column if not exists ghi_chu_luc timestamptz[] not null default '{}';
-- Ghi chú cũ chưa có mốc: lấy cap_nhat (lần cập nhật cuối của cụm — muộn nhất có thể) cho mọi ghi chú.
update thanso_cum_bat_thuong set ghi_chu_luc = array_fill(cap_nhat, array[cardinality(mau_ghi_chu)])
    where cardinality(mau_ghi_chu) > 0 and cardinality(ghi_chu_luc) <> cardinality(mau_ghi_chu);

create or replace function thanso_cum_moc_ghi_chu() returns trigger
    language plpgsql set search_path = '' as $$
begin
    if tg_op = 'INSERT' then
        new.ghi_chu_luc := array_fill(now(), array[cardinality(new.mau_ghi_chu)]);
    elsif new.mau_ghi_chu is distinct from old.mau_ghi_chu then
        if cardinality(new.mau_ghi_chu) = 0 then new.ghi_chu_luc := '{}';
        elsif cardinality(old.mau_ghi_chu) > 0 and new.mau_ghi_chu[2:] = old.mau_ghi_chu[1:cardinality(new.mau_ghi_chu) - 1] then
            new.ghi_chu_luc := (array[now()] || old.ghi_chu_luc)[1:cardinality(new.mau_ghi_chu)];   -- thêm một ghi chú mới lên đầu
        elsif new.ghi_chu_luc is not distinct from old.ghi_chu_luc then
            new.ghi_chu_luc := array_fill(now(), array[cardinality(new.mau_ghi_chu)]);
        end if;
    end if;
    return new;
end; $$;
drop trigger if exists thanso_cum_moc_ghi_chu on thanso_cum_bat_thuong;
create trigger thanso_cum_moc_ghi_chu before insert or update of mau_ghi_chu on thanso_cum_bat_thuong
    for each row execute function thanso_cum_moc_ghi_chu();

create or replace function don_du_lieu_hoc() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare a int; b int; c int;
begin
    delete from public.thanso_phan_hoi where het_han < now();
    get diagnostics a = row_count;
    delete from public.ky_uc_nguoi_dung where het_han < now();
    get diagnostics b = row_count;
    -- SEC-2: bỏ TỪNG ghi chú quá 12 tháng (giữ thứ tự), không chờ cả cụm im lặng 12 tháng.
    update public.thanso_cum_bat_thuong c set
        mau_ghi_chu = coalesce((select array_agg(g.chu order by g.i) from unnest(c.mau_ghi_chu, c.ghi_chu_luc) with ordinality g(chu, luc, i)
                                where g.luc >= now() - interval '365 days'), '{}'),
        ghi_chu_luc = coalesce((select array_agg(g.luc order by g.i) from unnest(c.mau_ghi_chu, c.ghi_chu_luc) with ordinality g(chu, luc, i)
                                where g.luc >= now() - interval '365 days'), '{}')
        where exists (select 1 from unnest(c.ghi_chu_luc) l where l < now() - interval '365 days')
           or (cardinality(c.mau_ghi_chu) > 0 and cardinality(c.ghi_chu_luc) <> cardinality(c.mau_ghi_chu));
    get diagnostics c = row_count;
    return jsonb_build_object('phan_hoi', a, 'ky_uc', b, 'cum_lam_sach', c);
end
$$;
revoke all on function don_du_lieu_hoc() from public, anon, authenticated;
grant execute on function don_du_lieu_hoc() to service_role;

-- (3)
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
                                   and g.so_dang_nhap + (case when coalesce(p_dang_nhap, false) then 1 else 0 end) >= 2
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
