import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { createColumnHelper } from "@tanstack/react-table";

interface CrawlerResultsProps {
  finalResult?: {
    reviews: any[];
    totalCount: number;
  } | null;
  isLoading: boolean;
  crawledReviews: number;
}

export function CrawlerResults({
  finalResult,
  isLoading,
}: CrawlerResultsProps) {
  // DataTable column helper for type safety
  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("author", {
      id: "author",
      header: "작성자",
      cell: (info) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {info.getValue() || "익명"}
        </div>
      ),
    }),
    columnHelper.accessor("rating", {
      id: "rating",
      header: "평점",
      cell: (info) => {
        const rating = info.getValue();
        return (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
              {rating}/5
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("review", {
      id: "review",
      header: "리뷰 내용",
      cell: (info) => {
        const content = info.getValue();
        return (
          <div className="max-w-md">
            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {content ? (
                content.length > 100 ? (
                  <>
                    {content.substring(0, 100)}
                    <span className="text-gray-500">...</span>
                  </>
                ) : (
                  content
                )
              ) : (
                "내용 없음"
              )}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("productVariant", {
      id: "productVariant",
      header: "상품 정보",
      cell: (info) => {
        const variant = info.getValue();
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {variant || "정보 없음"}
          </div>
        );
      },
    }),
    columnHelper.accessor("image", {
      id: "image",
      header: "이미지",
      cell: (info) => {
        const imageUrl = info.getValue();
        return imageUrl ? (
          <img
            src={imageUrl}
            alt="리뷰 이미지"
            className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            이미지 없음
          </div>
        );
      },
    }),
    columnHelper.accessor("date", {
      id: "date",
      header: "작성일",
      cell: (info) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue() || "날짜 없음"}
        </div>
      ),
    }),
  ];

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
      <CardContent className="pt-6">
        {finalResult?.reviews && finalResult.reviews.length > 0 ? (
          <DataTable
            data={finalResult.reviews || []}
            columns={columns}
            searchPlaceholder="리뷰 내용, 작성자 검색..."
            initialPageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            maxHeight="500px"
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            className="bg-white dark:bg-gray-900"
          />
        ) : !isLoading ? (
          <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center space-y-3">
              <Database className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
              <div className="space-y-1">
                <p className="font-medium text-gray-600 dark:text-gray-400">
                  데이터가 없습니다
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  URL을 입력하고 크롤링을 시작해보세요
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <p className="font-medium text-blue-600">크롤링 진행 중...</p>
                <p className="text-sm text-muted-foreground">
                  데이터를 수집하고 있습니다
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
