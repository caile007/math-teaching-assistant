import { put, del } from '@vercel/blob';

export async function uploadPhoto(file: Buffer, filename: string): Promise<{ url: string; key: string }> {
  const result = await put(filename, file, {
    access: 'public',
    contentType: 'image/webp',
  });
  return { url: result.url, key: result.pathname };
}

export async function deletePhoto(key: string): Promise<void> {
  await del(key);
}
