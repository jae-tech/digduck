import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { crawlService, comparisonService } from "@/services";
import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import { CrawlService } from "@/services/crawl.service";
import type { ShoppingInsightsParams } from "@/types/api/naver-shopping.types";
import { FastifyRequest, FastifyReply } from "fastify";

@Controller("/naver")
export class NaverController {
  private naverAPI: NaverShoppingAPI;

  constructor() {
    this.naverAPI = new NaverShoppingAPI();
  }

  @Post("/crawl/reviews")
  @Schema({
    description: "Crawl product reviews from Smart Store",
    tags: ["products"],
    security: [{ bearerAuth: [] }],
    required: ["url"],
    body: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        sort: {
          type: "string",
          enum: ["ranking", "latest", "high-rating", "low-rating"],
          default: "latest",
        },
        maxPages: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 5,
        },
      },
    },
  })
  async crawlReviews(
    request: FastifyRequest<{
      Body: {
        url: string;
        sort?: "ranking" | "latest" | "high-rating" | "low-rating";
        maxPages?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    const { url, sort = "latest", maxPages = 5 } = request.body;

    // SSE 헤더 설정
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // 초기 연결 메시지 즉시 전송
    const initialData = JSON.stringify({
      totalReviews: 0,
      crawledReviews: 0,
      currentPage: 0,
      estimatedTotalPages: maxPages,
      elapsedTime: 0,
      status: "initializing",
      message: "크롤링을 시작합니다...",
    });
    reply.raw.write(`data: ${initialData}\n\n`);

    // 진행 상황 콜백 함수
    const onProgress = (progress: {
      currentPage: number;
      totalPages: number;
      itemsFound: number;
      itemsCrawled: number;
      message?: string;
    }) => {
      console.log("📊 SSE 진행 상황 전송:", progress);
      // Map the service progress format to the expected SSE format
      const sseData = {
        totalReviews: progress.itemsFound,
        crawledReviews: progress.itemsCrawled,
        currentPage: progress.currentPage,
        estimatedTotalPages: progress.totalPages,
        elapsedTime: Date.now(),
        status: "crawling",
        message: progress.message || "크롤링 중...",
      };
      const data = JSON.stringify(sseData);
      reply.raw.write(`data: ${data}\n\n`);
    };

    try {
      const result = await crawlService.crawlSmartStore(
        url,
        {
          maxPages,
          sort: sort as any,
        },
        {
          onProgress: onProgress,
          onItem: (item) => {
            // 개별 아이템을 SSE로 전송하지 않고 onProgress에서 처리
          },
          onError: (error) => {
            console.error("크롤링 에러:", error);
            onProgress({
              currentPage: 0,
              totalPages: maxPages,
              itemsFound: 0,
              itemsCrawled: 0,
              message: error.message,
            });
          },
        }
      );

      // 최종 완료 메시지
      const finalData = JSON.stringify({
        totalReviews: result.length,
        crawledReviews: result.length,
        currentPage: maxPages,
        estimatedTotalPages: maxPages,
        elapsedTime: Date.now(),
        isComplete: true,
        reviews: result.slice(0, 100), // 처음 100개만 전송
        message: `크롤링 완료! 총 ${result.length}개의 리뷰를 수집했습니다.`,
      });
      reply.raw.write(`data: ${finalData}\\n\\n`);
    } catch (error) {
      const errorData = JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        isComplete: true,
      });
      reply.raw.write(`data: ${errorData}\n\n`);
    } finally {
      reply.raw.end();
    }
  }

  @Post("/blog/categories")
  @Schema({
    description: "Get Naver blog categories",
    tags: ["blog"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        blogId: { type: "string", minLength: 2, maxLength: 50 },
      },
      required: ["blogId"],
    },
  })
  async getBlogCategories(
    request: FastifyRequest<{
      Body: { blogId: string };
    }>
  ) {
    const { blogId } = request.body;

    try {
      const crawlService = new CrawlService();
      const categories = await crawlService.getNaverBlogCategories(blogId);

      return {
        blogId,
        categories,
        totalCategories: categories.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "블로그 카테고리 조회 중 오류가 발생했습니다."
      );
    }
  }

  @Post("/crawl/blog")
  @Schema({
    description: "Crawl Naver blog posts",
    tags: ["blog"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        mode: {
          type: "string",
          enum: ["single", "category", "blog"],
          default: "single",
        },
        maxPages: {
          type: "number",
          minimum: 1,
          maximum: 50,
          default: 5,
        },
        maxItems: {
          type: "number",
          minimum: 1,
          maximum: 1000,
          default: 100,
        },
        blogId: { type: "string" },
        selectedCategories: {
          type: "array",
          items: { type: "number" },
        },
      },
      required: ["url"],
    },
  })
  async crawlBlog(
    request: FastifyRequest<{
      Body: {
        url: string;
        mode?: "single" | "category" | "blog";
        maxPages?: number;
        maxItems?: number;
        blogId?: string;
        selectedCategories?: number[];
      };
    }>,
    reply: FastifyReply
  ) {
    const {
      url,
      mode = "single",
      maxPages = 5,
      maxItems = 100,
      blogId,
      selectedCategories,
    } = request.body;

    // SSE 헤더 설정
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // 초기 연결 메시지
    const initialData = JSON.stringify({
      type: "progress",
      progress: {
        currentPage: 0,
        totalPages: mode === "single" ? 1 : maxPages,
        itemsFound: 0,
        itemsCrawled: 0,
        message: "네이버 블로그 크롤링을 시작합니다...",
      },
    });
    reply.raw.write(`data: ${initialData}\n\n`);

    try {
      const crawlService = new CrawlService();

      // 카테고리 선택 모드일 경우 여러 카테고리 처리
      if (
        mode === "category" &&
        selectedCategories &&
        selectedCategories.length > 1
      ) {
        const allResults: any[] = [];

        for (let i = 0; i < selectedCategories.length; i++) {
          const categoryNo = selectedCategories[i];
          const categoryUrl = `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;

          try {
            const results = await crawlService.crawlNaverBlog(
              categoryUrl,
              {
                maxPages: Math.ceil(maxPages / selectedCategories.length),
                maxItems: Math.ceil(maxItems / selectedCategories.length),
              },
              {
                onProgress: (progress) => {
                  const data = JSON.stringify({
                    type: "progress",
                    progress: {
                      ...progress,
                      message: `카테고리 ${i + 1}/${selectedCategories.length} 크롤링 중... (${progress.message})`,
                    },
                  });
                  reply.raw.write(`data: ${data}\n\n`);
                },
                onItem: (item) => {
                  const data = JSON.stringify({
                    type: "item",
                    item: {
                      title: item.title,
                      content: item.content,
                      url: item.url,
                      author: item.siteSpecificData?.author,
                      publishDate: item.siteSpecificData?.publishDate,
                      viewCount: item.siteSpecificData?.viewCount,
                      commentCount: item.siteSpecificData?.commentCount,
                      tags: item.siteSpecificData?.tags,
                      category: item.siteSpecificData?.category,
                      thumbnailUrl: item.siteSpecificData?.thumbnailUrl,
                    },
                  });
                  reply.raw.write(`data: ${data}\n\n`);
                },
              }
            );

            allResults.push(...results);
          } catch (error) {
            console.warn(`카테고리 ${categoryNo} 크롤링 실패:`, error);
          }
        }

        // 최종 완료 메시지 (다중 카테고리)
        const finalData = JSON.stringify({
          type: "complete",
          results: allResults.map((item) => ({
            title: item.title,
            content: item.content,
            url: item.url,
            author: item.siteSpecificData?.author,
            publishDate: item.siteSpecificData?.publishDate,
            viewCount: item.siteSpecificData?.viewCount,
            commentCount: item.siteSpecificData?.commentCount,
            tags: item.siteSpecificData?.tags,
            category: item.siteSpecificData?.category,
            thumbnailUrl: item.siteSpecificData?.thumbnailUrl,
          })),
          totalItems: allResults.length,
        });
        reply.raw.write(`data: ${finalData}\n\n`);
      } else {
        // 단일 URL 크롤링
        const results = await crawlService.crawlNaverBlog(
          url,
          { maxPages, maxItems },
          {
            onProgress: (progress) => {
              const data = JSON.stringify({
                type: "progress",
                progress,
              });
              reply.raw.write(`data: ${data}\n\n`);
            },
            onItem: (item) => {
              const data = JSON.stringify({
                type: "item",
                item: {
                  title: item.title,
                  content: item.content,
                  url: item.url,
                  author: item.siteSpecificData?.author,
                  publishDate: item.siteSpecificData?.publishDate,
                  viewCount: item.siteSpecificData?.viewCount,
                  commentCount: item.siteSpecificData?.commentCount,
                  tags: item.siteSpecificData?.tags,
                  category: item.siteSpecificData?.category,
                  thumbnailUrl: item.siteSpecificData?.thumbnailUrl,
                },
              });
              reply.raw.write(`data: ${data}\n\n`);
            },
            onError: (error) => {
              const data = JSON.stringify({
                type: "error",
                message: error.message,
              });
              reply.raw.write(`data: ${data}\n\n`);
            },
          }
        );

        // 최종 완료 메시지
        const finalData = JSON.stringify({
          type: "complete",
          results: results.map((item) => ({
            title: item.title,
            content: item.content,
            url: item.url,
            author: item.siteSpecificData?.author,
            publishDate: item.siteSpecificData?.publishDate,
            viewCount: item.siteSpecificData?.viewCount,
            commentCount: item.siteSpecificData?.commentCount,
            tags: item.siteSpecificData?.tags,
            category: item.siteSpecificData?.category,
            thumbnailUrl: item.siteSpecificData?.thumbnailUrl,
          })),
          totalItems: results.length,
        });
        reply.raw.write(`data: ${finalData}\n\n`);
      }
    } catch (error) {
      const errorData = JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      reply.raw.write(`data: ${errorData}\n\n`);
    } finally {
      reply.raw.end();
    }
  }

  @Post("/insights/shopping")
  @Schema({
    description: "Get Naver shopping insights data",
    tags: ["insights"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        startDate: { type: "string", format: "date" },
        endDate: { type: "string", format: "date" },
        timeUnit: { type: "string", enum: ["date", "week", "month"] },
        category: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              param: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["name", "param"],
          },
        },
        device: { type: "string", enum: ["pc", "mo"] },
        gender: { type: "string", enum: ["m", "f"] },
        ages: {
          type: "array",
          items: { type: "string", enum: ["10", "20", "30", "40", "50", "60"] },
        },
      },
      required: ["startDate", "endDate", "timeUnit"],
    },
  })
  async getShoppingInsights(
    request: FastifyRequest<{ Body: ShoppingInsightsParams }>,
    reply: FastifyReply
  ) {
    try {
      const { startDate, endDate, timeUnit, category, device, gender, ages } =
        request.body;

      // 날짜 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return reply.status(400).send({
          error: "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 필요)",
        });
      }

      // 시작 날짜가 종료 날짜보다 빠른지 검증
      if (new Date(startDate) > new Date(endDate)) {
        return reply.status(400).send({
          error: "시작 날짜는 종료 날짜보다 빨라야 합니다.",
        });
      }

      const result = await this.naverAPI.getShoppingCategories({
        startDate,
        endDate,
        timeUnit,
        category,
        device,
        gender,
        ages,
      });

      return reply.send(result);
    } catch (error) {
      request.log.error("Shopping insights error:", error);

      // 네이버 API 오류 처리
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          return reply.status(401).send({
            error: "네이버 API 인증에 실패했습니다. API 키를 확인해주세요.",
          });
        }
        if (error.message.includes("429")) {
          return reply.status(429).send({
            error: "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          });
        }
        if (error.message.includes("400")) {
          return reply.status(400).send({
            error: "잘못된 요청입니다. 파라미터를 확인해주세요.",
          });
        }
      }

      return reply.status(500).send({
        error: "쇼핑 인사이트 조회 중 오류가 발생했습니다.",
      });
    }
  }
}
