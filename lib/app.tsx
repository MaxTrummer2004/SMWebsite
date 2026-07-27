"use client";

import { supabase } from "@/lib/supabase";
import { usePosts } from "@/lib/store";
import type { Post } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Comment } from "./types";

export type Account = {
  userId: string;
  handle: string;
  displayName: string;
  avatarColor: string;
};

export type SignupInput = {
  email: string;
  password: string;
  displayName: string;
  avatarColor: string;
};

type AppContextValue = {
  hydrated: boolean;
  posts: Post[];
  toggleLike: (id: string) => void;
  removePost: (id: string) => void;
  addComment: (postId: string, input: Omit<Comment, "id" | "createdAt">) => void;
  account: Account | null;
  signedIn: boolean;
  signup: (input: SignupInput) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  authOpen: boolean;
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  openAuth: () => void;
  closeAuth: () => void;
  publish: (input: { text: string; gif: Post["gif"]; isMascot?: boolean }) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function handleFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "")
    .slice(0, 16);
  return `@${slug || "friend"}`;
}

async function ensureUniqueHandle(base: string): Promise<string> {
  let handle = base;
  for (let i = 1; i <= 99; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();
    if (!data) return handle;
    handle = `${base}${i}`;
  }
  return `${base}${Math.random().toString(36).slice(2, 6)}`;
}

export function AppProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const pendingPublish = useRef(false);

  const { posts, hydrated, addPost, toggleLike, removePost, addComment } =
    usePosts(user?.id ?? null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setAccount({
        userId,
        displayName: data.display_name,
        handle: data.handle,
        avatarColor: data.avatar_color,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setSignedIn(!!u);
      if (u) loadProfile(u.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setSignedIn(!!u);
      if (u) {
        loadProfile(u.id);
      } else {
        setAccount(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const afterAuth = useCallback(() => {
    setAuthOpen(false);
    if (pendingPublish.current) {
      pendingPublish.current = false;
      setComposerOpen(true);
    }
  }, []);

  const signup = useCallback(
    async (input: SignupInput) => {
      const displayName = input.displayName.trim();
      if (displayName.length < 2)
        return { ok: false, error: "Name needs at least 2 characters." };
      if (input.password.length < 6)
        return { ok: false, error: "Password needs at least 6 characters." };

      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
      });
      if (error) return { ok: false, error: error.message };
      if (!data.user) return { ok: false, error: "Signup failed. Try again." };

      // Email confirmation required — session is null until confirmed
      if (!data.session) {
        return { ok: false, error: "Check your email to confirm your account, then sign in." };
      }

      const baseHandle = handleFromName(displayName);
      const handle = await ensureUniqueHandle(baseHandle);

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: displayName,
        handle,
        avatar_color: input.avatarColor,
      });
      if (profileError) return { ok: false, error: profileError.message };

      afterAuth();
      return { ok: true };
    },
    [afterAuth],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      afterAuth();
      return { ok: true };
    },
    [afterAuth],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setComposerOpen(false);
  }, []);

  const openComposer = useCallback(() => {
    if (signedIn && account) {
      setComposerOpen(true);
    } else {
      pendingPublish.current = true;
      setAuthOpen(true);
    }
  }, [signedIn, account]);

  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => {
    pendingPublish.current = false;
    setAuthOpen(false);
  }, []);

  const publish = useCallback(
    (input: { text: string; gif: Post["gif"]; isMascot?: boolean }) => {
      if (!account) return;
      void addPost({
        author: account.displayName,
        handle: account.handle,
        avatarColor: account.avatarColor,
        text: input.text,
        gif: input.gif,
        userId: account.userId,
      });
      setComposerOpen(false);
    },
    [account, addPost],
  );

  const value: AppContextValue = {
    hydrated,
    posts,
    toggleLike,
    removePost,
    addComment,
    account,
    signedIn,
    signup,
    login,
    logout,
    authOpen,
    composerOpen,
    openComposer,
    closeComposer,
    openAuth,
    closeAuth,
    publish,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
