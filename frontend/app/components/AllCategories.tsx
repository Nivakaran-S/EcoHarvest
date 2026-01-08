"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import PlaceholderImage from "../images/RiceGrainsNoodles.jpg";
import Loading from "./Loading";

const API_BASE_URL = "/api/proxy";

interface ProductCategory {
  _id: string;
  name: string;
  imageUrl: string;
}

const AllCategories: React.FC = () => {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackImages, setFallbackImages] = useState<{ [key: string]: string | StaticImageData }>({});
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ProductCategory[]>(`${API_BASE_URL}/productcategories`);
        setProductCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleImageError = (id: string) => {
    setFallbackImages((prev) => ({ ...prev, [id]: PlaceholderImage }));
  };

  const handleCategoryClick = (id: string, name: string) => {
    router.push(`/category?categoryId=${encodeURIComponent(id)}&categoryName=${encodeURIComponent(name)}`);
  };

  return (
    <section className="relative bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] min-h-screen py-16 px-4 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FDAA1C]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-[#22C55E]/10 to-transparent rounded-full blur-3xl" />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[99999]">
          <Loading />
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDAA1C]/10 text-[#e6941a] text-sm font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-[#FDAA1C]" />
              Browse by Category
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              All Categories
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our wide range of fresh, organic products organized just for you
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {productCategories.map((category, index) => (
              <div
                key={category._id}
                onClick={() => handleCategoryClick(category._id, category.name)}
                className="group relative cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Card */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  {/* Image */}
                  <Image
                    src={fallbackImages[category._id] || category.imageUrl || PlaceholderImage}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => handleImageError(category._id)}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Icon Badge */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Category Name */}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-white text-lg md:text-xl font-semibold text-center drop-shadow-lg">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-xs text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Shop Now →
                    </p>
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FDAA1C] to-[#22C55E] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AllCategories;
