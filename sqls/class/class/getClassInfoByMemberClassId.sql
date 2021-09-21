select 
    c.id class_id, 
    c.name class_name, 
    c.description class_description, 
    c.start_date class_start_date, 
    c.end_date class_end_date,
    (select array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from
            (select 
                m.id member_id, 
                m.nickname member_nickname, 
                m.description member_description, 
                u.phone phone , 
                f.address member_image, 
                sr.grade member_grade, 
                sr.name member_type, 
                sr.id school_role_id, 
                c.id class_id, 
                c.name class_name, 
                c.start_date class_start_date,
                c.end_date class_end_date, 
                s.name school_name, 
                s.id school_id, 
                u.id user_id, 
                u.name username
            from member m
                left join file f on m.image_id = f.id 
                join school_role sr on sr.id = m.school_role_id
                join users u on u.id = m.user_id
                join schools s on s.id = m.school_id
            where 
                c.id = m.class_id 
                and sr.grade<5 
                and sr.grade >2 
                and m.is_active is true 
            ) tmp
        )
    ) teachers),
    (select array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from (select 
                m.id member_id, 
                m.nickname member_nickname, 
                m.description member_description, 
                u.phone phone,
                f.address member_image,
                k.id kid_id,
                k.name ,
                sr.grade member_grade, 
                sr.name member_type, 
                sr.id school_role_id, 
                c.id class_id, 
                c.name class_name, 
                c.start_date class_start_date, 
                c.end_date class_end_date, 
                s.name school_name, 
                s.id school_id, 
                u.id user_id,
                m.relation  
            from member m
                left join file f on m.image_id = f.id 
                join school_role sr on sr.id = m.school_role_id 
                join kid k on m.kid_id = k.id
                join schools s on s.id = m.school_id
                join users u on u.id = m.user_id
            where 
                c.id = m.class_id 
                and sr.grade>4 
                and m.is_active is true 
            ) tmp)
        ) guardians)
from 
    class c
where
    c.id = '${classId}';