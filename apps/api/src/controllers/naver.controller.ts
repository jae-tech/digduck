import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { crawlService, comparisonService } from "@/services";
import { FastifyRequest, FastifyReply } from "fastify";

@Controller("/naver")
export class NaverController {
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
