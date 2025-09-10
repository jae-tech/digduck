import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import UserLayout from "@/components/layouts/UserLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useLicenseStore } from "@/features/license/store/license.store";
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Download,
  RefreshCw,
  Clock,
  PlayCircle
} from "lucide-react";

import { CafeSetupForm } from "./CafeSetupForm";
import { PostsTable } from "./PostsTable";

import { 
  Post, 
  Category, 
  NaverCredentials, 
  CrawlingProgress 
} from "../types";

type Step = 'setup' | 'crawling' | 'results';

interface CafeSetupData {
  username: string;
  password: string;
  cafeUrl: string;
  selectedCategories: Category[];
  extractionType: 'category' | 'keyword';
}

interface NaverCafeCrawlerProps {
  // 실제 구현 시 props로 받을 수 있는 콜백들
  onFetchCategories?: (credentials: NaverCredentials, cafeUrl: string) => Promise<Category[]>;
  onStartCrawling?: (setupData: CafeSetupData) => Promise<void>;
  onExportData?: (posts: Post[]) => void;
}

export function NaverCafeCrawler({
  onFetchCategories,
  onStartCrawling,
  onExportData
}: NaverCafeCrawlerProps) {
  const { isAdminUser } = useLicenseStore();
  const isAdmin = isAdminUser();
  
  // 상태 관리
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawlingProgress, setCrawlingProgress] = useState<CrawlingProgress>({
    currentCategory: '',
    processedPosts: 0,
    totalPosts: 0,
    status: 'idle'
  });

  // 카테고리 조회 처리
  const handleFetchCategories = useCallback(async (credentials: NaverCredentials, cafeUrl: string) => {
    setCategoriesLoading(true);
    setError(null);
    
    try {
      if (onFetchCategories) {
        const fetchedCategories = await onFetchCategories(credentials, cafeUrl);
        setCategories(fetchedCategories);
      } else {
        // 데모용 카테고리 데이터
        const demoCategories: Category[] = [
          { id: '1', name: '자유게시판', postCount: 1234 },
          { id: '2', name: '질문답변', postCount: 567 },
          { id: '3', name: '정보공유', postCount: 890 },
          { id: '4', name: '후기', postCount: 345 },
          { id: '5', name: '소식', postCount: 123 },
          { id: '6', name: '공지사항', postCount: 89 },
          { id: '7', name: '이벤트', postCount: 234 },
          { id: '8', name: '모임', postCount: 456 },
        ];
        setTimeout(() => {
          setCategories(demoCategories);
          setCategoriesLoading(false);
        }, 1500);
        return;
      }
    } catch (err) {
      setError('카테고리 조회 중 오류가 발생했습니다.');
    } finally {
      setCategoriesLoading(false);
    }
  }, [onFetchCategories]);

  // 크롤링 시작
  const handleStartCrawling = useCallback(async (setupData: CafeSetupData) => {
    setLoading(true);
    setError(null);
    setCurrentStep('crawling');
    
    const totalPosts = setupData.selectedCategories.reduce((sum, cat) => sum + cat.postCount, 0);
    setCrawlingProgress({
      currentCategory: setupData.selectedCategories[0]?.name || '',
      processedPosts: 0,
      totalPosts,
      status: 'running'
    });

    try {
      if (onStartCrawling) {
        await onStartCrawling(setupData);
      } else {
        // 데모용 크롤링 시뮬레이션
        const demoPosts: Post[] = [
          {
            id: '1',
            title: '카페 이용 가이드 - 필독!',
            author: '관리자',
            authorId: 'admin',
            content: '카페 이용에 대한 기본 가이드입니다.',
            category: '공지사항',
            categoryId: '1',
            createdAt: '2024-01-15T10:00:00Z',
            viewCount: 1250,
            commentCount: 45,
            likeCount: 89,
            url: 'https://cafe.naver.com/example/1',
            isNotice: true,
            hasImages: false,
            hasVideos: false,
            tags: ['가이드', '필독']
          },
          {
            id: '2',
            title: '새로운 기능 업데이트 소식',
            author: '사용자123',
            authorId: 'user123',
            content: '새로 추가된 기능들에 대해 소개합니다.',
            category: '정보공유',
            categoryId: '2',
            createdAt: '2024-01-14T15:30:00Z',
            viewCount: 789,
            commentCount: 23,
            likeCount: 67,
            url: 'https://cafe.naver.com/example/2',
            isNotice: false,
            hasImages: true,
            hasVideos: false,
            tags: ['업데이트', '기능']
          },
          {
            id: '3',
            title: '질문있습니다! 도움 부탁드려요',
            author: '초보자',
            authorId: 'newbie',
            content: '이용 중 궁금한 점이 있어 질문드립니다.',
            category: '질문답변',
            categoryId: '3',
            createdAt: '2024-01-13T09:15:00Z',
            viewCount: 345,
            commentCount: 12,
            likeCount: 8,
            url: 'https://cafe.naver.com/example/3',
            isNotice: false,
            hasImages: false,
            hasVideos: false,
            tags: ['질문', '도움요청']
          }
        ];

        // 진행률 시뮬레이션
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setCrawlingProgress(prev => ({
            ...prev,
            processedPosts: Math.floor((totalPosts * i) / 100),
            currentCategory: setupData.selectedCategories[Math.floor(i / 40)]?.name || prev.currentCategory
          }));
        }

        setPosts(demoPosts);
        setCrawlingProgress(prev => ({ ...prev, status: 'completed' }));
        setCurrentStep('results');
      }
    } catch (err) {
      setError('크롤링 중 오류가 발생했습니다.');
      setCrawlingProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [onStartCrawling]);

  // 데이터 내보내기
  const handleExport = useCallback(() => {
    if (onExportData) {
      onExportData(posts);
    } else {
      // 기본 CSV 내보내기
      const csvContent = [
        ['제목', '작성자', '카테고리', '작성일', '조회수', '댓글수', '좋아요수', 'URL'].join(','),
        ...posts.map(post => [
          `"${post.title}"`,
          post.author,
          post.category,
          new Date(post.createdAt).toLocaleDateString('ko-KR'),
          post.viewCount,
          post.commentCount,
          post.likeCount,
          post.url
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `naver-cafe-posts-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [posts, onExportData]);

  // 설정 폼 렌더링
  const renderSetupForm = () => (
    <CafeSetupForm
      onSubmit={handleStartCrawling}
      onFetchCategories={handleFetchCategories}
      categories={categories}
      categoriesLoading={categoriesLoading}
      loading={loading}
      error={error}
    />
  );

  // 크롤링 진행 상태 렌더링
  const renderCrawlingProgress = () => (
    <Card className="w-full p-6 h-fit">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">크롤링 진행 중</h2>
          <p className="text-gray-600 mt-2">데이터를 수집하고 있습니다...</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium">현재 카테고리:</span>
              <Badge variant="secondary">{crawlingProgress.currentCategory}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {crawlingProgress.processedPosts} / {crawlingProgress.totalPosts}
              </span>
            </div>
          </div>

          <Progress 
            value={(crawlingProgress.processedPosts / crawlingProgress.totalPosts) * 100} 
            className="h-3"
          />
        </div>
      </div>
    </Card>
  );

  // 결과 알림 렌더링
  const renderResultAlert = () => (
    <Alert className="mb-4">
      <CheckCircle className="h-4 w-4" />
      <div>
        <p className="font-medium">크롤링 완료!</p>
        <p className="text-sm">총 {posts.length}개의 게시글을 수집했습니다.</p>
      </div>
    </Alert>
  );

  // 데이터테이블 렌더링
  const renderDataTable = () => (
    <PostsTable
      posts={posts}
      loading={loading}
      onRefresh={() => window.location.reload()}
      onExport={handleExport}
    />
  );

  // 크롤러 컨텐츠 컴포넌트
  const CrawlerContent = () => (
    <div className="min-h-[calc(100vh-6rem)] p-4">
      <div className="space-y-6">
        {/* 뒤로 가기 버튼 */}
        {currentStep === 'results' && (
          <div className="flex justify-start mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('setup')}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              새로운 설정
            </Button>
          </div>
        )}

        {/* 글로벌 에러 표시 */}
        {error && currentStep !== 'setup' && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">오류 발생</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* 메인 컨텐츠 - 1:4 좌우 분할 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
          {/* 왼쪽 패널 - 설정 또는 크롤링 진행 상태 (1/5 = 20%) */}
          <div className="lg:col-span-1 space-y-4">
            {currentStep === 'setup' && renderSetupForm()}
            {currentStep === 'crawling' && renderCrawlingProgress()}
            {currentStep === 'results' && renderResultAlert()}
          </div>

          {/* 오른쪽 패널 - 데이터테이블 (4/5 = 80%) */}
          <div className="lg:col-span-4 space-y-4">
            {renderDataTable()}
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