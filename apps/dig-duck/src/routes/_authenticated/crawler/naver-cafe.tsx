import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/middleware/auth.middleware";
import { NaverCafeCrawler } from "@/features/crawler/naver-cafe";

export const Route = createFileRoute("/_authenticated/crawler/naver-cafe")({
  beforeLoad: requireAuth,
  component: NaverCafeCrawler,
});
