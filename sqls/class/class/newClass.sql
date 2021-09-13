insert into class(
    id,
    name,
    start_date,
    end_date,
    description,
    created_at,
    updated_at,
    school_id,
    activated
) values (
    uuid_generate_v1(),
    '${className}',
    '${classStartDate}',
    '${classEndDate}',
    '${classDescription}',
    now(),
    now(),
    '${schoolId}',
    true
) 
returning id;