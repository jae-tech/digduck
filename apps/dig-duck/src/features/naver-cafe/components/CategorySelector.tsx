import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, FolderOpen, MessageSquare, CheckCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  postCount: number;
}

interface CategorySelectorProps {
  categories: Category[];
  onSelectionChange: (selectedCategories: Category[]) => void;
  onStartCrawling: (selectedCategories: Category[]) => void;
  loading?: boolean;
}

export function CategorySelector({ 
  categories, 
  onSelectionChange, 
  onStartCrawling,
  loading = false 
}: CategorySelectorProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = new Set(selectedCategoryIds);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategoryIds(newSelected);
    
    const selectedCategories = categories.filter(cat => newSelected.has(cat.id));
    onSelectionChange(selectedCategories);
  };

  const handleSelectAll = () => {
    if (selectedCategoryIds.size === filteredCategories.length) {
      setSelectedCategoryIds(new Set());
      onSelectionChange([]);
    } else {
      const allIds = new Set(filteredCategories.map(cat => cat.id));
      setSelectedCategoryIds(allIds);
      onSelectionChange(filteredCategories);
    }
  };

  const selectedCategories = categories.filter(cat => selectedCategoryIds.has(cat.id));
  const totalSelectedPosts = selectedCategories.reduce((sum, cat) => sum + cat.postCount, 0);

  const handleStartCrawling = () => {
    onStartCrawling(selectedCategories);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-6">

        {/* 검색 및 전체 선택 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="카테고리 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={handleSelectAll}
            disabled={loading}
          >
            {selectedCategoryIds.size === filteredCategories.length ? "전체 해제" : "전체 선택"}
          </Button>
        </div>

        {/* 선택된 항목 요약 */}
        {selectedCategories.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">
                    {selectedCategories.length}개 카테고리 선택됨
                  </span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  총 {totalSelectedPosts.toLocaleString()}개 게시글
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              카테고리 목록 ({filteredCategories.length}개)
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                <p>검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedCategoryIds.has(category.id)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    checked={selectedCategoryIds.has(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="pointer-events-none"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </span>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">
                          {category.postCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 크롤링 시작 버튼 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStartCrawling}
            disabled={selectedCategories.length === 0 || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "크롤링 준비 중..." : `크롤링 시작 (${selectedCategories.length}개 카테고리)`}
          </Button>
        </div>
      </div>
    </Card>
  );
}