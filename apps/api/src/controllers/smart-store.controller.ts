import { Controller, Get, Schema } from "@/decorators/controller.decorator";
import { crawlProduct } from "@/services/crawl.service";

@Controller("/smart-store")
export class SmartStoreController {
  @Get("/crawl")
  @Schema({
    description: "Crawl product data from Smart Store",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
  })
  async crawlProduct(url: string) {
    const data = await crawlProduct(url);
    return data;
  }
}
