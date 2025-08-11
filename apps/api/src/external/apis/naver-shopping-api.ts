import { httpClient } from "@/external/clients/http-client";

export class NaverShoppingAPI {
  async searchProducts(query: string) {
    const { data } = await httpClient.get(
      "https://openapi.naver.com/v1/search/shop",
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
        },
        params: {
          query,
          display: 100,
          start: 1,
          sort: "sim",
        },
      }
    );

    return data;
  }
}
