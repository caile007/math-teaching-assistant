"use client";

import Latex from "react-latex-next";

interface Props {
  text: string;
  className?: string;
}

export function LaTeXRenderer({ text, className }: Props) {
  if (!text) return null;

  return (
    <span className={className}>
      <Latex strict={false}>{text}</Latex>
    </span>
  );
}
