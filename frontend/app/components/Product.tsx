"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Star from "../images/log.png";

// Define interfaces for props
interface Discount {
  status: boolean;
  productId: { _id: string };
  percentage: number;
}

// Updated interface to match the API response structure
interface ProductProps {
  // Support both _id and id for flexibility
  id?: string;
  _id?: string;
  title?: string;
  name?: string; // API uses 'name' instead of 'title'
  subtitle: string;
  unitPrice: number;
  MRP?: number; // Added MRP from API
  imageUrl: string;
  discounts?: Discount[];
  averageRating?: number;
  numberOfReviews?: number; // API uses 'numberOfReviews' instead of 'reviewCount'
  reviewCount?: number; // Keep for backward compatibility
  status?: string; // Added status from API
  quantity?: number; // Added quantity from API
}

const ProductCard: React.FC<ProductProps> = ({
  id,
  _id,
  title,
  name,
  subtitle,
  unitPrice,
  MRP,
  imageUrl,
  discounts,
  averageRating = 0,
  numberOfReviews,
  reviewCount,
  status,
  quantity,
}) => {
  const router = useRouter();

  // Get the actual product ID (support both _id and id)
  const productId = id || _id;

  // Get the actual product name (support both name and title)
  const productName = name || title;

  // Get the actual review count (prioritize numberOfReviews from API)
  const actualReviewCount = numberOfReviews ?? reviewCount ?? 0;

  // Validate required props
  if (!productId || !productName || !unitPrice) {
    console.warn('ProductCard: Missing required props', { productId, productName, unitPrice });
    return null; // Don't render if essential data is missing
  }

  // Check if product has a discount
  const discount = discounts?.find(
    (discount) => discount.status && discount.productId?._id === productId
  );

  const discountPrice = discount
    ? Math.round(unitPrice * (1 - discount.percentage / 100))
    : null;

  // Check if product is out of stock
  const isOutOfStock = status === "Out of Stock" || quantity === 0;

  const handleProductClick = () => {
    if (isOutOfStock) {
      return;
    }

    let url = `/product?productId=${encodeURIComponent(productId)}`;
    if (discountPrice) {
      url += `&discountPrice=${discountPrice}&discountPercentage=${discount?.percentage ?? ""
        }`;
    }
    router.push(url);
  };

  return (
    <div
      onClick={handleProductClick}
      className={`group relative bg-white overflow-hidden 
        h-auto min-h-[280px] sm:min-h-[320px] md:min-h-[350px]
        rounded-2xl flex flex-col 
        w-full
        transition-all duration-500 ease-out
        border border-gray-100
        ${isOutOfStock
          ? 'opacity-60 cursor-not-allowed grayscale'
          : 'cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-200 hover:shadow-emerald-100/50'
        }`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Premium Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500 rounded-2xl" />

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
          <span className="text-white font-bold text-sm uppercase tracking-wider bg-red-500 px-4 py-2 rounded-full shadow-lg">
            Sold Out
          </span>
        </div>
      )}

      {/* Discount Badge - Premium Style */}
      {!!discount && !isOutOfStock && (
        <div className="absolute top-3 left-3 z-10">
          <div className="badge-discount flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
            </svg>
            {discount.percentage}% OFF
          </div>
        </div>
      )}

      {/* Organic Badge */}
      {status === "In Stock" && !isOutOfStock && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <span className="text-sm">🌿</span>
          </div>
        </div>
      )}

      {/* Product Image Container */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-gray-50/50 to-white">
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={imageUrl}
            className="select-none object-contain transition-transform duration-500 group-hover:scale-110"
            alt={`${productName} - ${subtitle}`}
            width={180}
            height={180}
            sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 180px"
            onError={(e) => {
              console.warn(`Failed to load image for product ${productId}:`, imageUrl);
            }}
          />
        </div>

        {/* Quick Add Button - Appears on hover */}
        {!isOutOfStock && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Quick View
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 pt-3 flex flex-col gap-1.5 bg-white relative z-10">
        {/* Category/Subtitle */}
        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
          {subtitle}
        </span>

        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[36px] group-hover:text-emerald-700 transition-colors">
          {productName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} ({actualReviewCount})
          </span>
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex flex-col">
            {discountPrice ? (
              <>
                <span className="text-xs text-gray-400 line-through">
                  Rs. {unitPrice}
                </span>
                <span className="text-lg font-bold text-[#22C55E]">
                  Rs. {discountPrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                Rs. {unitPrice}
              </span>
            )}
            {MRP && MRP > unitPrice && (
              <span className="text-[10px] text-gray-400">
                MRP: Rs. {MRP}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {status && !isOutOfStock && (
            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${status === "In Stock"
                ? "bg-green-50 text-green-600"
                : status === "Low Stock"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-red-50 text-red-600"
              }`}>
              {status === "In Stock" ? "✓ In Stock" : status}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
};

export default ProductCard;