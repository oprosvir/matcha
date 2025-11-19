import * as React from "react";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getPhotoUrl } from "@/utils/photoUtils";
import { User as UserIcon } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  isProfilePic: boolean;
}

interface PhotoCarouselProps {
  photos?: Photo[];
  userName?: string;
}

export function PhotoCarousel({ photos, userName }: PhotoCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Update current slide info
  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // If no photos, show placeholder
  if (!photos || photos.length === 0) {
    return (
      <div className="relative w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <UserIcon className="w-24 h-24 text-muted-foreground" />
      </div>
    );
  }

  // If only one photo, show without carousel controls
  if (photos.length === 1) {
    return (
      <div className="relative w-full aspect-square rounded-lg overflow-hidden">
        <img
          src={getPhotoUrl(photos[0].url)}
          alt={userName ? `${userName}'s photo` : "Profile photo"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col">
      <Carousel setApi={setApi} className="w-full group flex-shrink-0">
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem key={photo.id}>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <img
                  src={getPhotoUrl(photo.url)}
                  alt={userName ? `${userName}'s photo` : "Profile photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Overlay arrow buttons - inside the image */}
        <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Carousel>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4 flex-shrink-0">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current
                ? "bg-primary w-6"
                : "bg-muted-foreground/30"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
