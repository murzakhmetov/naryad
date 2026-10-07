-- NaryadAI Supabase Schema
-- Run this against the Supabase PostgreSQL database

-- Enable realtime
alter publication supabase_realtime add table work_orders;
alter publication supabase_realtime add table employees;
alter publication supabase_realtime add table notifications;

-- Profiles table (linked to Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('master', 'worker', 'admin')) default 'worker',
  employee_id text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Workshops
create table if not exists workshops (
  id text primary key,
  name text not null,
  code text not null,
  manager text not null,
  equipment_count int default 0
);

alter table workshops enable row level security;
create policy "Workshops readable by all" on workshops for select using (true);
create policy "Workshops writable by authenticated" on workshops for all using (auth.role() = 'authenticated');

-- Equipment
create table if not exists equipment (
  id text primary key,
  name text not null,
  inventory_number text not null,
  workshop_id text references workshops(id),
  type text not null,
  criticality text check (criticality in ('Критическая', 'Высокая', 'Средняя', 'Низкая')),
  status text default 'operational',
  qr_code text,
  total_operating_hours int default 0,
  last_maintenance_date date
);

alter table equipment enable row level security;
create policy "Equipment readable by all" on equipment for select using (true);
create policy "Equipment writable by authenticated" on equipment for all using (auth.role() = 'authenticated');

-- Brigades
create table if not exists brigades (
  id text primary key,
  name text not null,
  leader_id text,
  members_count int default 0
);

alter table brigades enable row level security;
create policy "Brigades readable by all" on brigades for select using (true);
create policy "Brigades writable by authenticated" on brigades for all using (auth.role() = 'authenticated');

-- Employees
create table if not exists employees (
  id text primary key,
  full_name text not null,
  specialty text not null,
  rank int default 4,
  brigade_id text references brigades(id),
  role text check (role in ('master', 'worker', 'head', 'admin')) default 'worker',
  shift text check (shift in ('A', 'B')) default 'A',
  status text default 'free',
  current_order_id text,
  queued_orders_count int default 0,
  rating numeric(5,2) default 90,
  on_time_rate numeric(5,2) default 90,
  rework_rate numeric(5,2) default 3.0,
  phone text,
  avatar_initials text,
  auth_user_id uuid references auth.users(id)
);

alter table employees enable row level security;
create policy "Employees readable by all" on employees for select using (true);
create policy "Employees writable by authenticated" on employees for all using (auth.role() = 'authenticated');

-- Fault codes
create table if not exists fault_codes (
  code text primary key,
  category text not null,
  description text not null,
  standard_norm_hours numeric(4,1) default 1.0
);

alter table fault_codes enable row level security;
create policy "Fault codes readable by all" on fault_codes for select using (true);

-- Materials catalog
create table if not exists materials (
  id text primary key,
  code text not null,
  name text not null,
  unit text not null,
  standard_price numeric(10,2) default 0,
  current_stock int default 0
);

alter table materials enable row level security;
create policy "Materials readable by all" on materials for select using (true);

-- Work orders (main table)
create table if not exists work_orders (
  id text primary key,
  number text not null,
  type text check (type in ('emergency', 'planned', 'urgent')) default 'planned',
  title text not null,
  description text,
  workshop_id text references workshops(id),
  equipment_id text,
  equipment_name text,
  assigned_worker_id text,
  assigned_worker_name text,
  issued_by_master_id text,
  issued_by_master_name text,
  priority text check (priority in ('emergency', 'high', 'normal', 'planned')) default 'normal',
  created_at timestamptz default now(),
  deadline_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  status text default 'issued',
  photo_before_url text,
  photo_after_url text,
  fault_code text,
  performed_work_description text,
  worker_comment text,
  is_overdue boolean default false,
  overdue_minutes int default 0,
  downtime_hours numeric(6,2),
  ai_evaluation jsonb,
  materials_spent jsonb default '[]'::jsonb,
  status_history jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table work_orders enable row level security;
create policy "Work orders readable by all authenticated" on work_orders for select using (auth.role() = 'authenticated');
create policy "Work orders insertable by authenticated" on work_orders for insert with check (auth.role() = 'authenticated');
create policy "Work orders updatable by authenticated" on work_orders for update using (auth.role() = 'authenticated');
create policy "Work orders deletable by authenticated" on work_orders for delete using (auth.role() = 'authenticated');

-- Notifications
create table if not exists notifications (
  id text primary key,
  user_id uuid references auth.users(id),
  employee_id text,
  order_id text,
  order_number text,
  type text check (type in ('emergency', 'warning', 'info', 'success')) default 'info',
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
create policy "Notifications readable by owner" on notifications for select using (auth.uid() = user_id or user_id is null);
create policy "Notifications insertable by authenticated" on notifications for insert with check (auth.role() = 'authenticated');
create policy "Notifications updatable by owner" on notifications for update using (auth.uid() = user_id or user_id is null);

-- Auto-update updated_at on work_orders
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_work_orders_updated_at
  before update on work_orders
  for each row execute function update_updated_at_column();

-- Function to handle new user signup -> auto-create profile
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'worker')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Storage bucket policies (bucket "some" already exists)
-- Allow authenticated users to upload
insert into storage.buckets (id, name, public) values ('some', 'some', true)
on conflict (id) do update set public = true;

create policy "Anyone can view photos" on storage.objects for select using (bucket_id = 'some');
create policy "Authenticated users can upload" on storage.objects for insert with check (bucket_id = 'some' and auth.role() = 'authenticated');
