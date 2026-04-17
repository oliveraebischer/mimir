-- Mimir database schema

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  key text not null,
  value text not null,
  source text,
  confidence numeric check (confidence >= 0 and confidence <= 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(persona_id, key)
);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_key_hash text not null unique,
  created_at timestamptz not null default now()
);

create type permission_level as enum ('read', 'read_write');

create table if not exists access_rules (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  permission permission_level not null default 'read',
  unique(provider_id, persona_id)
);

-- Auto-update updated_at on memories
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger memories_updated_at
  before update on memories
  for each row execute function update_updated_at();
