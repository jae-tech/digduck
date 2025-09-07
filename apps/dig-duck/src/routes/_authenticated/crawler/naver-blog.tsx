import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/middleware/auth.middleware";
import { NaverBlogCrawlerPage } from "@/features/crawler";

export const Route = createFileRoute("/_authenticated/crawler/naver-blog")({
  beforeLoad: requireAuth,
  component: NaverBlogCrawlerPage,
});