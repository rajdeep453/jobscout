create extension if not exists vector;

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  location text,
  description text,
  source_url text,
  role_category text,
  seniority text,
  skills text[],
  embedding vector(768),
  search_tsv tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
  ) stored
);
