select 
	k.id kid_id,
	k.name kid_name,
	k.birth kid_birth,
	cast(extract(year from k.birth) as text) || '년 ' 
	|| cast(extract(month from k.birth) as text) || '월 '
	|| cast(extract(day from k.birth) as text) || '일' kid_birth_text,
	k.gender kid_gender,
	case 
		cast(k.gender as text) 
		when '1' then '남아' 
		when '0' then '여아' 
	end kid_gender_text,
	
	m.id member_id,
	sr.grade member_grade,
	sr.name member_relation,	
	m.nickname member_name,
	u.phone member_phone,
	m.image_id member_image_id,
	
	c.id class_id,
	c.name class_name	
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
	left join class c on c.id = m.class_id
	left join kid k on k.id = m.kid_id
	left join users u on u.id = m.user_id
where
    m.school_id = '${schoolId}'
	and m.class_id = '${classId}'
    and m.kid_id = '${kidId}'
    and sr.grade = 5;