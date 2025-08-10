import { crawlSmartstore } from "@/cralwer/smart-store.crawler";

export async function crawlProduct(url: string) {
  // 여기에 DB 저장 로직이나 데이터 변환 로직을 추가 가능
  const data = await crawlSmartstore(url);
  return { ...data, crawledAt: new Date() };
}
