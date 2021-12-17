select 
	k.id kid_id,
	m.class_id class_id,
	c.name class_name,
	k.name kid_name,
	k.image_id kid_image_id	
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
	left join class c on c.id = m.class_id
	left join kid k on k.id = m.kid_id
where 
	m.school_id = '${schoolId}'
	and sr.grade = 5
order by
	k.name asc;