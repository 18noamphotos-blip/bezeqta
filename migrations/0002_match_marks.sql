create table if not exists match_marks (
  match_id integer primary key,
  played boolean not null default false,
  score text not null default '',
  updated_at timestamptz not null default now()
);
