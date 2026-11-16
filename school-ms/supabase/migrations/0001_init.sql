-- =====================================================================
-- School management system — schema (school-agnostic; the school's own details live in school_settings)
-- Apply with:  supabase db push      (or paste into the SQL editor)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
-- Only staff and guardians sign in; pupils are records maintained by the school.
do $$ begin
  create type user_role as enum ('admin', 'teacher', 'parent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type school_level as enum ('Preschool', 'Primary', 'JHS');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('Cash', 'Mobile Money', 'Bank Transfer', 'Cheque');
exception when duplicate_object then null; end $$;

do $$ begin
  create type announcement_audience as enum ('all', 'parents', 'staff');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- school
create table if not exists school_settings (
  id            int primary key default 1 check (id = 1),
  name          text not null default '',        -- set in School setup
  short_name    text not null default '',
  motto         text,
  address       text,
  phone         text,
  email         text,
  head_teacher  text,
  currency      text not null default 'GHS',
  timezone      text not null default 'Africa/Accra',
  -- the school's editable grading scale: [{ id, label, min, remark, tone }, ...]
  grading_scale jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- idempotent for databases created before the scale was editable
alter table school_settings
  add column if not exists grading_scale jsonb not null default '[]'::jsonb;

create table if not exists terms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- 'Term 1'
  academic_year text not null,               -- '2026/2027'
  starts_on   date not null,
  ends_on     date not null,
  is_current  boolean not null default false
);

create table if not exists fee_structure (
  id          uuid primary key default gen_random_uuid(),
  level       school_level not null,
  term_id     uuid references terms(id) on delete cascade,
  amount      numeric(10,2) not null check (amount >= 0),
  unique (level, term_id)
);

-- -------------------------------------------------------------- people
-- One row per authenticated user, linked to Supabase auth.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'parent',
  full_name   text not null,
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

create table if not exists staff (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique references profiles(id) on delete set null,
  staff_no     text unique,
  full_name    text not null,
  role_title   text not null,
  department   text not null,
  email        text,
  phone        text,
  status       text not null default 'Active' check (status in ('Active', 'On leave', 'Left')),
  hired_on     date default current_date
);

create table if not exists classes (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,       -- 'JHS 2'
  level           school_level not null,
  room            text,
  capacity        int not null default 30,
  form_teacher_id uuid references staff(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists subjects (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  level  school_level not null,
  unique (name, level)
);

create table if not exists guardians (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique references profiles(id) on delete set null,
  full_name    text not null,
  phone        text,
  email        text,
  relation     text check (relation in ('Mother', 'Father', 'Guardian')),
  occupation   text,
  address      text,
  created_at   timestamptz not null default now()
);

create table if not exists students (
  id            uuid primary key default gen_random_uuid(),
  admission_no  text not null unique,
  first_name    text not null,
  last_name     text not null,
  gender        text not null check (gender in ('Male', 'Female')),
  dob           date,
  class_id      uuid references classes(id) on delete set null,
  guardian_id   uuid references guardians(id) on delete set null,
  house         text,
  address       text,
  enrolled_on   date not null default current_date,
  status        text not null default 'Active' check (status in ('Active', 'Left', 'Graduated'))
);

-- pupils do not sign in in this build (staff + guardians only)
alter table students drop column if exists profile_id;

create index if not exists students_class_idx on students (class_id);
create index if not exists students_guardian_idx on students (guardian_id);

-- teaching assignments: which teacher teaches which subject in which class
create table if not exists teaching_assignments (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  unique (staff_id, class_id, subject_id)
);

-- ---------------------------------------------------------- academics
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  date        date not null,
  status      attendance_status not null,
  recorded_by uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, date)
);

create index if not exists attendance_date_idx on attendance (date);
create index if not exists attendance_class_date_idx on attendance (class_id, date);

create table if not exists scores (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  subject_id   uuid not null references subjects(id) on delete cascade,
  term_id      uuid not null references terms(id) on delete cascade,
  class_score  numeric(5,2) not null default 0 check (class_score between 0 and 30),
  exam_score   numeric(5,2) not null default 0 check (exam_score between 0 and 70),
  entered_by   uuid references staff(id) on delete set null,
  updated_at   timestamptz not null default now(),
  unique (student_id, subject_id, term_id)
);

create table if not exists report_cards (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  term_id       uuid not null references terms(id) on delete cascade,
  average       numeric(5,2),
  aggregate     int,
  position      int,
  class_size    int,
  teacher_remark text,
  head_remark   text,
  published     boolean not null default false,
  published_at  timestamptz,
  unique (student_id, term_id)
);

-- ------------------------------------------------------------- finance
create table if not exists invoices (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  term_id     uuid not null references terms(id) on delete cascade,
  amount      numeric(10,2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (student_id, term_id)
);

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  term_id     uuid not null references terms(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  method      payment_method not null default 'Cash',
  receipt_no  text not null unique,
  paid_on     date not null default current_date,
  recorded_by uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists payments_student_idx on payments (student_id);

-- ---------------------------------------------------------------- comms
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    announcement_audience not null default 'parents',
  author_id   uuid references staff(id) on delete set null,
  author_name text,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- views
-- =====================================================================
create or replace view v_student_balance as
select
  s.id                as student_id,
  s.admission_no,
  s.first_name || ' ' || s.last_name as full_name,
  c.name              as class_name,
  c.level,
  i.term_id,
  i.amount            as billed,
  coalesce(p.paid, 0) as paid,
  greatest(i.amount - coalesce(p.paid, 0), 0) as balance,
  case
    when coalesce(p.paid, 0) >= i.amount then 'Paid'
    when coalesce(p.paid, 0) > 0 then 'Part paid'
    else 'Owing'
  end as fee_status
from students s
join classes c on c.id = s.class_id
left join invoices i on i.student_id = s.id
left join (
  select student_id, term_id, sum(amount) as paid
  from payments group by student_id, term_id
) p on p.student_id = s.id and p.term_id = i.term_id;

create or replace view v_class_results as
select
  sc.student_id,
  st.class_id,
  sc.term_id,
  sc.subject_id,
  sub.name as subject,
  sc.class_score + sc.exam_score as total,
  case
    when sc.class_score + sc.exam_score >= 80 then 1
    when sc.class_score + sc.exam_score >= 75 then 2
    when sc.class_score + sc.exam_score >= 70 then 3
    when sc.class_score + sc.exam_score >= 65 then 4
    when sc.class_score + sc.exam_score >= 60 then 5
    when sc.class_score + sc.exam_score >= 55 then 6
    when sc.class_score + sc.exam_score >= 50 then 7
    when sc.class_score + sc.exam_score >= 45 then 8
    else 9
  end as grade
from scores sc
join students st on st.id = sc.student_id
join subjects sub on sub.id = sc.subject_id;

-- =====================================================================
-- helper functions used by RLS
-- =====================================================================
create or replace function current_role_of() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_of() = 'admin', false);
$$;

create or replace function staff_id_of() returns uuid
language sql stable security definer set search_path = public as $$
  select id from staff where profile_id = auth.uid();
$$;

create or replace function teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classes c where c.id = p_class and c.form_teacher_id = staff_id_of()
  ) or exists (
    select 1 from teaching_assignments ta where ta.class_id = p_class and ta.staff_id = staff_id_of()
  );
$$;

create or replace function guardian_id_of() returns uuid
language sql stable security definer set search_path = public as $$
  select id from guardians where profile_id = auth.uid();
$$;

create or replace function can_see_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or exists (select 1 from students s where s.id = p_student
                   and s.guardian_id = guardian_id_of())
      or exists (select 1 from students s where s.id = p_student
                   and teaches_class(s.class_id));
$$;

-- =====================================================================
-- row level security
-- =====================================================================
alter table school_settings        enable row level security;
alter table terms                  enable row level security;
alter table fee_structure          enable row level security;
alter table profiles               enable row level security;
alter table staff                  enable row level security;
alter table classes                enable row level security;
alter table subjects               enable row level security;
alter table guardians              enable row level security;
alter table students               enable row level security;
alter table teaching_assignments   enable row level security;
alter table attendance             enable row level security;
alter table scores                 enable row level security;
alter table report_cards           enable row level security;
alter table invoices               enable row level security;
alter table payments               enable row level security;
alter table announcements          enable row level security;
alter table accounts               enable row level security;

-- read-mostly reference data: everyone signed in
create policy "read settings"  on school_settings for select using (true);
create policy "read terms"     on terms           for select using (true);
create policy "read fees"      on fee_structure   for select using (true);
create policy "read classes"   on classes         for select using (true);
create policy "read subjects"  on subjects        for select using (true);
create policy "admin writes reference data" on school_settings for all using (is_admin()) with check (is_admin());
create policy "admin writes terms"  on terms         for all using (is_admin()) with check (is_admin());
create policy "admin writes fees"   on fee_structure for all using (is_admin()) with check (is_admin());
create policy "admin writes classes" on classes      for all using (is_admin()) with check (is_admin());
create policy "admin writes subjects" on subjects    for all using (is_admin()) with check (is_admin());

-- accounts: admins manage the invite/reset trail; nobody reads hashes client-side
create policy "accounts admin" on accounts for all using (is_admin()) with check (is_admin());

-- profiles: own row, admins all
create policy "profile self read"  on profiles for select using (id = auth.uid() or is_admin());
create policy "profile self write" on profiles for update using (id = auth.uid() or is_admin());

-- staff: admins manage; teachers can read the staff directory
create policy "staff read"   on staff for select using (auth.uid() is not null);
create policy "staff admin"  on staff for all    using (is_admin()) with check (is_admin());

-- guardians: admins manage, guardian sees self
create policy "guardian read"  on guardians for select using (is_admin() or profile_id = auth.uid());
create policy "guardian admin" on guardians for all    using (is_admin()) with check (is_admin());

-- students: admins all, teachers their classes, parents their children
create policy "students read" on students for select using (can_see_student(id));
create policy "students admin" on students for all
  using (is_admin()) with check (is_admin());

create policy "assignments read" on teaching_assignments for select using (auth.uid() is not null);
create policy "assignments admin" on teaching_assignments for all using (is_admin()) with check (is_admin());

-- attendance: admin & teachers record, families read
create policy "attendance read" on attendance for select using (can_see_student(student_id));
create policy "attendance write" on attendance for all
  using (is_admin() or teaches_class(class_id))
  with check (is_admin() or teaches_class(class_id));

-- scores
create policy "scores read" on scores for select using (can_see_student(student_id));
create policy "scores write" on scores for all
  using (
    is_admin() or exists (
      select 1 from students s where s.id = scores.student_id and teaches_class(s.class_id)
    )
  )
  with check (
    is_admin() or exists (
      select 1 from students s where s.id = scores.student_id and teaches_class(s.class_id)
    )
  );

-- report cards: published ones visible to families, drafts only staff/admin
create policy "reports read" on report_cards for select using (
  is_admin()
  or (published and can_see_student(student_id))
  or exists (select 1 from students s where s.id = report_cards.student_id and teaches_class(s.class_id))
);
create policy "reports write" on report_cards for all using (is_admin()) with check (is_admin());

-- money: admin full, families read their own
create policy "invoices read" on invoices for select using (can_see_student(student_id));
create policy "invoices admin" on invoices for all using (is_admin()) with check (is_admin());
create policy "payments read" on payments for select using (can_see_student(student_id));
create policy "payments admin" on payments for all using (is_admin()) with check (is_admin());

-- announcements: audience-aware read
create policy "announcements read" on announcements for select using (
  is_admin()
  or audience = 'all'
  or (audience = 'parents' and current_role_of() = 'parent')
  or (audience = 'staff' and current_role_of() in ('staff', 'teacher'))
);
create policy "announcements write" on announcements for all
  using (is_admin() or current_role_of() = 'teacher')
  with check (is_admin() or current_role_of() = 'teacher');

-- -------------------------------------------------------------- trigger
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists school_settings_touch on school_settings;
create trigger school_settings_touch before update on school_settings
  for each row execute function touch_updated_at();

-- auto-create a profile row for every new auth user
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- -------------------------------------------------------------- access keys
-- Access keys: the local build signs in with login + key (hashed) instead of
-- Supabase Auth. Once Supabase Auth is wired up, `profiles` takes over and this
-- table becomes the invite/reset trail — keep it for parity with the local store.
create table if not exists accounts (
  id          uuid primary key default gen_random_uuid(),
  role        user_role not null default 'parent',
  full_name   text not null,
  login       text not null unique,
  key_hash    text not null,
  staff_id    uuid references staff(id) on delete set null,
  guardian_id uuid references guardians(id) on delete set null,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz
);

