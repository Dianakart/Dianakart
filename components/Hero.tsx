"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

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

export default function Hero() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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

        setBanners(
          Array.isArray(data.banners)
            ? data.banners
            : []
        );
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
    if (banners.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === banners.length - 1
          ? 0
          : previousIndex + 1
      );
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [banners.length]);

  useEffect(() => {
    if (
      banners.length > 0 &&
      currentIndex >= banners.length
    ) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((previousIndex) =>
      previousIndex === 0
        ? banners.length - 1
        : previousIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((previousIndex) =>
      previousIndex === banners.length - 1
        ? 0
        : previousIndex + 1
    );
  };

  if (loading) {
    return (
      <section className="flex min-h-[300px] items-center justify-center bg-gray-100 md:min-h-[420px]">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-pink-600"
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
      <section className="bg-gradient-to-r from-pink-50 via-white to-purple-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
              Find Your
              <span className="text-pink-600">
                {" "}
                Perfect Style
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Explore the latest collection of fashion,
              handbags, footwear, jewellery and beauty
              products—all in one place.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-xl bg-pink-600 px-8 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Shop Now
            </Link>
          </div>

          <div className="flex justify-center">
            <img
              src="/banner-girl.png"
              alt="Fashion Banner"
              className="w-full max-w-md rounded-3xl"
            />
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative w-full overflow-hidden bg-gray-100">
      <div className="relative w-full">
        <picture>
          {currentBanner.mobileImage && (
            <source
              media="(max-width: 767px)"
              srcSet={currentBanner.mobileImage}
            />
          )}

          <img
            key={currentBanner._id}
            src={currentBanner.desktopImage}
            alt={
              currentBanner.title ||
              "DianaKart promotional banner"
            }
            className="w-full h-[260px] sm:h-[320px] md:h-[400px] lg:h-[470px] object-contain bg-white"
          />
        </picture>

       
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-lg transition hover:bg-black/60 md:left-6 md:h-12 md:w-12"
            >
              <ChevronLeft size={26} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-lg transition hover:bg-black/60 md:right-6 md:h-12 md:w-12"
            >
              <ChevronRight size={26} />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
              {banners.map((banner, index) => (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() =>
                    setCurrentIndex(index)
                  }
                  aria-label={`Show banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    currentIndex === index
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