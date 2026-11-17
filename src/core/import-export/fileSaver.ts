import { Capacitor } from '@capacitor/core';
import { bytesToBase64 } from '@/core/crypto/encryption';

const TEXT_ENCODER = new TextEncoder();

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned === '' ? 'manka-file' : cleaned.slice(0, 140);
}

export interface SaveResult {
  method: 'download' | 'share';
  fileName: string;
}

function toBytes(data: Uint8Array | string): Uint8Array {
  return typeof data === 'string' ? TEXT_ENCODER.encode(data) : data;
}

export async function saveFile(
  fileName: string,
  mimeType: string,
  data: Uint8Array | string,
): Promise<SaveResult> {
  const safeName = sanitizeFileName(fileName);
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const bytes = toBytes(data);
    const path = `Manka/${safeName}`;
    await Filesystem.writeFile({
      path,
      data: bytesToBase64(bytes),
      directory: Directory.Cache,
      recursive: true,
    });
    const uri = await Filesystem.getUri({ directory: Directory.Cache, path });
    await Share.share({
      title: safeName,
      text: 'File dibuat oleh Manka.',
      url: uri.uri,
      dialogTitle: 'Simpan atau bagikan file',
    });
    return { method: 'share', fileName: safeName };
  }

  const bytes = toBytes(data);
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  return { method: 'download', fileName: safeName };
}
