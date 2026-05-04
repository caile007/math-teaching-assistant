import type { PaperSize } from '@/types';

// 1mm = 56.69 DXA (twips)
const MM_TO_DXA = 56.69;

export function mmToDxa(mm: number): number {
  return Math.round(mm * MM_TO_DXA);
}

export function dxaToMm(dxa: number): number {
  return Math.round(dxa / MM_TO_DXA);
}

export const PAPER_SIZES: Record<PaperSize, { widthMm: number; heightMm: number; name: string }> = {
  '8K': { widthMm: 270, heightMm: 390, name: '8K' },
  'A4': { widthMm: 210, heightMm: 297, name: 'A4' },
};

export const DEFAULT_MARGINS = {
  topMm: 20,
  bottomMm: 20,
  leftMm: 25,
  rightMm: 25,
};
