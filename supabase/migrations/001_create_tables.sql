-- ============================================================
-- MIGRACIÓN 001: TABLAS PRINCIPALES
-- Copia y pega este código en Supabase > SQL Editor > Run
-- ============================================================

-- === TABLA: Perfiles de usuario ===
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  avatar_url TEXT,
  language TEXT DEFAULT 'es',
  is_premium BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Hábitos ===
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'otro',
  frequency TEXT CHECK (frequency IN ('daily', 'weekdays', 'custom')) DEFAULT 'daily',
  days_of_week INTEGER[],            -- [1,2,3,4,5,6,7] lunes=1
  reminder_time TEXT DEFAULT '08:00', -- HH:MM
  times_per_day INTEGER DEFAULT 1,
  notification_ids TEXT[],
  streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Completaciones de hábitos ===
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)             -- Un registro por hábito por día
);

-- === TABLA: Conversaciones de chat ===
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES user_profiles(id),
  user2_id UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- === TABLA: Mensajes ===
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  content TEXT,
  type TEXT CHECK (type IN ('text', 'image', 'audio')) DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Bloqueos entre usuarios ===
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES user_profiles(id),
  blocked_id UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- === TABLA: Amigos/Conexiones ===
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id),
  receiver_id UUID NOT NULL REFERENCES user_profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- === TABLA: Historias/Logros compartidos ===
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id),
  type TEXT CHECK (type IN ('weekly', 'monthly', 'custom')) DEFAULT 'weekly',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  percentage INTEGER,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Likes en historias ===
CREATE TABLE IF NOT EXISTS story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- === TABLA: Comentarios en historias ===
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Devocional (contenido) ===
CREATE TABLE IF NOT EXISTS devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  verse TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  reflection TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === TABLA: Notas del devocional (por usuario) ===
CREATE TABLE IF NOT EXISTS devotional_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  devotional_id UUID NOT NULL REFERENCES devotionals(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, devotional_id)
);

-- === TABLA: Suscripciones Premium ===
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('monthly', 'annual')) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, created_at);

RAISE NOTICE '✅ Tablas creadas correctamente';
