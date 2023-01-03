-- Test Snowflake file
use WAREHOUSE sigma_se_wh ;

select *
from se_demo_db.retail_demo.plugs_electronics_hands_on_lab_data
limit 100
;