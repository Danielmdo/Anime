import { Suspense } from "react";
import BrowseContent from "./BrowseContent";

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
