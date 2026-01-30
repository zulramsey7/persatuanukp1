-- View untuk menyusun paparan Ahli dan Tanggungan
-- Ini memudahkan admin melihat siapa tanggungan bagi setiap ahli
create or replace view public.view_ahli_dan_tanggungan as
select 
    p.nama_penuh as nama_ketua_keluarga,
    p.no_ahli,
    p.no_telefon as telefon_ketua,
    f.nama_penuh as nama_tanggungan,
    f.hubungan,
    f.created_at as tarikh_ditambah
from 
    profiles p
join 
    family_members f on p.id = f.user_id
order by 
    p.nama_penuh asc,
    -- Susun hubungan mengikut keutamaan logik
    case 
        when f.hubungan = 'Suami' then 1
        when f.hubungan = 'Isteri' then 2
        when f.hubungan = 'Bapa' then 3
        when f.hubungan = 'Ibu' then 4
        when f.hubungan = 'Anak' then 5
        else 6 
    end;
