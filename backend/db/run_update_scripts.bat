@echo off
echo 正在更新数据库结构...

REM 运行SQL脚本来修改表结构
mysql -u root -p136228508 arai_db < alter_system_import_status.sql
mysql -u root -p136228508 arai_db < alter_stock_transaction_logs.sql
mysql -u root -p136228508 arai_db < modify_transaction_unique_key.sql

echo 数据库更新完成！
pause 