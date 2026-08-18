"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  isActive: boolean;
}

interface BannersApiResponse {
  success?: boolean;
  banners?: Banner[];
  message?: string;
  error?: string;
}

const AUTO_SLIDE_TIME = 4000;
const MAX_BANNERS = 4;

export default function Hero() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] =
    useState(true);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/banners?active=true",
          {
            cache: "no-store",
          }
        );

        const data: BannersApiResponse =
          await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
              data.error ||
              "Failed to load banners"
          );
        }

        const bannerList = Array.isArray(data.banners)
          ? data.banners
              .filter((banner) => banner.isActive)
              .sort(
                (a, b) =>
                  a.displayOrder - b.displayOrder
              )
              .slice(0, MAX_BANNERS)
          : [];

        setBanners(bannerList);
      } catch (error) {
        console.error(
          "Hero banner load error:",
          error
        );

        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (
      banners.length <= 1 ||
      isPaused
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((previousIndex) =>
        previousIndex + 1
      );
    }, AUTO_SLIDE_TIME);

    return () => {
      window.clearInterval(interval);
    };
  }, [banners.length, isPaused]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTransitionEnd = () => {
    if (
      currentIndex === banners.length
    ) {
      setIsTransitioning(false);
      setCurrentIndex(0);

      timeoutRef.current = window.setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    }
  };

  const goToPrevious = () => {
    if (banners.length <= 1) {
      return;
    }

    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(banners.length);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentIndex(banners.length - 1);
        });
      });

      return;
    }

    setIsTransitioning(true);
    setCurrentIndex((previousIndex) =>
      previousIndex - 1
    );
  };

  const goToNext = () => {
    if (banners.length <= 1) {
      return;
    }

    setIsTransitioning(true);
    setCurrentIndex((previousIndex) =>
      previousIndex + 1
    );
  };

  if (loading) {
    return (
      <section className="flex min-h-[250px] items-center justify-center bg-white">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-blue-700"
          />

          <p className="mt-3 text-sm font-medium text-gray-500">
            Loading offers...
          </p>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="bg-gradient-to-r from-blue-50 via-white to-slate-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 md:text-6xl">
              Find Your{" "}
              <span className="text-blue-700">
                Perfect Style
              </span>
            </h1>

            <p className="mt-5 text-lg text-gray-600">
              Explore fashion, footwear,
              handbags and jewellery.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-xl bg-blue-700 px-8 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const sliderBanners =
    banners.length > 1
      ? [...banners, banners[0]]
      : banners;

  const visibleDotIndex =
    currentIndex === banners.length
      ? 0
      : currentIndex;

  return (
    <section
      className="relative w-full overflow-hidden bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative mx-auto w-full max-w-[1600px] overflow-hidden">

        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex ${
            isTransitioning
              ? "transition-transform duration-700 ease-in-out"
              : ""
          }`}
          style={{
            transform: `translateX(-${
              currentIndex * 100
            }%)`,
          }}
        >
          {sliderBanners.map((banner, index) => {
            const imageContent = (
              <picture>
                {banner.mobileImage && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={banner.mobileImage}
                  />
                )}

                <img
                  src={banner.desktopImage}
                  alt={
                    banner.title ||
                    "DianaKart promotional banner"
                  }
                  className="block w-full object-contain"
                  draggable={false}
                />
              </picture>
            );

            return (
              <div
                key={`${banner._id}-${index}`}
                className="w-full min-w-full shrink-0"
              >
                {banner.buttonLink ? (
                  <Link
                    href={banner.buttonLink}
                    className="block w-full"
                  >
                    {imageContent}
                  </Link>
                ) : (
                  imageContent
                )}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-lg transition hover:bg-black/60 md:left-5 md:h-12 md:w-12"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-lg transition hover:bg-black/60 md:right-5 md:h-12 md:w-12"
            >
              <ChevronRight size={28} />
            </button>

            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
              {banners.map((banner, index) => (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentIndex(index);
                  }}
                  aria-label={`Show banner ${
                    index + 1
                  }`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    visibleDotIndex === index
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/60 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}