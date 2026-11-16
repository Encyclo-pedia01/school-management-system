-- =====================================================================
-- Optional starter skeleton  (run AFTER 0001_init.sql)
--
-- Nothing here names a school: it only creates the structure most
-- basic schools start with — three terms, the usual class ladder, a
-- subject list per level and an empty fee structure to fill in.
--
-- Skip this file if you would rather build everything in the app's
-- School setup screen.  Reset with:  supabase db reset
-- =====================================================================

-- ------------------------------------------------------- school profile
-- Placeholder row; put your own details in School setup (or edit here).
insert into school_settings (id, name, short_name, currency, timezone)
values (1, '', '', 'GHS', 'Africa/Accra')
on conflict (id) do nothing;

-- --------------------------------------------------------------- terms
insert into terms (name, academic_year, starts_on, ends_on, is_current)
select t.name, t.academic_year, t.starts_on::date, t.ends_on::date, t.is_current
from (values
  ('Term 1', to_char(now(), 'YYYY') || '/' || (to_char(now(), 'YYYY')::int + 1), to_char(now(), 'YYYY') || '-09-08', to_char(now(), 'YYYY') || '-12-18', true),
  ('Term 2', to_char(now(), 'YYYY') || '/' || (to_char(now(), 'YYYY')::int + 1), (to_char(now(), 'YYYY')::int + 1) || '-01-12', (to_char(now(), 'YYYY')::int + 1) || '-04-02', false),
  ('Term 3', to_char(now(), 'YYYY') || '/' || (to_char(now(), 'YYYY')::int + 1), (to_char(now(), 'YYYY')::int + 1) || '-04-20', (to_char(now(), 'YYYY')::int + 1) || '-07-16', false)
) as t(name, academic_year, starts_on, ends_on, is_current)
where not exists (select 1 from terms);

-- ------------------------------------------------------------- classes
insert into classes (name, level, room, capacity)
select c.name, c.level::school_level, c.room, c.capacity
from (values
  ('Crèche',   'Preschool', 'Block A · 01', 18),
  ('Nursery 1','Preschool', 'Block A · 02', 22),
  ('Nursery 2','Preschool', 'Block A · 03', 22),
  ('KG 1',     'Preschool', 'Block A · 04', 26),
  ('KG 2',     'Preschool', 'Block A · 05', 26),
  ('Basic 1',  'Primary',   'Block B · 01', 30),
  ('Basic 2',  'Primary',   'Block B · 02', 30),
  ('Basic 3',  'Primary',   'Block B · 03', 30),
  ('Basic 4',  'Primary',   'Block B · 04', 30),
  ('Basic 5',  'Primary',   'Block B · 05', 30),
  ('Basic 6',  'Primary',   'Block B · 06', 30),
  ('JHS 1',    'JHS',       'Block C · 01', 34),
  ('JHS 2',    'JHS',       'Block C · 02', 34),
  ('JHS 3',    'JHS',       'Block C · 03', 34)
) as c(name, level, room, capacity)
on conflict (name) do nothing;

-- ------------------------------------------------------------ subjects
insert into subjects (name, level)
select s.name, s.level::school_level
from (values
  ('Language & Literacy',  'Preschool'),
  ('Numeracy',             'Preschool'),
  ('Creative Arts',        'Preschool'),
  ('Our World Our People', 'Preschool'),
  ('Physical Development', 'Preschool'),
  ('English Language',     'Primary'),
  ('Mathematics',          'Primary'),
  ('Science',              'Primary'),
  ('Our World Our People', 'Primary'),
  ('Creative Arts',        'Primary'),
  ('Ghanaian Language',    'Primary'),
  ('Computing',            'Primary'),
  ('Physical Education',   'Primary'),
  ('English Language',     'JHS'),
  ('Mathematics',          'JHS'),
  ('Integrated Science',   'JHS'),
  ('Social Studies',       'JHS'),
  ('Computing',            'JHS'),
  ('Ghanaian Language',    'JHS'),
  ('Career Technology',    'JHS'),
  ('Physical Education',   'JHS')
) as s(name, level)
on conflict (name, level) do nothing;

-- --------------------------------------------------------- fee structure
-- Set the real amounts in School setup → Fees per term.
insert into fee_structure (level, term_id, amount)
select l.level::school_level, t.id, 0
from (values ('Preschool'), ('Primary'), ('JHS')) as l(level)
cross join terms t
where t.is_current
  and not exists (
  select 1 from fee_structure f where f.level = l.level::school_level and f.term_id = t.id
);

-- ----------------------------------------------------------- the rest
-- Staff, guardians, pupils, attendance, scores, invoices and payments are
-- intentionally left empty — admit real people through the app.
