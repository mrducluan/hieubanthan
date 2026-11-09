-- HTT-1 (2026-11-09, docs/DANH-GIA-HYBRID-TWO-TIER.md mục 3.5) — phiếu "Đúng với mình / Chưa đúng" ghi thêm NGÔN NGỮ của
-- trang người bấm (vi / en …) để tầng HỌC so tỉ lệ thấy đúng giữa bản Việt và bản dịch (kiểm định hai tỉ lệ ở engine,
-- /quan-tri/hoc → hàng đợi NGƯỜI DUYỆT xem lại bản chuyển ngữ). Máy không tự sửa lời, không tự viết lại.
--   * Cột `ngon_ngu` mặc định 'vi' (phiếu cũ giữ nguyên nghĩa); mã BCP-47 ngắn, chữ thường.
--   * `ghi_kiem_chung` thêm tham số `p_ngon_ngu` (mặc định 'vi') — web cũ gọi 6 tham số vẫn chạy; đổi ý trên trang khác
--     ngôn ngữ → phiếu mang ngôn ngữ mới (một phiếu / người / mã như cũ).
--   * `ty_le_kiem_chung_ngon_ngu()`: số đúng / chưa đúng theo (mã, ngôn ngữ) cho khung "Lệch theo ngôn ngữ".
-- Không BEGIN/COMMIT (chạy bằng psql -1 hoặc SQL Editor). Chạy SAU 0021 (cần kiem_chung_phieu + hàm 0017/0021).
-- Rollback: 0034_kiem_chung_ngon_ngu.down.sql (trả hàm 6 tham số của 0017, bỏ cột, bỏ hàm tỉ lệ theo ngôn ngữ).

alter table kiem_chung_phieu add column if not exists ngon_ngu text not null default 'vi';
alter table kiem_chung_phieu drop constraint if exists kiem_chung_phieu_ngon_ngu_check;
alter table kiem_chung_phieu add constraint kiem_chung_phieu_ngon_ngu_check check (ngon_ngu ~ '^[a-z]{2}(-[a-z]{2,4})?$');
create index if not exists kiem_chung_phieu_mau_ngon_ngu on kiem_chung_phieu (mau, ngon_ngu);

-- Hàm ghi: thân như 0017, thêm ngôn ngữ (sai khuôn → 'vi'). Bỏ bản 6 tham số để lời gọi 6 tham số không mơ hồ.
drop function if exists ghi_kiem_chung(text, uuid, text, text, text, text);
create or replace function ghi_kiem_chung(p_khoa text, p_user_id uuid, p_loai text, p_mau text, p_phai text,
                                          p_ket_qua text, p_ngon_ngu text default 'vi') returns boolean
    language plpgsql security definer set search_path = '' as $$
declare
    v_nn text := case when p_ngon_ngu ~ '^[a-z]{2}(-[a-z]{2,4})?$' then p_ngon_ngu else 'vi' end;
begin
    if p_ket_qua is null or p_ket_qua not in ('dung', 'chua_dung') then return false; end if;
    if p_khoa is null or p_khoa !~ '^[a-f0-9]{32,64}$' then return false; end if;
    if not public.kiem_chung_ma_hop_le(p_loai, p_mau, p_phai) then return false; end if;
    -- Chặn bơm: một khoá tối đa 3000 mã còn hạn (người thật bấm vài chục).
    if not exists (select 1 from public.kiem_chung_phieu where khoa = p_khoa and loai = p_loai and mau = p_mau)
       and (select count(*) from public.kiem_chung_phieu where khoa = p_khoa) >= 3000 then
        return false;
    end if;
    insert into public.kiem_chung_phieu as k (khoa, user_id, loai, mau, phai, ket_qua, ngon_ngu)
    values (p_khoa, p_user_id, p_loai, p_mau, p_phai, p_ket_qua, v_nn)
    on conflict (khoa, loai, mau) do update
        set ket_qua = excluded.ket_qua, phai = excluded.phai, user_id = coalesce(excluded.user_id, k.user_id),
            ngon_ngu = excluded.ngon_ngu, cap_nhat = now(), het_han = now() + interval '24 months';
    return true;
end
$$;
revoke all on function ghi_kiem_chung(text, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function ghi_kiem_chung(text, uuid, text, text, text, text, text) to service_role;

-- Số đúng / chưa đúng theo (mã, ngôn ngữ), chỉ phiếu còn hạn, chỉ cặp ≥ p_toi_thieu phiếu, tối đa 5000 dòng.
create or replace function ty_le_kiem_chung_ngon_ngu(p_toi_thieu integer default 30)
    returns table (mau text, ngon_ngu text, dung integer, chua_dung integer)
    language sql stable security definer set search_path = '' as $$
    select k.mau, k.ngon_ngu, (count(*) filter (where k.ket_qua = 'dung'))::int, (count(*) filter (where k.ket_qua = 'chua_dung'))::int
    from public.kiem_chung_phieu k
    where k.het_han > now()
    group by k.mau, k.ngon_ngu
    having count(*) >= greatest(coalesce(p_toi_thieu, 30), 1)
    order by count(*) desc, k.mau, k.ngon_ngu
    limit 5000
$$;
revoke all on function ty_le_kiem_chung_ngon_ngu(integer) from public, anon, authenticated;
grant execute on function ty_le_kiem_chung_ngon_ngu(integer) to service_role;
