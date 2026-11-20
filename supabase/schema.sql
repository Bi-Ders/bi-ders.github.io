-- =====================================================================
--  Bi Ders! — Supabase veritabanı şeması
--  PostgreSQL 15+ / Supabase
--
--  Kullanım: Supabase Dashboard > SQL Editor > bu dosyanın tamamını
--  yapıştırıp çalıştırın. Betik tekrar çalıştırılabilir (idempotent)
--  olacak şekilde yazılmıştır.
--
--  İçerik:
--    1. Uzantılar
--    2. Yardımcı fonksiyonlar (rol kontrolleri, updated_at)
--    3. Tablolar ve ilişkiler
--    4. Tetikleyiciler (yeni kullanıcı profili, sayaçlar, yetki korumaları)
--    5. RPC fonksiyonları (test gönderme / puanlama)
--    6. Row Level Security (RLS) politikaları
--    7. Storage bucket'ları (DEVRE DIŞI / OPSİYONEL — Cloudflare R2 kullanılır)
--    8. Başlangıç verileri (kategoriler)
--
--  İlk admin kullanıcısını atamak için (SQL Editor'de, service role ile):
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'siz@ornek.com');
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. UZANTILAR
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;


-- ---------------------------------------------------------------------
-- 2. ENUM BENZERİ TİPLER
--    (CHECK kısıtları yerine enum kullanılır; tip güvenliği sağlar.)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_type as enum ('lesson', 'article', 'video', 'document');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_status as enum ('draft', 'pending', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.difficulty_level as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.favorite_item_type as enum ('content', 'book', 'quiz', 'forum_topic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_status as enum ('new', 'read', 'replied', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3. TABLOLAR
-- ---------------------------------------------------------------------

-- 3.1 PROFILES — auth.users ile birebir ilişkili kullanıcı profili
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text check (char_length(full_name) <= 120),
  username     text unique check (username ~ '^[a-z0-9_\.]{3,30}$'),
  avatar_url   text,
  bio          text check (char_length(bio) <= 500),
  school       text check (char_length(school) <= 160),
  grade        text check (char_length(grade) <= 40),
  role         public.user_role not null default 'student',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.profiles is 'Kullanıcı profilleri. role: student (varsayılan), teacher, admin.';

-- 3.2 CATEGORIES — dersler / konular (Matematik, Fizik, ...)
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name        text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 300),
  icon        text,
  color       text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 3.3 CONTENTS — ders notu, konu anlatımı, video, doküman
create table if not exists public.contents (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles (id) on delete cascade,
  category_id   uuid references public.categories (id) on delete set null,
  title         text not null check (char_length(title) between 3 and 200),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,220}$'),
  summary       text check (char_length(summary) <= 500),
  body          text,
  type          public.content_type   not null default 'lesson',
  status        public.content_status not null default 'draft',
  grade         text,                     -- örn: '9. Sınıf', 'TYT', 'AYT'
  cover_url     text,
  file_url      text,
  video_url     text,
  tags          text[] not null default '{}',
  view_count    int not null default 0 check (view_count >= 0),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('turkish'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('turkish'::regconfig, coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('turkish'::regconfig, coalesce(body, '')), 'C')
  ) stored
);
create index if not exists contents_category_idx on public.contents (category_id);
create index if not exists contents_author_idx   on public.contents (author_id);
create index if not exists contents_status_idx   on public.contents (status, published_at desc);
create index if not exists contents_search_idx   on public.contents using gin (search_vector);
create index if not exists contents_tags_idx     on public.contents using gin (tags);

-- 3.4 FORUM_TOPICS — forum konuları
create table if not exists public.forum_topics (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references public.profiles (id) on delete cascade,
  category_id      uuid references public.categories (id) on delete set null,
  title            text not null check (char_length(title) between 5 and 200),
  body             text not null check (char_length(body) between 10 and 20000),
  tags             text[] not null default '{}',
  is_pinned        boolean not null default false,  -- yalnızca öğretmen/admin
  is_locked        boolean not null default false,  -- yalnızca öğretmen/admin
  is_hidden        boolean not null default false,  -- moderasyon, yalnızca öğretmen/admin
  is_solved        boolean not null default false,
  reply_count      int not null default 0 check (reply_count >= 0),
  view_count       int not null default 0 check (view_count >= 0),
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists forum_topics_activity_idx on public.forum_topics (is_pinned desc, last_activity_at desc);
create index if not exists forum_topics_category_idx on public.forum_topics (category_id);
create index if not exists forum_topics_title_trgm   on public.forum_topics using gin (title extensions.gin_trgm_ops);

-- 3.5 FORUM_REPLIES — forum cevapları
create table if not exists public.forum_replies (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.forum_topics (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 2 and 10000),
  is_accepted boolean not null default false,       -- konu sahibi veya öğretmen/admin
  is_hidden   boolean not null default false,       -- moderasyon
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists forum_replies_topic_idx on public.forum_replies (topic_id, created_at);

-- 3.6 QUIZZES — testler
create table if not exists public.quizzes (
  id                 uuid primary key default gen_random_uuid(),
  author_id          uuid not null references public.profiles (id) on delete cascade,
  category_id        uuid references public.categories (id) on delete set null,
  title              text not null check (char_length(title) between 3 and 200),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{3,220}$'),
  description        text check (char_length(description) <= 1000),
  grade              text,
  difficulty         public.difficulty_level not null default 'medium',
  time_limit_minutes int check (time_limit_minutes between 1 and 300),
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists quizzes_category_idx on public.quizzes (category_id);

-- 3.7 QUIZ_QUESTIONS — soru metni ve şıklar (doğru cevap BURADA DEĞİL)
create table if not exists public.quiz_questions (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes (id) on delete cascade,
  question   text not null check (char_length(question) between 3 and 4000),
  image_url  text,
  options    jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_idx on public.quiz_questions (quiz_id, sort_order);

-- 3.8 QUIZ_ANSWER_KEYS — doğru cevaplar ayrı tabloda tutulur; öğrenciler
--     doğrudan okuyamaz. Puanlama submit_quiz() RPC fonksiyonu ile yapılır.
create table if not exists public.quiz_answer_keys (
  question_id    uuid primary key references public.quiz_questions (id) on delete cascade,
  correct_option smallint not null check (correct_option between 0 and 5),
  explanation    text check (char_length(explanation) <= 4000)
);

-- 3.9 QUIZ_RESULTS — test sonuçları (yalnızca submit_quiz() ile eklenir)
create table if not exists public.quiz_results (
  id               uuid primary key default gen_random_uuid(),
  quiz_id          uuid not null references public.quizzes (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  score            int not null check (score >= 0),
  total            int not null check (total >= 0),
  answers          jsonb not null default '{}'::jsonb,
  duration_seconds int check (duration_seconds >= 0),
  created_at       timestamptz not null default now()
);
create index if not exists quiz_results_user_idx on public.quiz_results (user_id, created_at desc);
create index if not exists quiz_results_quiz_idx on public.quiz_results (quiz_id);

-- 3.10 BOOKS — kitaplar / PDF kaynaklar
create table if not exists public.books (
  id             uuid primary key default gen_random_uuid(),
  added_by       uuid references public.profiles (id) on delete set null,
  category_id    uuid references public.categories (id) on delete set null,
  title          text not null check (char_length(title) between 2 and 200),
  author         text check (char_length(author) <= 200),
  publisher      text check (char_length(publisher) <= 200),
  isbn           text check (isbn ~ '^[0-9Xx-]{10,17}$'),
  description    text check (char_length(description) <= 3000),
  grade          text,
  cover_url      text,                -- Cloudflare R2 CDN URL (https://cdn.biders.org/...)
  file_url       text,                -- Cloudflare R2 CDN URL (https://cdn.biders.org/...)
  external_url   text,
  page_count     int check (page_count > 0),
  published_year int check (published_year between 1800 and 2100),
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists books_category_idx on public.books (category_id);
create index if not exists books_title_trgm   on public.books using gin (title extensions.gin_trgm_ops);

-- 3.11 FAVORITES — kullanıcı favorileri (çok biçimli: içerik, kitap, test, konu)
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_type  public.favorite_item_type not null,
  item_id    uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);

-- 3.12 CONTACT_MESSAGES — iletişim formu
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  name       text not null check (char_length(name) between 2 and 120),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  subject    text check (char_length(subject) <= 200),
  message    text not null check (char_length(message) between 10 and 5000),
  status     public.message_status not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- 3.13 REPORTS — uygunsuz içerik şikâyetleri (moderasyon)
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  item_type   text not null check (item_type in ('content', 'forum_topic', 'forum_reply', 'book', 'quiz')),
  item_id     uuid not null,
  reason      text not null check (char_length(reason) between 5 and 1000),
  status      public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);


-- ---------------------------------------------------------------------
-- 4. YARDIMCI FONKSİYONLAR
--    SECURITY DEFINER: RLS politikaları içinde profiles tablosunu
--    sorgularken sonsuz özyinelemeyi engeller. search_path sabitlenir.
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Öğretmen veya admin
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role in ('teacher', 'admin') from public.profiles where id = auth.uid()), false);
$$;

-- Sunucu tarafı (service_role / SQL Editor) bağlamı mı?
create or replace function public.is_service_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.role(), '') = 'service_role'
      or current_user in ('postgres', 'supabase_admin');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 5. TETİKLEYİCİLER
-- ---------------------------------------------------------------------

-- 5.1 Yeni kullanıcı kaydında otomatik profil oluşturma.
--     ROL ASLA kullanıcı meta verisinden alınmaz; her zaman 'student'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.2 Rol yükseltme koruması: yalnızca admin (veya service_role) rol değiştirebilir.
-- Bilinçli olarak SECURITY INVOKER: current_user çağıran rolü (authenticated) göstermeli.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.role <> 'student' and not public.is_admin() and not public.is_service_context() then
      new.role := 'student';
    end if;
  elsif new.role is distinct from old.role
        and not public.is_admin()
        and not public.is_service_context() then
    raise exception 'Rol değiştirme yetkiniz yok.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- 5.3 Forum moderasyon alanlarını koruma (pin/kilit/gizle yalnızca personel)
-- Bilinçli olarak SECURITY INVOKER: current_user çağıran rolü (authenticated) göstermeli.
create or replace function public.protect_forum_topic_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.is_staff() or public.is_service_context() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_pinned := false;
    new.is_locked := false;
    new.is_hidden := false;
    new.reply_count := 0;
    new.view_count := 0;
    new.last_activity_at := now();
  else
    if new.is_pinned   is distinct from old.is_pinned
       or new.is_locked is distinct from old.is_locked
       or new.is_hidden is distinct from old.is_hidden
       or new.reply_count is distinct from old.reply_count
       or new.view_count  is distinct from old.view_count
       or new.author_id   is distinct from old.author_id then
      raise exception 'Bu alanları değiştirme yetkiniz yok.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists forum_topics_protect on public.forum_topics;
create trigger forum_topics_protect
  before insert or update on public.forum_topics
  for each row execute function public.protect_forum_topic_fields();

-- 5.4 Forum cevabı alan koruması: is_accepted yalnızca konu sahibi / personel
-- Bilinçli olarak SECURITY INVOKER: current_user çağıran rolü (authenticated) göstermeli.
create or replace function public.protect_forum_reply_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  topic_owner uuid;
begin
  if public.is_staff() or public.is_service_context() then
    return new;
  end if;

  select author_id into topic_owner from public.forum_topics where id = new.topic_id;

  if tg_op = 'INSERT' then
    new.is_hidden := false;
    new.is_accepted := false;
  else
    if new.is_hidden is distinct from old.is_hidden
       or new.author_id is distinct from old.author_id
       or new.topic_id  is distinct from old.topic_id then
      raise exception 'Bu alanları değiştirme yetkiniz yok.' using errcode = '42501';
    end if;
    if new.is_accepted is distinct from old.is_accepted and topic_owner is distinct from auth.uid() then
      raise exception 'Yalnızca konu sahibi cevabı kabul edebilir.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists forum_replies_protect on public.forum_replies;
create trigger forum_replies_protect
  before insert or update on public.forum_replies
  for each row execute function public.protect_forum_reply_fields();

-- 5.5 Forum sayaçları (cevap sayısı, son etkinlik)
create or replace function public.update_topic_reply_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_topics
       set reply_count = reply_count + 1,
           last_activity_at = now()
     where id = new.topic_id;
  elsif tg_op = 'DELETE' then
    update public.forum_topics
       set reply_count = greatest(reply_count - 1, 0)
     where id = old.topic_id;
  end if;
  return null;
end;
$$;

drop trigger if exists forum_replies_stats on public.forum_replies;
create trigger forum_replies_stats
  after insert or delete on public.forum_replies
  for each row execute function public.update_topic_reply_stats();

-- 5.6 Cevap kabul edilince konuyu "çözüldü" işaretle
create or replace function public.sync_topic_solved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.forum_topics t
     set is_solved = exists (
           select 1 from public.forum_replies r
            where r.topic_id = t.id and r.is_accepted
         )
   where t.id = new.topic_id;
  return null;
end;
$$;

drop trigger if exists forum_replies_solved on public.forum_replies;
create trigger forum_replies_solved
  after update of is_accepted on public.forum_replies
  for each row execute function public.sync_topic_solved();

-- 5.7 İçerik yayınlanınca published_at doldur
create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists contents_published_at on public.contents;
create trigger contents_published_at
  before insert or update on public.contents
  for each row execute function public.set_published_at();

-- 5.8 updated_at tetikleyicileri
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'contents', 'forum_topics', 'forum_replies', 'quizzes', 'books', 'reports']
  loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 6. RPC FONKSİYONLARI
-- ---------------------------------------------------------------------

-- 6.1 Test gönderme ve sunucu tarafında puanlama.
--     p_answers: {"<question_id>": <secilen_sik_indeksi>, ...}
--     Dönüş: puan, toplam ve soru bazında doğru cevap + açıklama.
create or replace function public.submit_quiz(
  p_quiz_id uuid,
  p_answers jsonb,
  p_duration_seconds int default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_score   int  := 0;
  v_total   int  := 0;
  v_details jsonb := '[]'::jsonb;
  v_result  uuid;
  q         record;
  v_choice  int;
begin
  if v_user is null then
    raise exception 'Test göndermek için giriş yapmalısınız.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.quizzes where id = p_quiz_id and is_published) then
    raise exception 'Test bulunamadı.' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Geçersiz cevap biçimi.' using errcode = '22023';
  end if;

  for q in
    select qq.id, k.correct_option, k.explanation
      from public.quiz_questions qq
      join public.quiz_answer_keys k on k.question_id = qq.id
     where qq.quiz_id = p_quiz_id
     order by qq.sort_order, qq.created_at
  loop
    v_total := v_total + 1;
    v_choice := case
                  when jsonb_typeof(p_answers -> q.id::text) = 'number'
                  then (p_answers ->> q.id::text)::int
                  else null
                end;
    if v_choice is not null and v_choice = q.correct_option then
      v_score := v_score + 1;
    end if;
    v_details := v_details || jsonb_build_object(
      'question_id',    q.id,
      'selected',       v_choice,
      'correct_option', q.correct_option,
      'is_correct',     v_choice is not null and v_choice = q.correct_option,
      'explanation',    q.explanation
    );
  end loop;

  insert into public.quiz_results (quiz_id, user_id, score, total, answers, duration_seconds)
  values (p_quiz_id, v_user, v_score, v_total, p_answers, p_duration_seconds)
  returning id into v_result;

  return jsonb_build_object(
    'result_id', v_result,
    'score',     v_score,
    'total',     v_total,
    'details',   v_details
  );
end;
$$;

revoke all on function public.submit_quiz(uuid, jsonb, int) from public, anon;
grant execute on function public.submit_quiz(uuid, jsonb, int) to authenticated;

-- 6.2 Görüntülenme sayacı (RLS'yi aşmadan güvenli artış)
create or replace function public.increment_view(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_table = 'contents' then
    update public.contents set view_count = view_count + 1 where id = p_id and status = 'published';
  elsif p_table = 'forum_topics' then
    -- tetikleyici korumasını aşmak için doğrudan güncelleme (definer bağlamı)
    update public.forum_topics set view_count = view_count + 1 where id = p_id and not is_hidden;
  else
    raise exception 'Geçersiz tablo.' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.increment_view(text, uuid) from public;
grant execute on function public.increment_view(text, uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.contents          enable row level security;
alter table public.forum_topics      enable row level security;
alter table public.forum_replies     enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_answer_keys  enable row level security;
alter table public.quiz_results      enable row level security;
alter table public.books             enable row level security;
alter table public.favorites         enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.reports           enable row level security;

-- 7.1 PROFILES
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select to anon, authenticated
  using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'student');

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- 7.2 CATEGORIES
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select to anon, authenticated
  using (true);

drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7.3 CONTENTS
drop policy if exists "contents_select_published_or_owner" on public.contents;
create policy "contents_select_published_or_owner" on public.contents
  for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists "contents_insert_staff" on public.contents;
create policy "contents_insert_staff" on public.contents
  for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());

drop policy if exists "contents_update_owner_or_admin" on public.contents;
create policy "contents_update_owner_or_admin" on public.contents
  for update to authenticated
  using ((author_id = auth.uid() and public.is_staff()) or public.is_admin())
  with check ((author_id = auth.uid() and public.is_staff()) or public.is_admin());

drop policy if exists "contents_delete_owner_or_admin" on public.contents;
create policy "contents_delete_owner_or_admin" on public.contents
  for delete to authenticated
  using ((author_id = auth.uid() and public.is_staff()) or public.is_admin());

-- 7.4 FORUM_TOPICS
drop policy if exists "forum_topics_select_visible" on public.forum_topics;
create policy "forum_topics_select_visible" on public.forum_topics
  for select to anon, authenticated
  using (not is_hidden or author_id = auth.uid() or public.is_staff());

drop policy if exists "forum_topics_insert_auth" on public.forum_topics;
create policy "forum_topics_insert_auth" on public.forum_topics
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "forum_topics_update_owner_or_staff" on public.forum_topics;
create policy "forum_topics_update_owner_or_staff" on public.forum_topics
  for update to authenticated
  using ((author_id = auth.uid() and not is_locked) or public.is_staff())
  with check (author_id = auth.uid() or public.is_staff());

drop policy if exists "forum_topics_delete_owner_or_staff" on public.forum_topics;
create policy "forum_topics_delete_owner_or_staff" on public.forum_topics
  for delete to authenticated
  using (author_id = auth.uid() or public.is_staff());

-- 7.5 FORUM_REPLIES
drop policy if exists "forum_replies_select_visible" on public.forum_replies;
create policy "forum_replies_select_visible" on public.forum_replies
  for select to anon, authenticated
  using (
    (not is_hidden or author_id = auth.uid() or public.is_staff())
    and exists (select 1 from public.forum_topics t where t.id = topic_id)  -- konu görünürlüğünü devralır
  );

drop policy if exists "forum_replies_insert_auth" on public.forum_replies;
create policy "forum_replies_insert_auth" on public.forum_replies
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.forum_topics t
       where t.id = topic_id
         and not t.is_hidden
         and (not t.is_locked or public.is_staff())
    )
  );

drop policy if exists "forum_replies_update_owner_topicowner_staff" on public.forum_replies;
create policy "forum_replies_update_owner_topicowner_staff" on public.forum_replies
  for update to authenticated
  using (
    author_id = auth.uid()
    or public.is_staff()
    or exists (select 1 from public.forum_topics t where t.id = topic_id and t.author_id = auth.uid())
  )
  with check (
    author_id = auth.uid()
    or public.is_staff()
    or exists (select 1 from public.forum_topics t where t.id = topic_id and t.author_id = auth.uid())
  );

drop policy if exists "forum_replies_delete_owner_or_staff" on public.forum_replies;
create policy "forum_replies_delete_owner_or_staff" on public.forum_replies
  for delete to authenticated
  using (author_id = auth.uid() or public.is_staff());

-- 7.6 QUIZZES
drop policy if exists "quizzes_select_published_or_owner" on public.quizzes;
create policy "quizzes_select_published_or_owner" on public.quizzes
  for select to anon, authenticated
  using (is_published or author_id = auth.uid() or public.is_admin());

drop policy if exists "quizzes_insert_staff" on public.quizzes;
create policy "quizzes_insert_staff" on public.quizzes
  for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());

drop policy if exists "quizzes_update_owner_or_admin" on public.quizzes;
create policy "quizzes_update_owner_or_admin" on public.quizzes
  for update to authenticated
  using ((author_id = auth.uid() and public.is_staff()) or public.is_admin())
  with check ((author_id = auth.uid() and public.is_staff()) or public.is_admin());

drop policy if exists "quizzes_delete_owner_or_admin" on public.quizzes;
create policy "quizzes_delete_owner_or_admin" on public.quizzes
  for delete to authenticated
  using ((author_id = auth.uid() and public.is_staff()) or public.is_admin());

-- 7.7 QUIZ_QUESTIONS (görünürlük testten devralınır)
drop policy if exists "quiz_questions_select_if_quiz_visible" on public.quiz_questions;
create policy "quiz_questions_select_if_quiz_visible" on public.quiz_questions
  for select to anon, authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id));

drop policy if exists "quiz_questions_write_owner_or_admin" on public.quiz_questions;
create policy "quiz_questions_write_owner_or_admin" on public.quiz_questions
  for all to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.author_id = auth.uid() and public.is_staff())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.author_id = auth.uid() and public.is_staff())
  );

-- 7.8 QUIZ_ANSWER_KEYS (yalnızca test sahibi öğretmen ve admin)
drop policy if exists "quiz_answer_keys_owner_or_admin" on public.quiz_answer_keys;
create policy "quiz_answer_keys_owner_or_admin" on public.quiz_answer_keys
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.quiz_questions qq
        join public.quizzes q on q.id = qq.quiz_id
       where qq.id = question_id and q.author_id = auth.uid() and public.is_staff()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.quiz_questions qq
        join public.quizzes q on q.id = qq.quiz_id
       where qq.id = question_id and q.author_id = auth.uid() and public.is_staff()
    )
  );
revoke all on public.quiz_answer_keys from anon;

-- 7.9 QUIZ_RESULTS (ekleme yalnızca submit_quiz() üzerinden)
drop policy if exists "quiz_results_select_own_or_quiz_owner" on public.quiz_results;
create policy "quiz_results_select_own_or_quiz_owner" on public.quiz_results
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.author_id = auth.uid())
  );

drop policy if exists "quiz_results_delete_own_or_admin" on public.quiz_results;
create policy "quiz_results_delete_own_or_admin" on public.quiz_results
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- INSERT / UPDATE politikası bilinçli olarak YOK: sonuç manipülasyonu engellenir.

-- 7.10 BOOKS
drop policy if exists "books_select_published" on public.books;
create policy "books_select_published" on public.books
  for select to anon, authenticated
  using (is_published or added_by = auth.uid() or public.is_admin());

drop policy if exists "books_insert_staff" on public.books;
create policy "books_insert_staff" on public.books
  for insert to authenticated
  with check (public.is_staff() and added_by = auth.uid());

drop policy if exists "books_update_owner_or_admin" on public.books;
create policy "books_update_owner_or_admin" on public.books
  for update to authenticated
  using ((added_by = auth.uid() and public.is_staff()) or public.is_admin())
  with check ((added_by = auth.uid() and public.is_staff()) or public.is_admin());

drop policy if exists "books_delete_owner_or_admin" on public.books;
create policy "books_delete_owner_or_admin" on public.books
  for delete to authenticated
  using ((added_by = auth.uid() and public.is_staff()) or public.is_admin());

-- 7.11 FAVORITES (yalnızca sahibi)
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

-- 7.12 CONTACT_MESSAGES (herkes gönderebilir, yalnızca admin okur)
--      Not: anon kullanıcı insert sonrası .select() ile satırı geri OKUYAMAZ;
--      istemcide insert çağrısını .select() olmadan yapın.
drop policy if exists "contact_messages_insert_anyone" on public.contact_messages;
create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert to anon, authenticated
  with check (
    status = 'new'
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin" on public.contact_messages
  for select to authenticated
  using (public.is_admin());

drop policy if exists "contact_messages_update_admin" on public.contact_messages;
create policy "contact_messages_update_admin" on public.contact_messages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "contact_messages_delete_admin" on public.contact_messages;
create policy "contact_messages_delete_admin" on public.contact_messages
  for delete to authenticated
  using (public.is_admin());

-- 7.13 REPORTS
drop policy if exists "reports_insert_auth" on public.reports;
create policy "reports_insert_auth" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and resolved_by is null);

drop policy if exists "reports_select_own_or_staff" on public.reports;
create policy "reports_select_own_or_staff" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_staff());

drop policy if exists "reports_update_staff" on public.reports;
create policy "reports_update_staff" on public.reports
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "reports_delete_admin" on public.reports;
create policy "reports_delete_admin" on public.reports
  for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 8. STORAGE BUCKET'LARI (DEVRE DIŞI / OPSİYONEL)
--    Dosya yükleme ve barındırma katmanı Cloudflare R2'ye taşınmıştır
--    (bkz. workers/r2-upload/). Veritabanı tablolarında (contents, books,
--    profiles) yalnızca Cloudflare R2 CDN dosya URL'leri tutulur.
--    Yalnızca geriye dönük Supabase Storage kullanmak isterseniz aşağıdaki
--    yorum bloğunu açabilirsiniz.
-- ---------------------------------------------------------------------
/*
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',           'avatars',           true,    2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('content-files',     'content-files',     true,   52428800, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4']),
  ('book-covers',       'book-covers',       true,    5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('book-files',        'book-files',        false, 104857600, array['application/pdf', 'application/epub+zip']),
  ('forum-attachments', 'forum-attachments', true,    5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 8.1 avatars — herkes okur, kullanıcı yalnızca kendi klasörüne yazar
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 8.2 content-files — herkes okur, öğretmen/admin kendi klasörüne yazar
drop policy if exists "content_files_read_all" on storage.objects;
create policy "content_files_read_all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'content-files');

drop policy if exists "content_files_insert_staff" on storage.objects;
create policy "content_files_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'content-files' and public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "content_files_update_staff" on storage.objects;
create policy "content_files_update_staff" on storage.objects
  for update to authenticated
  using (bucket_id = 'content-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()))
  with check (bucket_id = 'content-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

drop policy if exists "content_files_delete_staff" on storage.objects;
create policy "content_files_delete_staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'content-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

-- 8.3 book-covers — herkes okur, öğretmen/admin yazar
drop policy if exists "book_covers_read_all" on storage.objects;
create policy "book_covers_read_all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'book-covers');

drop policy if exists "book_covers_insert_staff" on storage.objects;
create policy "book_covers_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'book-covers' and public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "book_covers_update_staff" on storage.objects;
create policy "book_covers_update_staff" on storage.objects
  for update to authenticated
  using (bucket_id = 'book-covers' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()))
  with check (bucket_id = 'book-covers' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

drop policy if exists "book_covers_delete_staff" on storage.objects;
create policy "book_covers_delete_staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-covers' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

-- 8.4 book-files — ÖZEL bucket: yalnızca giriş yapmış kullanıcılar okur
drop policy if exists "book_files_read_auth" on storage.objects;
create policy "book_files_read_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'book-files');

drop policy if exists "book_files_insert_staff" on storage.objects;
create policy "book_files_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'book-files' and public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "book_files_update_staff" on storage.objects;
create policy "book_files_update_staff" on storage.objects
  for update to authenticated
  using (bucket_id = 'book-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()))
  with check (bucket_id = 'book-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

drop policy if exists "book_files_delete_staff" on storage.objects;
create policy "book_files_delete_staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-files' and ((public.is_staff() and (storage.foldername(name))[1] = auth.uid()::text) or public.is_admin()));

-- 8.5 forum-attachments — herkes okur, giriş yapan kullanıcı kendi klasörüne yazar
drop policy if exists "forum_attachments_read_all" on storage.objects;
create policy "forum_attachments_read_all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'forum-attachments');

drop policy if exists "forum_attachments_insert_own" on storage.objects;
create policy "forum_attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'forum-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "forum_attachments_delete_own_or_staff" on storage.objects;
create policy "forum_attachments_delete_own_or_staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'forum-attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
*/


-- ---------------------------------------------------------------------
-- 9. BAŞLANGIÇ VERİLERİ
-- ---------------------------------------------------------------------
insert into public.categories (slug, name, description, icon, color, sort_order) values
  ('matematik',  'Matematik',   'Sayılar, cebir, geometri ve analiz',            'sigma',       '#2F55D4', 1),
  ('fizik',      'Fizik',       'Hareket, kuvvet, enerji, elektrik ve dalgalar', 'atom',        '#0E7C66', 2),
  ('kimya',      'Kimya',       'Madde, tepkimeler ve periyodik sistem',         'flask-conical','#B4441C', 3),
  ('biyoloji',   'Biyoloji',    'Hücre, kalıtım, ekoloji ve insan fizyolojisi',  'leaf',        '#3F7D20', 4),
  ('turkce',     'Türkçe',      'Dil bilgisi, paragraf ve anlam bilgisi',        'languages',   '#9A3B8C', 5),
  ('edebiyat',   'Edebiyat',    'Türk ve dünya edebiyatı, şiir ve nesir',        'feather',     '#7A4E12', 6),
  ('tarih',      'Tarih',       'Türk ve dünya tarihi',                          'landmark',    '#8B2E2E', 7),
  ('cografya',   'Coğrafya',    'Fiziki ve beşeri coğrafya',                     'globe',       '#1F6E8C', 8),
  ('ingilizce',  'İngilizce',   'Kelime, dil bilgisi ve okuma becerileri',       'book-a',      '#38464F', 9)
on conflict (slug) do nothing;

-- =====================================================================
--  Şema sonu
-- =====================================================================
