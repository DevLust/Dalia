-- Execute no SQL Editor do Supabase (uma vez) para suportar várias fotos por produto.
alter table produtos add column if not exists imagens jsonb default '[]'::jsonb;
