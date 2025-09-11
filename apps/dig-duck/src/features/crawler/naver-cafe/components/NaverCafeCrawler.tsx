import AdminLayout from "@/components/layouts/AdminLayout";
import UserLayout from "@/components/layouts/UserLayout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLicenseStore } from "@/features/license/store/license.store";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useCallback, useState } from "react";

import { CafeSetupForm } from "./CafeSetupForm";
import { PostsTable } from "./PostsTable";

import type { Category, NaverCredentials, Post } from "../types";

type Step = "setup" | "results";

interface CafeSetupData {
  username: string;
  password: string;
  cafeUrl: string;
  selectedCategories: Category[];
  extractionType: "category" | "keyword";
}

interface NaverCafeCrawlerProps {
  // 실제 구현 시 props로 받을 수 있는 콜백들
  onFetchCategories?: (
    credentials: NaverCredentials,
    cafeUrl: string,
  ) => Promise<Category[]>;
  onStartCrawling?: (setupData: CafeSetupData) => Promise<void>;
  onExportData?: (posts: Post[]) => void;
}

export function NaverCafeCrawler({
  onFetchCategories,
  onStartCrawling,
  onExportData,
}: NaverCafeCrawlerProps) {
  const { isAdminUser } = useLicenseStore();
  const isAdmin = isAdminUser();

  // 상태 관리
  const [currentStep, setCurrentStep] = useState<Step>("setup");
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 조회 처리
  const handleFetchCategories = useCallback(
    async (credentials: NaverCredentials, cafeUrl: string) => {
      setCategoriesLoading(true);
      setError(null);

      try {
        if (onFetchCategories) {
          const fetchedCategories = await onFetchCategories(
            credentials,
            cafeUrl,
          );
          setCategories(fetchedCategories);
        } else {
          // 데모용 카테고리 데이터
          const demoCategories: Category[] = [
            { id: "1", name: "자유게시판", postCount: 1234 },
            { id: "2", name: "질문답변", postCount: 567 },
            { id: "3", name: "정보공유", postCount: 890 },
            { id: "4", name: "후기", postCount: 345 },
            { id: "5", name: "소식", postCount: 123 },
            { id: "6", name: "공지사항", postCount: 89 },
            { id: "7", name: "이벤트", postCount: 234 },
            { id: "8", name: "모임", postCount: 456 },
          ];
          setTimeout(() => {
            setCategories(demoCategories);
            setCategoriesLoading(false);
          }, 1500);
          return;
        }
      } catch (err) {
        setError("카테고리 조회 중 오류가 발생했습니다.");
      } finally {
        setCategoriesLoading(false);
      }
    },
    [onFetchCategories],
  );

  // 크롤링 시작
  const handleStartCrawling = useCallback(
    async (setupData: CafeSetupData) => {
      setLoading(true);
      setError(null);

      try {
        if (onStartCrawling) {
          await onStartCrawling(setupData);
        } else {
          // 데모용 데이터
          const demoPosts: Post[] = [
            {
              id: "1",
              title: "카페 이용 가이드 - 필독!",
              author: "관리자",
              authorId: "admin",
              content: "카페 이용에 대한 기본 가이드입니다.",
              category: "공지사항",
              categoryId: "1",
              createdAt: "2024-01-15T10:00:00Z",
              viewCount: 1250,
              commentCount: 45,
              likeCount: 89,
              url: "https://cafe.naver.com/example/1",
              isNotice: true,
              hasImages: false,
              hasVideos: false,
              tags: ["가이드", "필독"],
            },
            {
              id: "2",
              title: "새로운 기능 업데이트 소식",
              author: "사용자123",
              authorId: "user123",
              content: "새로 추가된 기능들에 대해 소개합니다.",
              category: "정보공유",
              categoryId: "2",
              createdAt: "2024-01-14T15:30:00Z",
              viewCount: 789,
              commentCount: 23,
              likeCount: 67,
              url: "https://cafe.naver.com/example/2",
              isNotice: false,
              hasImages: true,
              hasVideos: false,
              tags: ["업데이트", "기능"],
            },
            {
              id: "3",
              title: "질문있습니다! 도움 부탁드려요",
              author: "초보자",
              authorId: "newbie",
              content: "이용 중 궁금한 점이 있어 질문드립니다.",
              category: "질문답변",
              categoryId: "3",
              createdAt: "2024-01-13T09:15:00Z",
              viewCount: 345,
              commentCount: 12,
              likeCount: 8,
              url: "https://cafe.naver.com/example/3",
              isNotice: false,
              hasImages: false,
              hasVideos: false,
              tags: ["질문", "도움요청"],
            },
          ];

          // 간단한 시뮬레이션
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setPosts(demoPosts);
          setCurrentStep("results");
        }
      } catch (err) {
        setError("크롤링 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [onStartCrawling],
  );

  // 데이터 내보내기
  const handleExport = useCallback(() => {
    if (onExportData) {
      onExportData(posts);
    } else {
      // 기본 CSV 내보내기
      const csvContent = [
        [
          "제목",
          "작성자",
          "카테고리",
          "작성일",
          "조회수",
          "댓글수",
          "좋아요수",
          "URL",
        ].join(","),
        ...posts.map((post) =>
          [
            `"${post.title}"`,
            post.author,
            post.category,
            new Date(post.createdAt).toLocaleDateString("ko-KR"),
            post.viewCount,
            post.commentCount,
            post.likeCount,
            post.url,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `naver-cafe-posts-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [posts, onExportData]);

  // 크롤러 컨텐츠 컴포넌트
  const CrawlerContent = () => (
    <div className="h-full p-4">
      <div className="space-y-6">
        {/* 뒤로 가기 버튼 */}
        {currentStep === "results" && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("setup")}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              새로운 설정
            </Button>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <Alert variant="destructive">
            <div>
              <p className="font-medium">오류 발생</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
          {/* 왼쪽 패널 - 설정 또는 완료 알림 */}
          <div className="lg:col-span-1 space-y-4">
            {currentStep === "setup" && (
              <CafeSetupForm
                onSubmit={handleStartCrawling}
                onFetchCategories={handleFetchCategories}
                categories={categories}
                categoriesLoading={categoriesLoading}
                loading={loading}
                error={error || undefined}
              />
            )}
            {currentStep === "results" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <div>
                  <p className="font-medium">크롤링 완료!</p>
                  <p className="text-sm">
                    총 {posts.length}개의 게시글을 수집했습니다.
                  </p>
                </div>
              </Alert>
            )}
          </div>

          {/* 오른쪽 패널 - 데이터테이블 */}
          <div className="lg:col-span-4">
            <PostsTable
              posts={posts}
              loading={loading}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return isAdmin ? (
    <AdminLayout>
      <CrawlerContent />
    </AdminLayout>
  ) : (
    <UserLayout>
      <CrawlerContent />
    </UserLayout>
  );
}
