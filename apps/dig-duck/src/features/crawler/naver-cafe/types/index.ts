export interface Post {
  id: string;
  title: string;
  author: string;
  authorId: string;
  content: string;
  category: string;
  categoryId: string;
  createdAt: string;
  updatedAt?: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  url: string;
  isNotice: boolean;
  hasImages: boolean;
  hasVideos: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  postCount: number;
}

export interface CrawlingProgress {
  currentCategory: string;
  processedPosts: number;
  totalPosts: number;
  status: "idle" | "running" | "completed" | "error";
  errorMessage?: string;
}

export interface NaverCredentials {
  username: string;
  password: string;
}
