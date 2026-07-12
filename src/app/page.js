"use client";

import { useState } from "react";
import HeroSection from "./section_home/HeroSection";
import PhotoGrid from "./section_home/PhotoGrid";
import UploadModal from "./section_home/UploadModal";

export default function HomePage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <HeroSection onUploadClick={() => setIsUploadOpen(true)} />

      <PhotoGrid key={refreshKey} />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
