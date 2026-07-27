export type Gif = {
  url: string;
  width: number;
  height: number;
  title: string;
};

export type Comment = {
  id: string;
  author: string;
  handle: string;
  avatarColor: string;
  text: string;
  createdAt: number;
};

export type Post = {
  id: string;
  userId: string | null;
  author: string;
  handle: string;
  avatarColor: string;
  text: string;
  gif: Gif | null;
  createdAt: number;
  likes: number;
  liked: boolean;
  mascotComment?: string;
  isMascot?: boolean;
  comments?: Comment[];
};
