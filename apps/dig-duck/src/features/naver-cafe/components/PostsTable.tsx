import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  ExternalLink, 
  Calendar,
  User,
  Image,
  Video,
  Pin
} from "lucide-react";
import { Post } from "../types";

interface PostsTableProps {
  posts: Post[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

export function PostsTable({ 
  posts, 
  loading = false, 
  onRefresh, 
  onExport 
}: PostsTableProps) {
  
  const columns: ColumnDef<Post>[] = useMemo(() => [
    {
      accessorKey: "title",
      header: "제목",
      size: 300,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {post.isNotice && (
                <Badge variant="destructive" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  공지
                </Badge>
              )}
              <span className="font-medium text-gray-900 line-clamp-2">
                {post.title}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {post.hasImages && (
                <div className="flex items-center space-x-1">
                  <Image className="w-3 h-3" />
                  <span>이미지</span>
                </div>
              )}
              {post.hasVideos && (
                <div className="flex items-center space-x-1">
                  <Video className="w-3 h-3" />
                  <span>동영상</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "author",
      header: "작성자",
      size: 120,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{post.author}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "카테고리",
      size: 100,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "작성일",
      size: 120,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{date.toLocaleDateString('ko-KR')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "viewCount",
      header: "조회수",
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 text-sm">
          <Eye className="w-4 h-4 text-gray-400" />
          <span>{row.original.viewCount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "commentCount",
      header: "댓글",
      size: 70,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 text-sm">
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span>{row.original.commentCount}</span>
        </div>
      ),
    },
    {
      accessorKey: "likeCount",
      header: "좋아요",
      size: 70,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 text-sm">
          <ThumbsUp className="w-4 h-4 text-gray-400" />
          <span>{row.original.likeCount}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "액션",
      size: 80,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(row.original.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      ),
    },
  ], []);

  const toolbarActions = (
    <div className="flex items-center space-x-2">
      {posts.length > 0 && (
        <Badge variant="outline" className="text-sm">
          총 {posts.length.toLocaleString()}개 게시글
        </Badge>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <DataTable
        data={posts}
        columns={columns}
        loading={loading}
        enableSorting={true}
        enableFiltering={true}
        enablePagination={true}
        searchPlaceholder="제목, 작성자, 카테고리 검색..."
        pageSizeOptions={[10, 20, 50, 100]}
        initialPageSize={20}
        className="w-full flex-1"
        maxHeight="100%"
        onRefresh={onRefresh}
        onExport={onExport}
        toolbarActions={toolbarActions}
        getRowId={(row) => row.id}
      />
    </div>
  );
}