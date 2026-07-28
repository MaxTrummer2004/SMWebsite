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
  updateAvatarColor: (color: string) => Promise<void>;
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
      return;
    }

    // Profile missing — create from user metadata (set during signup)
    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const displayName: string = meta.display_name ?? "Anon";
    const avatarColor: string = meta.avatar_color ?? "#ea580c";
    const baseHandle: string = meta.base_handle ?? handleFromName(displayName);
    const handle = await ensureUniqueHandle(baseHandle);

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName,
      handle,
      avatar_color: avatarColor,
    });

    if (!error) {
      setAccount({ userId, displayName, handle, avatarColor });
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

      const baseHandle = handleFromName(displayName);

      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            display_name: displayName,
            base_handle: baseHandle,
            avatar_color: input.avatarColor,
          },
        },
      });
      if (error) return { ok: false, error: error.message };
      if (!data.user) return { ok: false, error: "Signup failed. Try again." };

      if (!data.session) {
        // Email confirmation required — profile will be created on first sign-in
        return {
          ok: false,
          error: "✉️ Check your email and click the confirmation link, then sign in here.",
        };
      }

      // No confirmation required — create profile immediately
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

  const updateAvatarColor = useCallback(async (color: string) => {
    if (!account) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_color: color })
      .eq("id", account.userId);
    if (!error) {
      setAccount((prev) => prev ? { ...prev, avatarColor: color } : prev);
    }
  }, [account]);

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
    updateAvatarColor,
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
