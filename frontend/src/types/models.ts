export interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  avatar: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelProfile extends User {
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
}

export interface VideoOwner {
  _id: string;
  username: string;
  fullname: string;
  avatar: string;
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  tags: string[];
  owner: VideoOwner | string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  video: string;
  owner: VideoOwner;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  owner: string;
  videos: Video[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type FeedMode = 'trending' | 'newest';
