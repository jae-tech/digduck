import { useState } from "react";
import type { ShoppingInsightsResult } from "@/features/crawler/types/crawler.types";

interface ReportData {
  data: ShoppingInsightsResult;
  searchParams: {
    startDate: string;
    endDate: string;
    timeUnit: string;
    categoryName: string;
    device?: string;
    gender?: string;
    ages?: string[];
  };
}

interface GeneratedReport {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  marketAnalysis: string;
  competitiveAnalysis: string;
  forecast: string;
  actionItems: string[];
}

export const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // 리포트 생성 메인 함수
  const generateReport = async ({
    data,
  }: ReportData): Promise<GeneratedReport> => {
    setIsGenerating(true);

    try {
      // 기본 통계 계산
      const stats = calculateBasicStats(data.data);
      const trends = analyzeTrends(data.data);
      const patterns = identifyPatterns(data.data);

      // 리포트 섹션들 생성
      const summary = generateExecutiveSummary(stats, trends);
      const keyInsights = generateKeyInsights(stats, trends, patterns);
      const recommendations = generateRecommendations(stats, trends, patterns);
      const marketAnalysis = generateMarketAnalysis(stats, trends);
      const competitiveAnalysis = generateCompetitiveAnalysis(stats);
      const forecast = generateForecast(trends, data.data);
      const actionItems = generateActionItems(trends);

      return {
        summary,
        keyInsights,
        recommendations,
        marketAnalysis,
        competitiveAnalysis,
        forecast,
        actionItems,
      };
    } catch (error) {
      console.error("리포트 생성 오류:", error);
      throw new Error("리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 기본 통계 계산
  const calculateBasicStats = (data: any[]) => {
    const values = data.map((d) => d.ratio);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const median = [...values].sort((a, b) => a - b)[
      Math.floor(values.length / 2)
    ];
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
        values.length,
    );

    const maxPeriod = data.find((d) => d.ratio === max)?.period || "";
    const minPeriod = data.find((d) => d.ratio === min)?.period || "";

    return {
      average: avg,
      maximum: max,
      minimum: min,
      median,
      standardDeviation: stdDev,
      range: max - min,
      maxPeriod,
      minPeriod,
      totalDataPoints: data.length,
      volatility: (stdDev / avg) * 100, // 변동계수
    };
  };

  // 트렌드 분석
  const analyzeTrends = (data: any[]) => {
    if (data.length < 4)
      return { direction: "insufficient_data", strength: 0, pattern: "none" };

    const values = data.map((d) => d.ratio);
    const recentQuarter = values.slice(-Math.ceil(values.length / 4));
    const previousQuarter = values.slice(
      -Math.ceil(values.length / 2),
      -Math.ceil(values.length / 4),
    );

    const recentAvg =
      recentQuarter.reduce((sum, val) => sum + val, 0) / recentQuarter.length;
    const previousAvg =
      previousQuarter.reduce((sum, val) => sum + val, 0) /
      previousQuarter.length;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    let direction = "stable";
    if (Math.abs(changePercent) > 10) {
      direction = changePercent > 0 ? "increasing" : "decreasing";
    } else if (Math.abs(changePercent) > 5) {
      direction =
        changePercent > 0 ? "slightly_increasing" : "slightly_decreasing";
    }

    // 패턴 식별
    let pattern = "irregular";
    const peaks = identifyPeaks(values);
    const valleys = identifyValleys(values);

    if (peaks.length > 2 && valleys.length > 2) {
      const avgPeakDistance = calculateAvgDistance(peaks);
      const avgValleyDistance = calculateAvgDistance(valleys);

      if (Math.abs(avgPeakDistance - avgValleyDistance) < 2) {
        pattern = "cyclical";
      }
    }

    // 계절성 체크 (주/월 단위일 때)
    if (data.length >= 12) {
      const seasonality = checkSeasonality(values);
      if (seasonality > 0.7) pattern = "seasonal";
    }

    return {
      direction,
      changePercent: Math.abs(changePercent),
      strength: Math.min(Math.abs(changePercent) / 20, 1), // 0-1 사이 값
      pattern,
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      peaks: peaks.length,
      valleys: valleys.length,
    };
  };

  // 패턴 식별
  const identifyPatterns = (data: any[]) => {
    const values = data.map((d) => d.ratio);

    return {
      hasStrongGrowth: values
        .slice(-3)
        .every((val, i, arr) => i === 0 || val > arr[i - 1]),
      hasStrongDecline: values
        .slice(-3)
        .every((val, i, arr) => i === 0 || val < arr[i - 1]),
      hasStagnation:
        Math.max(...values.slice(-5)) - Math.min(...values.slice(-5)) <
        values[0] * 0.1,
      isHighlyVolatile: calculateBasicStats(data).volatility > 30,
      peakSeason: identifyPeakSeason(data),
      lowSeason: identifyLowSeason(data),
    };
  };

  // 경영진 요약 생성
  const generateExecutiveSummary = (stats: any, trends: any) => {
    const period = `분석 기간`;
    const category = `분석 카테고리`;

    let trendDescription = "";
    switch (trends.direction) {
      case "increasing":
        trendDescription = `강한 상승 추세 (${trends.changePercent.toFixed(1)}% 증가)`;
        break;
      case "decreasing":
        trendDescription = `하락 추세 (${trends.changePercent.toFixed(1)}% 감소)`;
        break;
      case "slightly_increasing":
        trendDescription = `완만한 상승 추세 (${trends.changePercent.toFixed(1)}% 증가)`;
        break;
      case "slightly_decreasing":
        trendDescription = `완만한 하락 추세 (${trends.changePercent.toFixed(1)}% 감소)`;
        break;
      default:
        trendDescription = "안정적인 추세";
    }

    return `
${category} 카테고리의 ${period} 네이버 쇼핑 검색 트렌드 분석 결과, 평균 검색 비율 ${stats.average.toFixed(1)}을 기록했습니다. 

전체 기간 동안 ${trendDescription}를 보이며, 최고 검색 비율 ${stats.maximum}(${stats.maxPeriod})과 최저 검색 비율 ${stats.minimum}(${stats.minPeriod}) 사이의 변동을 나타냈습니다.

시장 변동성은 ${stats.volatility.toFixed(1)}%로 ${stats.volatility > 30 ? "높은" : stats.volatility > 15 ? "보통" : "낮은"} 수준을 보였으며, ${trends.pattern === "cyclical" ? "주기적 패턴이 관찰되어" : trends.pattern === "seasonal" ? "계절적 패턴이 나타나" : "불규칙적 패턴을 보여"} 향후 마케팅 전략 수립 시 고려가 필요합니다.
    `.trim();
  };

  // 핵심 인사이트 생성
  const generateKeyInsights = (stats: any, trends: any, patterns: any) => {
    const insights = [];

    // 성과 인사이트
    if (stats.maximum > stats.average * 1.5) {
      insights.push(
        `🎯 **최고 성과 기간**: ${stats.maxPeriod}에 ${stats.maximum}의 검색 비율을 기록하여 평균 대비 ${((stats.maximum / stats.average - 1) * 100).toFixed(1)}% 높은 성과를 달성했습니다.`,
      );
    }

    // 트렌드 인사이트
    if (trends.direction === "increasing" && trends.strength > 0.7) {
      insights.push(
        `📈 **강한 성장 모멘텀**: 최근 데이터에서 ${trends.changePercent.toFixed(1)}%의 뚜렷한 상승 추세가 관찰되어 시장 관심도가 높아지고 있습니다.`,
      );
    } else if (trends.direction === "decreasing" && trends.strength > 0.7) {
      insights.push(
        `📉 **주의 필요한 하락세**: ${trends.changePercent.toFixed(1)}%의 하락 추세로 시장 관심도 감소가 우려됩니다.`,
      );
    }

    // 변동성 인사이트
    if (patterns.isHighlyVolatile) {
      insights.push(
        `⚡ **높은 시장 변동성**: 변동계수 ${stats.volatility.toFixed(1)}%로 시장 예측이 어려우므로 리스크 관리가 중요합니다.`,
      );
    }

    // 패턴 인사이트
    if (trends.pattern === "cyclical") {
      insights.push(
        `🔄 **주기적 패턴 발견**: 정기적인 상승-하락 패턴이 확인되어 마케팅 타이밍 최적화가 가능합니다.`,
      );
    }

    // 계절성 인사이트
    if (patterns.peakSeason && patterns.lowSeason) {
      insights.push(
        `🗓️ **계절성 분석**: ${patterns.peakSeason}가 성수기, ${patterns.lowSeason}가 비수기로 나타나 계절별 전략 차별화가 필요합니다.`,
      );
    }

    // 타겟 인사이트는 주석 처리
    // if (searchParams.device || searchParams.gender || searchParams.ages) {
    //   let targetDesc = "";
    //   if (searchParams.device) targetDesc += `${searchParams.device === "pc" ? "PC" : "모바일"} 사용자`;
    //   if (searchParams.gender) targetDesc += `${targetDesc ? ", " : ""}${searchParams.gender === "m" ? "남성" : "여성"}`;
    //   if (searchParams.ages?.length) targetDesc += `${targetDesc ? ", " : ""}${searchParams.ages.join("·")}대`;
    //
    //   insights.push(`🎯 **타겟 그룹 특성**: ${targetDesc} 세그먼트에서 평균 ${stats.average.toFixed(1)}의 검색 비율을 보여 해당 그룹 대상 마케팅 효과가 기대됩니다.`);
    // }

    return insights.length > 0
      ? insights
      : ["분석 가능한 특별한 인사이트가 발견되지 않았습니다."];
  };

  // 추천사항 생성
  const generateRecommendations = (stats: any, trends: any, patterns: any) => {
    const recommendations = [];

    // 트렌드 기반 추천
    if (trends.direction === "increasing") {
      recommendations.push(
        "**마케팅 투자 확대**: 상승 추세를 활용해 마케팅 예산을 늘리고 적극적인 프로모션을 진행하세요.",
      );
      recommendations.push(
        "**재고 관리 강화**: 수요 증가에 대비해 충분한 재고를 확보하고 공급망을 점검하세요.",
      );
    } else if (trends.direction === "decreasing") {
      recommendations.push(
        "**마케팅 전략 재검토**: 하락 요인을 분석하고 새로운 마케팅 접근법을 모색하세요.",
      );
      recommendations.push(
        "**고객 니즈 재분석**: 시장 변화에 맞춰 제품이나 서비스 개선점을 찾아보세요.",
      );
    }

    // 변동성 기반 추천
    if (patterns.isHighlyVolatile) {
      recommendations.push(
        "**유연한 운영 전략**: 높은 변동성에 대비해 탄력적인 운영 계획을 수립하세요.",
      );
      recommendations.push(
        "**리스크 분산**: 다양한 마케팅 채널과 상품 포트폴리오로 리스크를 분산하세요.",
      );
    }

    // 패턴 기반 추천
    if (trends.pattern === "cyclical") {
      recommendations.push(
        "**타이밍 최적화**: 주기적 패턴을 활용해 프로모션과 재고 관리 타이밍을 최적화하세요.",
      );
    }

    // 성과 기반 추천
    if (stats.maximum > stats.average * 2) {
      recommendations.push(
        "**성공 요인 분석**: 최고 성과 기간의 성공 요인을 분석하고 재현 가능한 전략을 수립하세요.",
      );
    }

    return recommendations.length > 0
      ? recommendations
      : [
          "현재 데이터로는 구체적인 추천사항을 제시하기 어렵습니다. 더 많은 데이터 수집을 권장합니다.",
        ];
  };

  // 시장 분석 생성
  const generateMarketAnalysis = (stats: any, trends: any) => {
    const marketSize = categorizeMarketSize(stats.average);
    const competitiveness = assessCompetitiveness(stats.volatility);

    return `
**카테고리 시장 분석**

현재 시장 규모는 ${marketSize.description}이며, 평균 검색 비율 ${stats.average.toFixed(1)}을 기록하고 있습니다. 

시장 경쟁 강도는 ${competitiveness.level}로 평가되며, 이는 ${competitiveness.description}를 의미합니다.

${
  trends.direction === "increasing"
    ? "성장하는 시장으로 신규 진입이나 투자 확대에 유리한 환경"
    : trends.direction === "decreasing"
      ? "수축하는 시장으로 차별화된 전략이 필요한 상황"
      : "안정된 시장으로 점진적 성장 전략이 적합한 환경"
}입니다.

변동성 ${stats.volatility.toFixed(1)}%는 ${
      stats.volatility > 30
        ? "예측하기 어려운 시장 환경"
        : stats.volatility > 15
          ? "보통 수준의 시장 변동성"
          : "안정적인 시장 환경"
    }을 나타내므로, 이에 맞는 리스크 관리 전략이 필요합니다.
    `.trim();
  };

  // 경쟁 분석 생성
  const generateCompetitiveAnalysis = (stats: any) => {
    const benchmarkScore = calculateBenchmarkScore(stats.average);

    return `
**경쟁 환경 분석**

현재 검색 비율 평균 ${stats.average.toFixed(1)}은 업계 기준 대비 ${benchmarkScore.level} 수준입니다.

• **시장 포지션**: ${benchmarkScore.position}
• **경쟁 우위 요소**: ${benchmarkScore.advantages}
• **개선 필요 영역**: ${benchmarkScore.improvements}

최고 성과 기간(${stats.maxPeriod})의 성공 요인을 벤치마킹하여 지속적인 경쟁 우위를 확보하는 것이 중요합니다.
    `.trim();
  };

  // 예측 생성
  const generateForecast = (trends: any, data: any[]) => {
    const forecastPeriods = 3; // 3개 기간 예측
    const predictions = [];

    if (trends.direction === "increasing") {
      const growthRate = trends.changePercent / 100;
      const lastValue = data[data.length - 1].ratio;

      for (let i = 1; i <= forecastPeriods; i++) {
        const predictedValue = lastValue * (1 + growthRate * 0.7); // 성장률 감소 고려
        predictions.push({
          period: `예측 ${i}기`,
          value: predictedValue.toFixed(1),
        });
      }
    }

    return `
**향후 전망 (${forecastPeriods}개 기간 예측)**

${
  trends.direction === "increasing"
    ? `현재 상승 추세가 지속될 경우 다음과 같은 예측값이 도출됩니다:
${predictions.map((p) => `• ${p.period}: ${p.value}`).join("\n")}

다만, 시장 포화나 경쟁 심화로 인해 성장률이 둔화될 수 있음을 고려해야 합니다.`
    : trends.direction === "decreasing"
      ? `하락 추세가 지속될 경우 추가적인 감소가 예상되므로, 적극적인 대응 전략이 필요합니다.`
      : `안정적인 추세로 큰 변동 없이 현재 수준이 유지될 것으로 예상됩니다.`
}

**주요 변수**: 계절성, 경쟁사 동향, 소비자 트렌드 변화 등이 예측에 영향을 줄 수 있습니다.
    `.trim();
  };

  // 실행 계획 생성
  const generateActionItems = (trends: any) => {
    const actionItems = [];

    // 단기 액션 아이템
    actionItems.push("**단기 (1-2주)**");
    actionItems.push("- 현재 데이터 기반 마케팅 캠페인 성과 점검");
    actionItems.push("- 경쟁사 동향 모니터링 시스템 구축");

    // 중기 액션 아이템
    actionItems.push("**중기 (1-3개월)**");
    actionItems.push("- 트렌드 변화에 따른 마케팅 전략 조정");
    actionItems.push("- 고객 세그먼트별 맞춤 전략 개발");

    // 장기 액션 아이템
    actionItems.push("**장기 (3-6개월)**");
    actionItems.push("- 시장 변화 대응 로드맵 수립");
    actionItems.push("- 지속적인 데이터 수집 및 분석 체계 구축");

    if (trends.direction === "increasing") {
      actionItems.push("- 성장 모멘텀 활용한 시장 점유율 확대 전략");
    } else if (trends.direction === "decreasing") {
      actionItems.push("- 하락세 반전을 위한 혁신적 마케팅 전략 개발");
    }

    return actionItems;
  };

  // 보조 함수들
  const identifyPeaks = (values: number[]) => {
    const peaks = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  };

  const identifyValleys = (values: number[]) => {
    const valleys = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        valleys.push(i);
      }
    }
    return valleys;
  };

  const calculateAvgDistance = (positions: number[]) => {
    if (positions.length < 2) return 0;
    const distances = positions.slice(1).map((pos, i) => pos - positions[i]);
    return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  };

  const checkSeasonality = (values: number[]) => {
    // 간단한 계절성 체크 (실제로는 더 복잡한 알고리즘 필요)
    const quarterLength = Math.ceil(values.length / 4);
    const quarters = [];

    for (let i = 0; i < 4; i++) {
      const start = i * quarterLength;
      const end = Math.min(start + quarterLength, values.length);
      const quarterAvg =
        values.slice(start, end).reduce((sum, val) => sum + val, 0) /
        (end - start);
      quarters.push(quarterAvg);
    }

    const overallAvg =
      quarters.reduce((sum, avg) => sum + avg, 0) / quarters.length;
    const variance =
      quarters.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) /
      quarters.length;

    return Math.sqrt(variance) / overallAvg; // 계수변동
  };

  const identifyPeakSeason = (data: any[]) => {
    // 월별 데이터에서 성수기 식별 (간단한 구현)
    const monthlyAvg = new Map();

    data.forEach((item) => {
      const month = new Date(item.period).getMonth();
      if (!monthlyAvg.has(month)) {
        monthlyAvg.set(month, []);
      }
      monthlyAvg.get(month).push(item.ratio);
    });

    let maxAvg = 0;
    let peakMonth = 0;

    monthlyAvg.forEach((values, month) => {
      const avg =
        values.reduce((sum: number, val: number) => sum + val, 0) /
        values.length;
      if (avg > maxAvg) {
        maxAvg = avg;
        peakMonth = month;
      }
    });

    const monthNames = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];
    return monthNames[peakMonth];
  };

  const identifyLowSeason = (data: any[]) => {
    // 성수기와 반대 로직
    const monthlyAvg = new Map();

    data.forEach((item) => {
      const month = new Date(item.period).getMonth();
      if (!monthlyAvg.has(month)) {
        monthlyAvg.set(month, []);
      }
      monthlyAvg.get(month).push(item.ratio);
    });

    let minAvg = Infinity;
    let lowMonth = 0;

    monthlyAvg.forEach((values, month) => {
      const avg =
        values.reduce((sum: number, val: number) => sum + val, 0) /
        values.length;
      if (avg < minAvg) {
        minAvg = avg;
        lowMonth = month;
      }
    });

    const monthNames = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];
    return monthNames[lowMonth];
  };

  const categorizeMarketSize = (average: number) => {
    if (average > 70) return { description: "대형 시장", level: "large" };
    if (average > 40) return { description: "중형 시장", level: "medium" };
    if (average > 20) return { description: "소형 시장", level: "small" };
    return { description: "틈새 시장", level: "niche" };
  };

  const assessCompetitiveness = (volatility: number) => {
    if (volatility > 30) {
      return {
        level: "높음",
        description: "경쟁이 매우 치열하여 시장 예측이 어려운 상황",
      };
    }
    if (volatility > 15) {
      return {
        level: "보통",
        description: "적당한 경쟁 수준으로 전략적 접근이 필요한 상황",
      };
    }
    return {
      level: "낮음",
      description: "안정적인 시장으로 꾸준한 성장이 가능한 환경",
    };
  };

  const calculateBenchmarkScore = (average: number) => {
    // 업계 평균을 50으로 가정한 상대적 평가
    const score = (average / 50) * 100;

    if (score > 120) {
      return {
        level: "우수",
        position: "시장 선두 그룹",
        advantages: "높은 브랜드 인지도, 강력한 마케팅 효과",
        improvements: "지속적인 혁신으로 우위 유지",
      };
    }
    if (score > 80) {
      return {
        level: "양호",
        position: "중상위 그룹",
        advantages: "안정적인 시장 포지션",
        improvements: "차별화 전략으로 상위권 도약",
      };
    }
    return {
      level: "개선 필요",
      position: "하위 그룹",
      advantages: "성장 잠재력",
      improvements: "마케팅 강화 및 제품력 향상 필요",
    };
  };

  return {
    generateReport,
    isGenerating,
  };
};

export default useReportGenerator;
