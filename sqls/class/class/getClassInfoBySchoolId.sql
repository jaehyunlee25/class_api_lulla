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
            from members m
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
                    u.id user_id, 
                    u.name username, 
                    u.phone, 
                    d.id, 
                    d.role_type 
                from demand d
                left join users u on d.user_id = u.id
                where 
                    d.class_id = c.id 
                    and (d.role_type = 3 or d.role_type = 4) 
                    and d.confirmed is false
                )tmp
            )
        ) teacher_demand),
    (select array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from (select 
                    u.id user_id, 
                    u.name username, 
                    u.phone, 
                    i.id , 
                    i.type, 
                    sr.name 
                from invitation i
                left join users u on i.user_id = u.id
                left join school_role sr on sr.id = i.role_id
                where 
                    i.class_id = c.id 
                    and (i.type = 3 or i.type = 4) 
                    and i.confirmed is false 
                )tmp
            )
        ) teacher_invitation),
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
            from members m
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
        ) guardians),
    (select array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from (select 
                    u.id user_id, 
                    u.name username, 
                    k.birth birth,
                    k.name  as name, 
                    k.gender gender,
                    d.id, 
                    d.role_type, 
                    u.phone  
                from 
                    demand d
                        left join users u on d.user_id = u.id
                        left join kid k on d.kid_id = k.id
                where 
                    d.class_id = c.id 
                    and (d.role_type = 5 or d.role_type = 6) 
                    and d.confirmed is false
            )tmp)
        ) guardian_demand),
    (select array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from (select 
                u.id user_id, 
                u.name username, 
                u.phone , 
                i.id, 
                i.type, 
                k.name, 
                k.id kid_id  
            from invitation i
                left join users u on i.user_id = u.id
                left join kid k on k.id = i.kid_id
            where 
                i.class_id = c.id 
                and (i.type = 5 or i.type = 6) 
                and i.confirmed is false 
            )tmp)
        ) guardian_invitation)
from
    class c
where
    c.school_id = '${schoolId}';
