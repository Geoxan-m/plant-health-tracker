create table public.plants (
 id text primary key,
 owner_id text not null,
 name text not null check (length(trim(name)) between 1 and 120),
 species text not null check (length(trim(species)) between 1 and 120),
 location text not null check (length(trim(location)) between 1 and 120),
 status text not null check (status in ('Healthy','Watch','Needs care')),
 demo integer not null default 0 check (demo in (0,1)),
 created_at timestamptz not null default now(),
 unique (owner_id,id)
);
create table public.logs (
 id text primary key,
 owner_id text not null,
 plant_id text not null,
 type text not null check (type in ('Watering','Symptom','Observation')),
 date date not null check (date <= current_date),
 note text not null check (length(trim(note)) between 1 and 2000),
 status text check (status in ('Healthy','Watch','Needs care')),
 amount integer check (amount between 1 and 100000),
 created_at timestamptz not null default now(),
 foreign key (owner_id,plant_id) references public.plants(owner_id,id) on delete cascade,
 check (amount is null or type='Watering')
);
create index plants_owner_created on public.plants(owner_id,created_at desc);
create index logs_owner_date on public.logs(owner_id,date desc,created_at desc);
create index logs_owner_plant on public.logs(owner_id,plant_id);
alter table public.plants enable row level security;
alter table public.logs enable row level security;
revoke all on public.plants,public.logs from anon,authenticated;
grant select,insert,update,delete on public.plants,public.logs to service_role;
-- Only the authenticated server gateway may access these tables.
create policy server_only_plants on public.plants for all to anon,authenticated using (false) with check (false);
create policy server_only_logs on public.logs for all to anon,authenticated using (false) with check (false);
alter table public.plants add column photo text check (photo is null or (length(photo)<=220000 and photo like 'data:image/jpeg;base64,/9j/%'));
alter table public.plants add column analysis jsonb check (analysis is null or (jsonb_typeof(analysis)='object' and octet_length(analysis::text)<=6000));
