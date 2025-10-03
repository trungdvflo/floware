ALTER TABLE canvas_detail MODIFY created_date DOUBLE(13,3);
ALTER TABLE canvas_detail MODIFY updated_date DOUBLE(13,3);
ALTER TABLE canvas_detail MODIFY order_update_time DOUBLE(13,3);

ALTER TABLE deleted_items MODIFY created_date DOUBLE(13,3);
ALTER TABLE deleted_items MODIFY updated_date DOUBLE(13,3);


ALTER TABLE files MODIFY created_date DOUBLE(13,3);
ALTER TABLE files MODIFY updated_date DOUBLE(13,3);

ALTER TABLE kanbans MODIFY created_date DOUBLE(13,3);
ALTER TABLE kanbans MODIFY updated_date DOUBLE(13,3);
ALTER TABLE kanbans MODIFY order_update_time DOUBLE(13,3);
ALTER TABLE kanbans MODIFY archived_time DOUBLE(13,3);

ALTER TABLE links MODIFY created_date DOUBLE(13,3);
ALTER TABLE links MODIFY updated_date DOUBLE(13,3);


ALTER TABLE local_settings MODIFY created_date DOUBLE(13,3);
ALTER TABLE local_settings MODIFY updated_date DOUBLE(13,3);


ALTER TABLE obj_order MODIFY created_date DOUBLE(13,3);
ALTER TABLE obj_order MODIFY updated_date DOUBLE(13,3);

ALTER TABLE projects MODIFY created_date DOUBLE(13,3);
ALTER TABLE projects MODIFY updated_date DOUBLE(13,3);

ALTER TABLE set_accounts MODIFY created_date DOUBLE(13,3);
ALTER TABLE set_accounts MODIFY updated_date DOUBLE(13,3);

ALTER TABLE settings MODIFY created_date DOUBLE(13,3);
ALTER TABLE settings MODIFY updated_date DOUBLE(13,3);

ALTER TABLE subscription_purchase MODIFY created_date DOUBLE(13,3);

ALTER TABLE tracking MODIFY created_date DOUBLE(13,3);
ALTER TABLE tracking MODIFY updated_date DOUBLE(13,3);
ALTER TABLE tracking MODIFY time_send DOUBLE(13,3);
ALTER TABLE tracking MODIFY replied_time DOUBLE(13,3);

ALTER TABLE trash MODIFY created_date DOUBLE(13,3);
ALTER TABLE trash MODIFY updated_date DOUBLE(13,3);
ALTER TABLE trash MODIFY trash_time DOUBLE(13,3);

ALTER TABLE urls MODIFY created_date DOUBLE(13,3);
ALTER TABLE urls MODIFY updated_date DOUBLE(13,3);

ALTER TABLE users MODIFY created_date DOUBLE(13,3);
ALTER TABLE users MODIFY updated_date DOUBLE(13,3);

UPDATE kanbans
SET archived_time = updated_date
where archive_status = 1;
