-- ============================================================
-- MIGRACIÓN 002: POLÍTICAS DE SEGURIDAD (Row Level Security)
-- IMPORTANTE: Corre este SQL DESPUÉS del 001_create_tables.sql
-- Esto garantiza que NADIE puede ver datos de otros usuarios
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: user_profiles =====
-- Un usuario solo puede ver y editar SU propio perfil
CREATE POLICY "users_view_own_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Amigos pueden ver perfil básico (para el chat)
CREATE POLICY "friends_view_profile"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT requester_id FROM friendships WHERE receiver_id = id AND status = 'accepted'
      UNION
      SELECT receiver_id FROM friendships WHERE requester_id = id AND status = 'accepted'
    )
  );

-- ===== POLÍTICAS: habits =====
-- Solo el dueño puede ver y modificar sus hábitos
CREATE POLICY "owner_all_habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: habit_completions =====
CREATE POLICY "owner_all_completions"
  ON habit_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: conversations =====
CREATE POLICY "participants_view_conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "users_create_conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ===== POLÍTICAS: messages =====
CREATE POLICY "participants_view_messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "sender_insert_messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "receiver_update_messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- ===== POLÍTICAS: user_blocks =====
CREATE POLICY "users_manage_blocks"
  ON user_blocks FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- ===== POLÍTICAS: friendships =====
CREATE POLICY "users_view_friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "users_create_friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "receiver_respond_friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ===== POLÍTICAS: stories =====
-- Todos pueden ver historias de amigos (no bloqueados)
CREATE POLICY "friends_view_stories"
  ON stories FOR SELECT
  USING (
    is_visible = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
         OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

CREATE POLICY "owner_manage_stories"
  ON stories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: story_likes =====
CREATE POLICY "users_manage_likes"
  ON story_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: story_comments =====
CREATE POLICY "users_view_comments"
  ON story_comments FOR SELECT
  USING (TRUE);

CREATE POLICY "users_insert_comments"
  ON story_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: devotional_notes =====
CREATE POLICY "owner_all_notes"
  ON devotional_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== POLÍTICAS: premium_subscriptions =====
CREATE POLICY "owner_view_subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

RAISE NOTICE '🔒 Políticas de seguridad aplicadas correctamente';
