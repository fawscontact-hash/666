"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";

/**
 * SliderCollection
 * ─────────────────────────────────────────────────────────────────────────────
 * BEFORE: fetched /api/collection in useEffect → blank circles until JS ran
 * AFTER:  accepts `collections` prop from Server Component → renders instantly
 *
 * Still "use client" because Swiper requires browser APIs.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SliderCollection({ isTitle = true, collections = [] }) {
  // No fetch, no useEffect for data — collections arrive as props from server
  if (collections.length === 0) return null;

  return (
    <section>
      <div className="container mx-auto px-4 md:px-20">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          loop={false}
          rewind={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 2000, disableOnInteraction: false }}
          className="collection-swiper hide-swiper-dots"
          breakpoints={{
            0: { slidesPerView: 3 },
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 7 },
          }}
        >
          {collections.map((collection) => (
            <SwiperSlide key={collection.id}>
              <Link href={`/products?collection=${collection.title}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="md:w-28 md:h-28 w-24 h-24 rounded-full border border-blue-300 p-1 flex items-center justify-center shadow-sm transition-all duration-300 hover:shadow-md">
                    <img src={collection.image || "https://placehold.co/100x100"} alt={collection.title} className="w-full h-full rounded-full object-cover object-center" />
                  </div>
                  <p className="mt-2 md:text-sm text-xs font-medium text-gray-800 line-clamp-1">{collection.title}</p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
