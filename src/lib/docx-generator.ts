import {
  Document, Packer, Paragraph, TextRun,
  ImageRun, AlignmentType, BorderStyle,
} from 'docx';
import { mmToDxa, PAPER_SIZES } from './paper-sizes';
import { svgToPng } from './image';
import type { WorksheetWithItems } from '@/types';

export async function generateDocx(worksheet: WorksheetWithItems): Promise<Buffer> {
  const paper = PAPER_SIZES[worksheet.paper_size];
  const children = await buildParagraphs(worksheet);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: mmToDxa(paper.widthMm),
            height: mmToDxa(paper.heightMm),
          },
          margin: {
            top: mmToDxa(worksheet.margin_top ? worksheet.margin_top / 56.69 : 20),
            bottom: mmToDxa(worksheet.margin_bottom ? worksheet.margin_bottom / 56.69 : 20),
            left: mmToDxa(worksheet.margin_left ? worksheet.margin_left / 56.69 : 25),
            right: mmToDxa(worksheet.margin_right ? worksheet.margin_right / 56.69 : 25),
          },
        },
      },
      children,
    }],
    styles: {
      default: {
        document: {
          run: {
            font: "宋体",
            size: 24,
          },
        },
      },
    },
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

async function buildParagraphs(worksheet: WorksheetWithItems): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: worksheet.title, bold: true, size: 36, font: "黑体" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `姓名：__________  班级：__________  日期：__________`, size: 21 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 },
    }),
    // Separator
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, space: 1 } },
      spacing: { after: 200 },
    })
  );

  for (let i = 0; i < worksheet.items.length; i++) {
    const item = worksheet.items[i];
    const numStr = getQuestionLabel(i + 1, item.question_type);

    // Question title
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `${numStr}`, bold: true, size: 26 })],
        spacing: { before: 200, after: 80 },
      })
    );

    // Question text
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: stripLatexForWord(item.question_text), size: 24 })],
        spacing: { after: 80 },
      })
    );

    // Figure (if any)
    if (item.figure_svg) {
      try {
        const pngBuffer = await svgToPng(item.figure_svg);
        paragraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: pngBuffer,
                transformation: {
                  width: 300,
                  height: 225,
                },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          })
        );
      } catch {
        // SVG rendering failed - skip figure
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "（配图见原题）", size: 21, italics: true, color: "999999" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          })
        );
      }
    }

    // Answer blank area
    const blankLines = Math.round(item.blank_height_mm / 7); // ~7mm per line
    for (let j = 0; j < blankLines; j++) {
      paragraphs.push(new Paragraph({ spacing: { after: 0, line: 360 } }));
    }

    // Separator between questions
    if (i < worksheet.items.length - 1) {
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.DASHED, size: 1, space: 4, color: "CCCCCC" },
          },
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  return paragraphs;
}

function getQuestionLabel(index: number, type: string): string {
  const labels: Record<string, string> = {
    choice: `一、选择题 ${index}.`,
    fill_in: `二、填空题 ${index}.`,
    calculation: `三、解答题 ${index}.`,
    proof: `三、解答题 ${index}.`,
  };
  return labels[type] || `${index}.`;
}

// Strip LaTeX math markers for Word output, keep the math text
function stripLatexForWord(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, ' $1 ')
    .trim();
}
