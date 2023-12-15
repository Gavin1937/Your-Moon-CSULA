
CREATE USER 'yourmoonapp'@'%' IDENTIFIED BY 'password';

GRANT INSERT, UPDATE, DELETE, SELECT on YourMoonDB.* TO 'yourmoonapp'@'%';

SHOW GRANTS FOR 'yourmoonapp'@'%';
