import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMilliSecondsToMinutes(num: number) {
  const minutes = Math.floor(num / 60000);
  const seconds = Math.floor((num % 60000) / 1000);
  return `${minutes}분 ${seconds}초`;
}
