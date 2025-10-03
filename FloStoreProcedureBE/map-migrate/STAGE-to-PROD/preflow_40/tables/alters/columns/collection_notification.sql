ALTER TABLE `collection_notification`
CHANGE COLUMN email email varchar(225) NOT NULL,
CHANGE COLUMN assignees assignees text NOT NULL;