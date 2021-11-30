select 
    name, 
    id, 
    start_date, 
    end_date 
from 
    class
where 
    school_id = '${schoolId}';