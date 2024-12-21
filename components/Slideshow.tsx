"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fullscreen, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

const transitions = [
  "fade",
  "slide",
  "zoom",
  "kenBurns",
  "additiveDissolve",
  "rotate",
  "flip",
  "swirl",
  "blinds",
  "bounce",
  "wipe",
  "expand",
  "shrink",
  "spinZoom",
  "slideRotate",
  "cubeRotate",
  "accordion",
  "doorway",
  "pixelate",
  "wave",
];

interface SlideshowProps {
  images: string[];
}

export default function Slideshow({ images }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTransition, setCurrentTransition] = useState(transitions[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const preloadQueue = useRef<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  const indicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const preloadImage = useCallback(
    (url: string) => {
      if (!loadedImages.includes(url) && !preloadQueue.current.includes(url)) {
        preloadQueue.current.push(url);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setLoadedImages((prev) => [...prev, url]);
          preloadQueue.current = preloadQueue.current.filter((i) => i !== url);
        };
        img.onerror = () => {
          preloadQueue.current = preloadQueue.current.filter((i) => i !== url);
        };
      }
    },
    [loadedImages],
  );

  const preloadNextImages = useCallback(() => {
    if (images.length === 0) return;
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % images.length;
      preloadImage(images[nextIndex]);
    }
  }, [currentIndex, images, preloadImage]);

  const resetInterval = useCallback(() => {
    if (isPaused) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      setCurrentTransition(
        transitions[Math.floor(Math.random() * transitions.length)],
      );
    }, 5000);
  }, [images.length, isPaused]);

  const changeImage = useCallback(
    (direction: "next" | "previous") => {
      setCurrentIndex((prevIndex) => {
        if (direction === "next") {
          return (prevIndex + 1) % images.length;
        } else {
          return (prevIndex - 1 + images.length) % images.length;
        }
      });
      setCurrentTransition(
        transitions[Math.floor(Math.random() * transitions.length)],
      );
      resetInterval();
    },
    [images.length, resetInterval],
  );

  const nextImage = useCallback(() => changeImage("next"), [changeImage]);
  const previousImage = useCallback(
    () => changeImage("previous"),
    [changeImage],
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Handle spacebar to toggle pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setIsPaused((prev) => !prev);
        setIsIndicatorVisible(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isPaused) {
      resetInterval(); // Start the interval when not paused
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Clear the interval when paused
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Cleanup when component unmounts
      }
    };
  }, [resetInterval, isPaused]); // Make sure isPaused is a dependency

  useEffect(() => {
    preloadNextImages();
  }, [currentIndex, preloadNextImages]);

  useEffect(() => {
    if (images.length > 0) {
      images.forEach(preloadImage);
    }
  }, [images, preloadImage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        previousImage()
      } else if (event.key === 'ArrowRight') {
        nextImage()
      } else if (event.key.toLowerCase() === 'f') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextImage, previousImage, toggleFullscreen])


  useEffect(() => {
    const showIndicator = () => {
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      setIsIndicatorVisible(true);
      indicatorTimeoutRef.current = setTimeout(() => {
        setIsIndicatorVisible(false);
      }, 2000); // Adjust this value for shorter visibility duration
    };

    window.addEventListener("mousemove", showIndicator);
    return () => {
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      window.removeEventListener("mousemove", showIndicator);
    };
  }, []);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        No images found
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      <div className="relative w-full h-full overflow-hidden">
        {images.map((img, index) => (
          <img
            key={img}
            ref={(el) => {
              imageRefs.current[index] = el;
            }}
            src={img}
            alt={`Slide ${index + 1}`}
            className="hidden"
            onLoad={() => setLoadedImages((prev) => [...prev, img])}
          />
        ))}
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            custom={currentTransition}
            variants={transitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              rotate: { duration: 0.5 },
              rotateY: { duration: 0.5 },
              rotateX: { duration: 0.5 },
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {loadedImages.includes(images[currentIndex]) && (
              <motion.img
                src={images[currentIndex]}
                alt={`Slide ${currentIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                custom={currentTransition}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                transition={{
                  scale: { duration: 5 },
                  x: { duration: 5 },
                  y: { duration: 5 },
                  rotate: { duration: 5 },
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            className="bg-black/50 hover:bg-black/70"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Fullscreen className="h-4 w-4" />
          </Button>
        </div>
        {isIndicatorVisible && (
          <div
            className={`absolute bottom-8 left-1/2 flex items-center transform -translate-x-1/2 z-10 text-white bg-black/50 px-4 py-2 space-x-2 rounded ${
              isIndicatorVisible
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            } transition-opacity duration-300`}
          >
            {isPaused && (
              <>
                <Pause className="h-4 w-4" />
                <span>|</span>
              </>
            )}
            <span>{`${currentIndex + 1} of ${images.length}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const transitionVariants = {
  enter: (transition: string) => {
    switch (transition) {
      case "slide":
        return { x: 1000, opacity: 0 };
      case "zoom":
      case "kenBurns":
        return { scale: 1.5, opacity: 0 };
      case "additiveDissolve":
        return { opacity: 0, filter: "brightness(2)" };
      case "rotate":
        return { rotate: 180, opacity: 0 };
      case "flip":
        return { rotateY: 90, opacity: 0 };
      case "swirl":
        return { scale: 0, rotate: 360, opacity: 0 };
      case "blinds":
        return { clipPath: "inset(0 50% 0 50%)", opacity: 0 };
      case "bounce":
        return { y: -1000, opacity: 0 };
      case "wipe":
        return { clipPath: "inset(0 0 100% 0)", opacity: 1 };
      case "expand":
        return { scale: 0, opacity: 0 };
      case "shrink":
        return { scale: 2, opacity: 0 };
      case "spinZoom":
        return { scale: 0, rotate: 720, opacity: 0 };
      case "slideRotate":
        return { x: 1000, rotate: 90, opacity: 0 };
      case "cubeRotate":
        return { rotateY: -90, z: -1000, opacity: 0 };
      case "accordion":
        return { scaleX: 0, originX: 0, opacity: 0 };
      case "doorway":
        return { scaleY: 0, originY: 0, opacity: 0 };
      case "pixelate":
        return { filter: "blur(20px)", opacity: 0 };
      case "wave":
        return { y: [0, -50, 50, -50, 50, 0], opacity: 0 };
      default:
        return { opacity: 0 };
    }
  },
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    rotateY: 0,
    rotateX: 0,
    filter: "brightness(1) blur(0px)",
    clipPath: "inset(0 0 0 0)",
    z: 0,
    scaleX: 1,
    scaleY: 1,
  },
  exit: (transition: string) => {
    switch (transition) {
      case "slide":
        return { x: -1000, opacity: 0 };
      case "zoom":
        return { scale: 0.5, opacity: 0 };
      case "kenBurns":
        return { scale: 1, opacity: 0 };
      case "additiveDissolve":
        return { opacity: 0, filter: "brightness(2)" };
      case "rotate":
        return { rotate: -180, opacity: 0 };
      case "flip":
        return { rotateY: -90, opacity: 0 };
      case "swirl":
        return { scale: 0, rotate: -360, opacity: 0 };
      case "blinds":
        return { clipPath: "inset(0 0 0 100%)", opacity: 0 };
      case "bounce":
        return { y: 1000, opacity: 0 };
      case "wipe":
        return { clipPath: "inset(100% 0 0 0)", opacity: 1 };
      case "expand":
        return { scale: 2, opacity: 0 };
      case "shrink":
        return { scale: 0, opacity: 0 };
      case "spinZoom":
        return { scale: 0, rotate: -720, opacity: 0 };
      case "slideRotate":
        return { x: -1000, rotate: -90, opacity: 0 };
      case "cubeRotate":
        return { rotateY: 90, z: -1000, opacity: 0 };
      case "accordion":
        return { scaleX: 0, originX: 1, opacity: 0 };
      case "doorway":
        return { scaleY: 0, originY: 1, opacity: 0 };
      case "pixelate":
        return { filter: "blur(20px)", opacity: 0 };
      case "wave":
        return { y: [0, 50, -50, 50, -50, 0], opacity: 0 };
      default:
        return { opacity: 0 };
    }
  },
};

const imageVariants = {
  initial: (transition: string) => {
    if (transition === "kenBurns") {
      return {
        scale: 1,
        x: 0,
        y: 0,
      };
    }
    return {};
  },
  animate: (transition: string) => {
    if (transition === "kenBurns") {
      const scale = 1 + Math.random() * 0.2;
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      return {
        scale,
        x,
        y,
      };
    }
    return {};
  },
};
