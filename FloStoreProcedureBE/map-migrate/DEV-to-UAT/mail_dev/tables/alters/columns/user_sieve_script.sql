ALTER TABLE user_sieve_script
ADD COLUMN `conditions` json NOT NULL AFTER `script_data`,
ADD COLUMN `destinations` varchar(100) NOT NULL AFTER `conditions`;