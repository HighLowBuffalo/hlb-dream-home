"use client";

interface UploadedImage {
  id: string;
  context_key: string;
  storage_path: string;
  file_name: string | null;
  signed_url: string | null;
}

interface UploadedImagesProps {
  images: UploadedImage[];
  contextKey: string;
}

export default function UploadedImages({ images, contextKey }: UploadedImagesProps) {
  const filtered = images.filter((img) => img.context_key === contextKey && img.signed_url);
  if (filtered.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {filtered.map((img) => (
        <a
          key={img.id}
          href={img.signed_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-gray-200 hover:border-black transition-colors"
          title={img.file_name || ""}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.signed_url || ""}
            alt={img.file_name || "uploaded image"}
            className="h-24 w-24 object-cover block"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}
