import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { crawlService, comparisonService } from "@/services";
import { FastifyRequest } from "fastify";

@Controller("/smart-store")
export class SmartStoreController {
  @Get("/crawl/product/:keyword")
  @Schema({
    description: "Crawl product data from Smart Store",
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
    params: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
      },
    },
  })
  async crawlReviews(request: FastifyRequest<{ Params: { url: string } }>) {
    // const { url } = request.params;

    const url = "https://smartstore.naver.com/marketnuttre/products/9649413233";

    const data = await crawlService.crawlReviews(url);
    return data;
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
