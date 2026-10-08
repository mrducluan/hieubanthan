-- Rollback cho 0009_kb_thanso_chan_dung_quan_he.sql — chỉ xoá các khối do 0009 thêm.
delete from thanso_kb_khoi where khoi in ('chan_dung_mat', 'chan_dung', 'quan_he', 'quan_he_theo_so');
