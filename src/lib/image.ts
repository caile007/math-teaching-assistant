import sharp from 'sharp';

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function svgToPng(svgString: string): Promise<Buffer> {
  return sharp(Buffer.from(svgString))
    .resize(800, 600, { fit: 'inside' })
    .png()
    .toBuffer();
}
