type ImageGalleryProps = {
  images: string[];
  alt?: string;
};

export default function ImageGallery({ images, alt = "식당 사진" }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {images.map((src, i) => (
        <div key={i} className="h-52 w-52 shrink-0 overflow-hidden first:rounded-l-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
