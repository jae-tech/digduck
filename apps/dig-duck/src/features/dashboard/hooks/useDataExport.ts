import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import { format } from "date-fns";
// import { ko } from "date-fns/locale";
import type { ShoppingInsightsResult } from "@/features/crawler/types/crawler.types";

interface ExportData {
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

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Excel 내보내기
  const exportToExcel = async ({ data, searchParams }: ExportData) => {
    setIsExporting(true);
    try {
      // 워크시트 데이터 준비
      const worksheetData = [
        // 헤더 정보
        ["네이버 데이터랩 쇼핑 인사이트 분석 결과"],
        [""],
        ["분석 조건"],
        ["카테고리", searchParams.categoryName],
        ["분석 기간", `${searchParams.startDate} ~ ${searchParams.endDate}`],
        ["데이터 구간", searchParams.timeUnit === "date" ? "일간" : 
                      searchParams.timeUnit === "week" ? "주간" : "월간"],
        ...(searchParams.device ? [["기기", searchParams.device === "pc" ? "PC" : "모바일"]] : []),
        ...(searchParams.gender ? [["성별", searchParams.gender === "m" ? "남성" : "여성"]] : []),
        ...(searchParams.ages?.length ? [["연령대", searchParams.ages.join(", ")]] : []),
        ["생성일시", new Date().toLocaleString("ko-KR")],
        [""],
        ["데이터 분석 결과"],
        ["기간", "검색 비율"],
        ...data.data.map(item => [item.period, item.ratio])
      ];

      // 통계 정보 추가
      const avgRatio = data.data.reduce((sum, d) => sum + d.ratio, 0) / data.data.length;
      const maxRatio = Math.max(...data.data.map(d => d.ratio));
      const minRatio = Math.min(...data.data.map(d => d.ratio));
      
      worksheetData.push(
        [""],
        ["통계 요약"],
        ["평균 검색 비율", avgRatio.toFixed(2)],
        ["최대 검색 비율", maxRatio.toString()],
        ["최소 검색 비율", minRatio.toString()],
        ["총 데이터 포인트", data.data.length.toString()]
      );

      // 키워드 정보 추가
      if (data.keywords.length > 0) {
        worksheetData.push(
          [""],
          ["연관 키워드"],
          ...data.keywords.map(keyword => [keyword])
        );
      }

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 스타일 적용
      const range = XLSX.utils.decode_range(worksheet["!ref"]!);
      
      // 헤더 스타일
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (headerCell) {
          headerCell.s = {
            font: { bold: true, sz: 14 },
            fill: { bgColor: { indexed: 64 }, fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "center" }
          };
        }
      }

      // 열 너비 설정
      worksheet["!cols"] = [
        { wch: 20 }, // 기간 열
        { wch: 15 }  // 검색 비율 열
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "쇼핑인사이트분석");
      
      // 파일 다운로드
      const fileName = `네이버쇼핑인사이트_${searchParams.categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error("Excel 내보내기 오류:", error);
      throw new Error("Excel 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // CSV 내보내기
  const exportToCSV = async ({ data, searchParams }: ExportData) => {
    setIsExporting(true);
    try {
      const csvData = [
        // 헤더 정보
        `# 네이버 데이터랩 쇼핑 인사이트 분석 결과`,
        `# 카테고리: ${searchParams.categoryName}`,
        `# 분석기간: ${searchParams.startDate} ~ ${searchParams.endDate}`,
        `# 생성일시: ${new Date().toLocaleString("ko-KR")}`,
        ``,
        `기간,검색비율`,
        ...data.data.map(item => `${item.period},${item.ratio}`)
      ].join("\n");

      // BOM 추가 (한글 인코딩 문제 해결)
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvData], { type: "text/csv;charset=utf-8;" });
      
      // 다운로드
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", 
        `네이버쇼핑인사이트_${searchParams.categoryName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("CSV 내보내기 오류:", error);
      throw new Error("CSV 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // PDF 내보내기
  const exportToPDF = async ({ data, searchParams }: ExportData) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // 한글 폰트 설정 (기본 폰트 사용, 실제로는 NanumGothic 등 추가 필요)
      doc.setFont("helvetica");
      
      // 제목
      doc.setFontSize(20);
      doc.text("Naver DataLab Shopping Insights Report", 20, 30);
      
      // 기본 정보
      doc.setFontSize(12);
      let yPosition = 50;
      
      doc.text(`Category: ${searchParams.categoryName}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Period: ${searchParams.startDate} ~ ${searchParams.endDate}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Time Unit: ${searchParams.timeUnit === "date" ? "Daily" : 
                                searchParams.timeUnit === "week" ? "Weekly" : "Monthly"}`, 20, yPosition);
      yPosition += 10;
      
      if (searchParams.device) {
        doc.text(`Device: ${searchParams.device === "pc" ? "PC" : "Mobile"}`, 20, yPosition);
        yPosition += 10;
      }
      
      if (searchParams.gender) {
        doc.text(`Gender: ${searchParams.gender === "m" ? "Male" : "Female"}`, 20, yPosition);
        yPosition += 10;
      }
      
      doc.text(`Generated: ${new Date().toLocaleString("ko-KR")}`, 20, yPosition);
      yPosition += 20;

      // 통계 요약
      const avgRatio = data.data.reduce((sum, d) => sum + d.ratio, 0) / data.data.length;
      const maxRatio = Math.max(...data.data.map(d => d.ratio));
      const minRatio = Math.min(...data.data.map(d => d.ratio));
      
      doc.text("Summary Statistics:", 20, yPosition);
      yPosition += 10;
      doc.text(`Average Search Ratio: ${avgRatio.toFixed(2)}`, 30, yPosition);
      yPosition += 8;
      doc.text(`Maximum Search Ratio: ${maxRatio}`, 30, yPosition);
      yPosition += 8;
      doc.text(`Minimum Search Ratio: ${minRatio}`, 30, yPosition);
      yPosition += 8;
      doc.text(`Total Data Points: ${data.data.length}`, 30, yPosition);
      yPosition += 20;

      // 데이터 테이블
      const tableData = data.data.map(item => [item.period, item.ratio.toString()]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [["Period", "Search Ratio"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [63, 129, 182],
          textColor: 255,
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      });

      // 키워드 추가
      if (data.keywords.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text("Related Keywords:", 20, finalY);
        doc.text(data.keywords.join(", "), 20, finalY + 10);
      }

      // 파일 저장
      const fileName = `NaverShoppingInsights_${searchParams.categoryName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error("PDF 내보내기 오류:", error);
      throw new Error("PDF 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    exportToCSV,
    exportToPDF,
    isExporting,
  };
};

export default useDataExport;