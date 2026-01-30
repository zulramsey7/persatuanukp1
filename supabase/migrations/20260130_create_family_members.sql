create table public.family_members (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  nama_penuh text not null,
  hubungan text not null,
  constraint family_members_pkey primary key (id),
  constraint family_members_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
);

alter table public.family_members enable row level security;

create policy "Users can view their own family members" on public.family_members
  for select using (auth.uid() = user_id);

create policy "Users can insert their own family members" on public.family_members
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own family members" on public.family_members
  for update using (auth.uid() = user_id);

create policy "Users can delete their own family members" on public.family_members
  for delete using (auth.uid() = user_id);
