select 	
	m.id member_id,
	sr.grade member_grade,
	sr.name member_relation,
	c.id class_id,
	c.name class_name	
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
	left join class c on c.id = m.class_id	
where
    m.school_id = '${schoolId}'
	and m.class_id = '${classId}'
    and m.kid_id = '${kidId}'
    and sr.grade = 6;