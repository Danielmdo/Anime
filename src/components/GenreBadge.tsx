"use client";

import Link from "next/link";

interface GenreBadgeProps {
  genre: string;
  size?: "sm" | "md" | "lg";
}

export default function GenreBadge({
  genre,
  size = "md",
}: GenreBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <Link
      href={`/genres/${encodeURIComponent(genre)}`}
      className={`${sizeClasses[size]} bg-gray-800 text-gray-300 rounded-full border border-gray-700 hover:border-red-500 hover:text-red-400 hover:bg-gray-750 transition-all duration-200 font-medium`}
    >
      {genre}
    </Link>
  );
}
