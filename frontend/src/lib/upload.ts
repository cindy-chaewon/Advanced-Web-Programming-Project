import { ApiError, apiFetch } from "./api";

export type UploadResult = {
  url: string;
  filename: string;
  size_bytes: number;
};

export async function uploadImage(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<UploadResult>("/upload/image", {
    method: "POST",
    body: fd,
  });
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    try {
      const res = await uploadImage(f);
      urls.push(res.url);
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`${f.name}: ${err.message}`);
      }
      throw err;
    }
  }
  return urls;
}
