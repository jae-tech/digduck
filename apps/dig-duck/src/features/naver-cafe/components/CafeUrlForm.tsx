import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, Loader2, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  postCount: number;
}

interface CafeUrlFormProps {
  onSubmit: (cafeUrl: string) => void;
  loading?: boolean;
  categories?: Category[];
  error?: string;
}

export function CafeUrlForm({ 
  onSubmit, 
  loading = false, 
  categories = [], 
  error 
}: CafeUrlFormProps) {
  const [cafeUrl, setCafeUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cafeUrl) {
      onSubmit(cafeUrl);
    }
  };

  const isValidNaverCafeUrl = (url: string) => {
    const pattern = /^https?:\/\/cafe\.naver\.com\/[a-zA-Z0-9_-]+/;
    return pattern.test(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cafeUrl" className="text-sm font-medium text-gray-700">
              카페 URL
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="cafeUrl"
                type="url"
                value={cafeUrl}
                onChange={(e) => setCafeUrl(e.target.value)}
                placeholder="https://cafe.naver.com/cafeurl"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
            
            {cafeUrl && !isValidNaverCafeUrl(cafeUrl) && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                올바른 네이버 카페 URL을 입력해주세요
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !cafeUrl || !isValidNaverCafeUrl(cafeUrl)}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "카테고리 불러오는 중..." : "카테고리 불러오기"}
          </Button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                카페 카테고리 ({categories.length}개)
              </h3>
              <p className="text-gray-600 text-sm">
                분석할 카테고리를 선택해주세요
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {category.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {category.postCount.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}