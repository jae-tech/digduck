import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { crawlService, comparisonService } from "@/services";
import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import type { ShoppingInsightsParams } from "@/types/api/naver-shopping.types";
import { FastifyRequest, FastifyReply } from "fastify";

@Controller("/naver")
export class NaverController {
  private naverAPI: NaverShoppingAPI;

  constructor() {
    this.naverAPI = new NaverShoppingAPI();
  }
  @Get("/crawl/product/:keyword")
  @Schema({
    description: "Crawl product data from Naver",
    tags: ["products"],
    security: [{ bearerAuth: [] }],
    required: ["keyword"],
    params: {
      type: "object",
      properties: {
        keyword: { type: "string", minLength: 2, maxLength: 50 },
      },
    },
  })
  async crawlProduct(request: FastifyRequest<{ Params: { keyword: string } }>) {
    const data = await crawlService.crawlProduct(request.params.keyword);
    return data;
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
          default: "latest"
        },
        maxPages: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 5
        }
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
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // 초기 연결 메시지 즉시 전송
    const initialData = JSON.stringify({
      totalReviews: 0,
      crawledReviews: 0,
      currentPage: 0,
      estimatedTotalPages: maxPages,
      elapsedTime: 0,
      status: "initializing",
      message: "크롤링을 시작합니다..."
    });
    reply.raw.write(`data: ${initialData}\n\n`);

    // 진행 상황 콜백 함수
    const onProgress = (progress: {
      totalReviews: number;
      crawledReviews: number;
      currentPage: number;
      estimatedTotalPages: number;
      elapsedTime: number;
      isComplete?: boolean;
      reviews?: any[];
      status?: string;
      message?: string;
    }) => {
      console.log('📊 SSE 진행 상황 전송:', progress);
      const data = JSON.stringify(progress);
      reply.raw.write(`data: ${data}\n\n`);
    };

    try {
      const result = await crawlService.crawlReviewsWithProgress(url, sort, maxPages, onProgress);
      
      // 최종 완료 메시지
      const finalData = JSON.stringify({
        ...result,
        isComplete: true
      });
      reply.raw.write(`data: ${finalData}\n\n`);
      
    } catch (error) {
      const errorData = JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        isComplete: true
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
        category: { type: "string" },
        device: { type: "string", enum: ["pc", "mo"] },
        gender: { type: "string", enum: ["m", "f"] },
        ages: { 
          type: "array", 
          items: { type: "string", enum: ["10", "20", "30", "40", "50", "60"] }
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
      const { startDate, endDate, timeUnit, category, device, gender, ages } = request.body;

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

      // 네이버 API 키가 설정되지 않은 경우 목업 데이터 사용
      const result = this.naverAPI.isConfigured() 
        ? await this.naverAPI.getShoppingCategories({
            startDate,
            endDate,
            timeUnit,
            category,
            device,
            gender,
            ages,
          })
        : await this.naverAPI.getMockInsights({
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

  @Get("/comparison/:keyword")
  @Schema({
    description: "Get competitive pricing for a product",
    tags: ["products"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        keyword: { type: "string", minLength: 2, maxLength: 50 },
      },
      required: ["keyword"],
    },
  })
  async getCompetitivePricing(
    request: FastifyRequest<{ Params: { keyword: string } }>
  ) {
    const { keyword } = request.params;
    const data = await comparisonService.findOptimalPrice(keyword);
    return data;
  }
}
