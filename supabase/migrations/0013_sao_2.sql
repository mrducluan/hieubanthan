-- SAO-2 (2026-10-12): hạn mức hỏi đáp miễn phí mỗi ngày + thống kê doanh thu / nạp / mời cho quản trị.
-- Không lưu nội dung câu hỏi. Khoá đếm lượt: 'u:' + user_id (đã đăng nhập) hoặc 'k:' + HMAC(IP) do web tính
-- (không lưu IP). Chỉ service role ghi (web máy chủ). Chạy SAU 0012. Rollback: 0013_sao_2.down.sql

create table if not exists luot_hoi (
    khoa  text not null check (char_length(khoa) between 3 and 80),
    ngay  date not null,
    so    integer not null default 0 check (so >= 0),
    primary key (khoa, ngay)
);
alter table luot_hoi enable row level security;   -- không policy: chỉ hàm SECURITY DEFINER / service role

-- Dùng 1 lượt miễn phí hôm nay (giờ VN) nếu còn dưới trần. Trả {duoc, da_dung, tran}. Nguyên tử (một câu lệnh).
create or replace function dung_luot_hoi(p_khoa text, p_tran integer) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_so integer;
begin
    if p_khoa is null or p_khoa !~ '^[uk]:[A-Za-z0-9-]{8,64}$' then raise exception 'khoa_khong_hop_le'; end if;
    p_tran := least(greatest(coalesce(p_tran, 0), 0), 1000);
    if p_tran = 0 then return jsonb_build_object('duoc', false, 'da_dung', 0, 'tran', 0); end if;
    insert into public.luot_hoi as l (khoa, ngay, so) values (p_khoa, v_ngay, 1)
    on conflict (khoa, ngay) do update set so = l.so + 1 where l.so < p_tran
    returning so into v_so;
    if v_so is null then return jsonb_build_object('duoc', false, 'da_dung', p_tran, 'tran', p_tran); end if;
    -- dọn ngày cũ thỉnh thoảng (≈1% lượt) — bảng chỉ cần hôm nay
    if random() < 0.01 then delete from public.luot_hoi where ngay < v_ngay - 2; end if;
    return jsonb_build_object('duoc', true, 'da_dung', v_so, 'tran', p_tran);
end
$$;

-- Thống kê doanh thu (chủ sở hữu): tổng, theo ngày, theo gói, người nạp nhiều nhất, người mời nhiều nhất, Sao phát/tiêu.
-- Email hiện đầy đủ cho CHỦ SỞ HỮU để hỗ trợ đối soát; mỗi lần xem ghi nhật ký quản trị.
create or replace function thong_ke_doanh_thu(p_ngay integer default 30) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_tu timestamptz;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    p_ngay := least(greatest(coalesce(p_ngay, 30), 1), 365);
    v_tu := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh' - make_interval(days => p_ngay - 1);
    perform public.qt_ghi('doanh_thu.xem', p_ngay::text, null);
    return jsonb_build_object(
        'ngay', p_ngay,
        'tong', (select jsonb_build_object(
                    'doanh_thu', coalesce(sum(so_tien) filter (where trang_thai = 'da_tra'), 0),
                    'don_tra', count(*) filter (where trang_thai = 'da_tra'),
                    'don_cho', count(*) filter (where trang_thai = 'cho'),
                    'don_huy', count(*) filter (where trang_thai = 'huy'),
                    'don_hoan', count(*) filter (where trang_thai = 'hoan'),
                    'don_sai_tien', count(*) filter (where trang_thai = 'sai_tien'),
                    'nguoi_nap', count(distinct user_id) filter (where trang_thai = 'da_tra'),
                    'nguoi_tao_don', count(distinct user_id))
                 from public.don_nap where tao_luc >= v_tu),
        'nguoi_nap_lan_dau', (select count(*) from (
                    select user_id, min(tra_luc) dau from public.don_nap where trang_thai = 'da_tra' group by user_id) d
                 where d.dau >= v_tu),
        'theo_ngay', coalesce((select jsonb_agg(jsonb_build_object('ngay', n.ngay, 'doanh_thu', n.tien, 'don', n.don) order by n.ngay)
                 from (select (tra_luc at time zone 'Asia/Ho_Chi_Minh')::date ngay, sum(so_tien) tien, count(*) don
                       from public.don_nap where trang_thai = 'da_tra' and tra_luc >= v_tu group by 1) n), '[]'::jsonb),
        'theo_goi', coalesce((select jsonb_agg(jsonb_build_object('goi', g.goi, 'don', g.don, 'doanh_thu', g.tien) order by g.tien desc)
                 from (select goi, count(*) don, sum(so_tien) tien from public.don_nap
                       where trang_thai = 'da_tra' and tra_luc >= v_tu group by goi) g), '[]'::jsonb),
        'top_nap', coalesce((select jsonb_agg(jsonb_build_object('email', u.email, 'tong', t.tien, 'lan', t.lan,
                                'lan_cuoi', t.cuoi, 'so_du', public.qt_so_du(t.user_id)) order by t.tien desc)
                 from (select user_id, sum(so_tien) tien, count(*) lan, max(tra_luc) cuoi from public.don_nap
                       where trang_thai = 'da_tra' and tra_luc >= v_tu group by user_id order by 2 desc limit 20) t
                 join auth.users u on u.id = t.user_id), '[]'::jsonb),
        'top_moi', coalesce((select jsonb_agg(jsonb_build_object('email', u.email, 'so_moi', m.so,
                                'ban_da_nap', m.nap) order by m.so desc)
                 from (select g.nguoi_moi_id, count(*) so,
                              count(*) filter (where exists (select 1 from public.don_nap d
                                               where d.user_id = g.duoc_moi_id and d.trang_thai = 'da_tra')) nap
                       from public.gioi_thieu g where g.tao_luc >= v_tu group by 1 order by 2 desc limit 20) m
                 join auth.users u on u.id = m.nguoi_moi_id), '[]'::jsonb),
        'moi', (select jsonb_build_object('luot', count(*),
                    'ban_da_nap', count(*) filter (where exists (select 1 from public.don_nap d
                                                   where d.user_id = g.duoc_moi_id and d.trang_thai = 'da_tra')))
                from public.gioi_thieu g where g.tao_luc >= v_tu),
        'sao', (select jsonb_build_object(
                    'mua', coalesce(sum(so_luong) filter (where loai = 'mua'), 0),
                    'tang', coalesce(sum(so_luong) filter (where loai in ('chao_mung', 'moi_ban', 'duoc_moi')), 0),
                    'tieu', coalesce(-sum(so_luong) filter (where loai = 'dung'), 0))
                from public.so_cai_sao where tao_luc >= v_tu),
        'tieu_theo', coalesce((select jsonb_agg(jsonb_build_object('muc', t.muc, 'sao', t.sao, 'luot', t.luot) order by t.sao desc)
                 from (select coalesce(ghi_chu, 'Khác') muc, -sum(so_luong) sao, count(*) luot from public.so_cai_sao
                       where loai = 'dung' and tao_luc >= v_tu group by 1 order by 2 desc limit 20) t), '[]'::jsonb)
    );
end
$$;

-- Dải thông báo đã chuyển sang CMS (CMS-GD) — bỏ khoá cũ để cau_hinh_cong_khai() không còn trả chữ cũ.
delete from cau_hinh where khoa in ('site.thong_bao', 'site.thong_bao_link');

revoke all on function dung_luot_hoi(text, integer), thong_ke_doanh_thu(integer) from public, anon, authenticated;
grant execute on function dung_luot_hoi(text, integer) to service_role;
grant execute on function thong_ke_doanh_thu(integer) to authenticated;
revoke all on luot_hoi from anon, authenticated;
