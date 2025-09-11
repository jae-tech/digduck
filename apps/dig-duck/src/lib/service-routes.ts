/**
 * 서비스 코드에 따른 기본 경로 매핑
 */
export const getServiceRoute = (serviceCode: string): string => {
  const serviceRoutes: Record<string, string> = {
    NAVER_BLOG_CRAWLING: "/crawler/naver-blog",
    // 추가 구현된 서비스들은 여기에 추가
  };
  return serviceRoutes[serviceCode] || "/dashboard";
};

/**
 * 라이센스 정보를 기반으로 리다이렉트 경로 결정
 */
export const getRedirectPath = (
  isAdmin: boolean,
  serviceCode?: string,
): string => {
  if (isAdmin) {
    return "/admin/dashboard";
  }

  return serviceCode ? getServiceRoute(serviceCode) : "/dashboard";
};
