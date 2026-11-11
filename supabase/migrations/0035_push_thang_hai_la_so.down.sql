-- Rollback cho 0035_push_thang_hai_la_so.sql: bỏ mốc 'thang_hai_la_so' khỏi mọi dòng rồi trả ràng buộc 0020.
update push_tuy_chon set moc_lich = array_remove(moc_lich, 'thang_hai_la_so') where 'thang_hai_la_so' = any (moc_lich);
alter table push_tuy_chon drop constraint if exists push_tuy_chon_moc_lich_check;
alter table push_tuy_chon add constraint push_tuy_chon_moc_lich_check
    check (moc_lich <@ array['thang_ca_nhan', 'giao_tiet', 'lap_xuan_tet']::text[]);
comment on column push_tuy_chon.moc_lich is 'Mốc lịch người dùng tự tích: thang_ca_nhan · giao_tiet · lap_xuan_tet.';
