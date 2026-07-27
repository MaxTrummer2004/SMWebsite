-- SMKnowers database schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#ea580c',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#ea580c',
  text TEXT NOT NULL DEFAULT '',
  gif JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_mascot BOOLEAN DEFAULT FALSE,
  mascot_comment TEXT
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#ea580c',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- posts: anyone reads, authenticated creates own posts, owner deletes
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (user_id = auth.uid());

-- comments
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (user_id = auth.uid());

-- likes
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (user_id = auth.uid());

-- ── Seed posts (permanent, no owner = no one can delete) ─────────────────────

INSERT INTO posts (user_id, author, handle, avatar_color, text, gif, created_at, is_mascot)
VALUES
  (NULL, 'Pixel Pat', '@pat', '#ea580c',
   'welcome to #SMKnowers — the smallest social club on the net. post a thought, sling a gif, that''s it ✨',
   '{"url":"https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif","width":480,"height":270,"title":"welcome"}',
   NOW() - INTERVAL '5 hours', false),
  (NULL, 'Retro Rin', '@rin', '#7c3aed',
   'friday plan: 8-bit music, cold pizza, and way too many #gifs. who''s in?',
   NULL,
   NOW() - INTERVAL '2 hours', false),
  (NULL, 'Bit Bea', '@bea', '#0891b2',
   'found the perfect reaction gif and now everything is fine #mood',
   '{"url":"https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif","width":480,"height":270,"title":"mood"}',
   NOW() - INTERVAL '30 minutes', false)
ON CONFLICT DO NOTHING;

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Enable in Supabase dashboard: Database → Replication → enable posts, comments, likes
