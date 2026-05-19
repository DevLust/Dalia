create extension if not exists "pgcrypto";

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha text not null,
  papel text not null check (papel in ('cliente', 'atendente', 'administrador', 'gerente'))
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  endereco text not null,
  telefone text not null,
  email text,
  medidas jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'vestido',
  descricao text not null,
  data_cadastro date not null default current_date,
  imagem text,
  status text not null default 'disponivel',
  quantidade int not null default 1 check (quantidade >= 0),
  valor_aluguel numeric,
  valor_calcao numeric
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  tipo_pagamento text not null,
  tipo_pedido text not null,
  data_agendamento date not null,
  data_retirada date not null,
  data_evento date not null,
  data_devolucao date,
  status text not null,
  itens jsonb not null default '[]',
  valor_total numeric,
  valor_pago numeric,
  pago boolean not null default false,
  notas text,
  prioridade_costureira int,
  created_at timestamptz not null default now()
);

create table if not exists agenda_slots (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  hora text not null,
  cliente_id uuid references clientes(id) on delete set null,
  pedido_id uuid references pedidos(id) on delete set null,
  ocupado boolean not null default false,
  unique (data, hora)
);

create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'info',
  data timestamptz not null default now(),
  lida boolean not null default false
);

create table if not exists empresa_config (
  id text primary key default 'default',
  nome_empresa text not null,
  endereco_empresa text not null
);

insert into empresa_config (id, nome_empresa, endereco_empresa)
values (
  'default',
  'Dália Ateliê de Noivas',
  'Rua Alberto Giovanini, nº 222, Betânia, Ipatinga - MG'
)
on conflict (id) do nothing;

insert into usuarios (id, nome, email, senha, papel) values
  ('00000000-0000-0000-0000-000000000001', 'Administrador', 'admin@dalia.com.br', 'admin123', 'administrador'),
  ('00000000-0000-0000-0000-000000000002', 'Gerente', 'gerente@dalia.com.br', 'gerente123', 'gerente'),
  ('00000000-0000-0000-0000-000000000003', 'Atendente', 'atendente@dalia.com.br', 'atendente123', 'atendente')
on conflict (email) do nothing;

alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table produtos enable row level security;
alter table pedidos enable row level security;
alter table agenda_slots enable row level security;
alter table notificacoes enable row level security;
alter table empresa_config enable row level security;

create policy "usuarios_all" on usuarios for all using (true) with check (true);
create policy "clientes_all" on clientes for all using (true) with check (true);
create policy "produtos_read" on produtos for select using (true);
create policy "produtos_write" on produtos for all using (true) with check (true);
create policy "pedidos_all" on pedidos for all using (true) with check (true);
create policy "agenda_read" on agenda_slots for select using (true);
create policy "agenda_write" on agenda_slots for all using (true) with check (true);
create policy "notificacoes_all" on notificacoes for all using (true) with check (true);
create policy "empresa_read" on empresa_config for select using (true);
create policy "empresa_write" on empresa_config for all using (true) with check (true);
