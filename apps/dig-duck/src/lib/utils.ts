import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMilliSecondsToMinutes(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}분 ${seconds}초`;
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "yyyy년 MM월 dd일");
}
