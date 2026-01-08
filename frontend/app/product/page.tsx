"use client";

import React, { useState, useEffect, ChangeEvent, Suspense } from "react";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import Max from "../components/Max";
import StarRating from "../components/StarRating";

import Image from "next/image";
import ProductImage2 from "../images/product.png";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Loading from "../components/Loading";

// ====== Base URL ======
const BASE_URL = "https://eco-harvest-backend.vercel.app";

// ====== Types ======
interface ProductDetail {
  id: string;
  name: string;
  subtitle: string;
  unitPrice: number;
  MRP: number;
  averageRating: number;
  numberOfReviews: number;
  statSubus?: string;
  imageUrl: string;
}

interface ApiProductResponse {
  _id: string;
  vendorId: string;
  name: string;
  subtitle: string;
  quantity: number;
  unitPrice: number;
  category: string;
  productCategory_id: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  __v: number;
  MRP: number;
  averageRating: number;
  numberOfReviews: number;
}

interface Review {
  userName: string;
  rating: number;
  comment: string;
}

interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  name?: string;
  subtitle?: string;
  unitPrice?: number;
  MRP?: number;
  averageRating?: number;
  numberOfReviews?: number;
  statSubus?: string;
  imageUrl?: string;
}

interface Cart {
  products: CartItem[];
}

const ProductPageComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ====== Get URL Parameters ======
  const productId = searchParams.get("productId") || "";
  const discountPriceParam = searchParams.get("discountPrice");
  const discountPercentage = searchParams.get("discountPercentage");
  const discountPrice = discountPriceParam ? Number(discountPriceParam) : null;

  // ====== State ======
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<Cart>({ products: [] });
  const [productDetails, setProductDetails] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);
  const [id, setId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [numberOfCartItems, setNumberOfCartItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [productNotFound, setProductNotFound] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);

  // ====== Fetch Product Details ======
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) {
        setError("No product ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${BASE_URL}/products/${productId}`,
          { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data) {
          throw new Error('No data received from API');
        }

        let productData: ApiProductResponse;
        if (response.data["0"]) {
          productData = response.data["0"];
        } else if (response.data.id || response.data._id) {
          productData = response.data;
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          productData = response.data[0];
        } else {
          throw new Error('Invalid data format received from API');
        }

        if (!productData.name || !productData.unitPrice) {
          throw new Error('Missing required product fields');
        }

        const fetched: ProductDetail = {
          id: productData._id,
          name: productData.name,
          subtitle: productData.subtitle,
          unitPrice: productData.unitPrice,
          MRP: productData.MRP,
          averageRating: productData.averageRating || 0,
          numberOfReviews: productData.numberOfReviews || 0,
          statSubus: productData.status,
          imageUrl: productData.imageUrl && productData.imageUrl !== ProductImage2.src
            ? productData.imageUrl : ProductImage2.src,
        };

        setProductDetails(fetched);
        setProductNotFound(false);

      } catch (err: any) {
        console.error("Error fetching product details:", err);

        if (err.response?.status === 404) {
          setProductNotFound(true);
          setError("Product not found");
        } else if (err.code === 'ECONNABORTED') {
          setError("Request timeout - please try again");
        } else if (err.response?.status >= 500) {
          setError("Server error - please try again later");
        } else if (!navigator.onLine) {
          setError("No internet connection");
        } else {
          setError(err.response?.data?.message || err.message || "Failed to load product details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // ====== Fetch Reviews ======
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId || loading || !productDetails) return;

      try {
        const response = await axios.get<Review[]>(
          `${BASE_URL}/reviews/${productId}`,
          { timeout: 8000 }
        );
        setReviews(response.data || []);
      } catch (err) {
        setReviews([]);
      }
    };

    fetchReviews();
  }, [productId, loading, productDetails]);

  // ====== Fetch User Info & Cart ======
  useEffect(() => {
    const fetchUserAndCart = async () => {
      try {
        const response = await axios.get<{ id: string; role: string }>(
          `${BASE_URL}/check-cookie`,
          { withCredentials: true, timeout: 8000 }
        );

        setId(response.data.id);
        setRole(response.data.role);

        if (["Customer", "Company"].includes(response.data.role)) {
          setUserLoggedIn(true);

          try {
            const cartResponse = await axios.get<{ cart: Cart; products: ProductDetail[] }>(
              `${BASE_URL}/cart/${response.data.id}`,
              { timeout: 8000 }
            );

            const cartData: Cart = {
              products: cartResponse.data.cart.products.map((p: any) => ({
                _id: p._id || `cart-item-${Date.now()}-${Math.random()}`,
                productId: p.productId,
                quantity: p.quantity,
                name: p.name,
                subtitle: p.subtitle,
                unitPrice: p.unitPrice,
                MRP: p.MRP,
                averageRating: p.averageRating,
                numberOfReviews: p.numberOfReviews,
                statSubus: p.statSubus,
                imageUrl: p.imageUrl || ProductImage2.src,
              })),
            };

            setCart(cartData);
            setNumberOfCartItems(cartData.products.length);
          } catch {
            setCart({ products: [] });
            setNumberOfCartItems(0);
          }
        } else if (response.data.role === "Vendor") {
          router.push("/vendor");
        } else if (response.data.role === "Admin") {
          router.push("/admin");
        }
      } catch {
        setUserLoggedIn(false);
        setId("");
        setRole("");
      }
    };

    fetchUserAndCart();
  }, [router]);

  // ====== Handlers ======
  const handleIncreaseQuantity = () => setQuantity((prev) => prev + 1);
  const handleDecreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 1) setQuantity(value);
  };

  const addToCart = async () => {
    if (!userLoggedIn) {
      router.push("/login");
      return;
    }

    if (!productDetails) {
      setError("Product details not loaded");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/cart`,
        { productId, userId: id, quantity },
        { withCredentials: true, headers: { "Content-Type": "application/json" }, timeout: 8000 }
      );

      if (response.data.success) {
        setCart((prev) => {
          const existingIndex = prev.products.findIndex((p) => p.productId === productId);
          const newProducts = [...prev.products];

          if (existingIndex >= 0) {
            newProducts[existingIndex].quantity += quantity;
          } else {
            newProducts.push({
              _id: response.data.cartItemId || `cart-item-${Date.now()}`,
              productId,
              quantity,
              name: productDetails.name,
              subtitle: productDetails.subtitle,
              unitPrice: productDetails.unitPrice,
              MRP: productDetails.MRP,
              averageRating: productDetails.averageRating,
              numberOfReviews: productDetails.numberOfReviews,
              statSubus: productDetails.statSubus,
              imageUrl: productDetails.imageUrl,
            });
          }

          setNumberOfCartItems(newProducts.length);
          return { products: newProducts };
        });
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!userLoggedIn) {
      router.push("/login");
      return;
    }
    await addToCart();
  };

  const handleReviewSubmit = async () => {
    if (!userLoggedIn) {
      router.push("/login");
      return;
    }

    if (!userReview.trim() || userRating === 0) {
      setError("Please provide both rating and review");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/reviews`,
        { productId, userId: id, comment: userReview, rating: userRating },
        { timeout: 8000 }
      );

      setReviews((prev) => [...prev, { userName: "You", comment: userReview, rating: userRating }]);
      setUserReview("");
      setUserRating(0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review");
    }
  };

  // ====== Loading State ======
  if (loading) return <Loading />;

  // ====== Error State ======
  if (error && !productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {productNotFound ? "Product Not Found" : "Oops! Something went wrong"}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-[#FDAA1C] text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-all">
              Try Again
            </button>
            <button onClick={() => router.push("/")} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No product data available</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-[#FDAA1C] text-gray-900 font-semibold rounded-xl">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = discountPrice || productDetails.unitPrice;
  const savings = productDetails.MRP - displayPrice;
  const savingsPercent = Math.round((savings / productDetails.MRP) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <Navigation
        cart={cart}
        id={id}
        userLoggedIn={userLoggedIn}
        productsDetail={[{ ...productDetails, imageUrl: productDetails.imageUrl || ProductImage2.src }]}
        numberOfCartItems={numberOfCartItems}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mx-4 mt-24 rounded-r-xl">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Product Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Image Section */}
              <div className="lg:w-1/2 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 sm:p-12 lg:p-16 flex items-center justify-center relative">
                {discountPercentage && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    -{discountPercentage}% OFF
                  </div>
                )}
                <div className="relative w-full max-w-md aspect-square">
                  <Image
                    alt={productDetails.name}
                    src={productDetails.imageUrl || ProductImage2}
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e) => { e.currentTarget.src = ProductImage2.src; }}
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className="lg:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 mb-6">
                  <span className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={() => router.push("/")}>Home</span>
                  <span className="mx-2 text-gray-400">›</span>
                  <span className="text-gray-800 font-medium">{productDetails.name}</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  {productDetails.name}
                </h1>
                <p className="text-xl text-emerald-600 font-semibold mb-6">{productDetails.subtitle}</p>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center">
                    <StarRating onChange={() => { }} rating={productDetails.averageRating} />
                  </div>
                  <span className="text-gray-900 font-bold text-lg">{productDetails.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600">({productDetails.numberOfReviews} reviews)</span>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="text-4xl sm:text-5xl font-bold text-gray-900">Rs. {displayPrice.toLocaleString()}</span>
                    {productDetails.MRP > displayPrice && (
                      <span className="text-xl text-gray-500 line-through">Rs. {productDetails.MRP.toLocaleString()}</span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        🎉 Save Rs. {savings.toLocaleString()} ({savingsPercent}% off)
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${productDetails.statSubus === 'In Stock' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`font-semibold text-lg ${productDetails.statSubus === 'In Stock' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {productDetails.statSubus}
                  </span>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-gray-800 font-semibold text-lg">Quantity:</span>
                  <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                    <button onClick={handleDecreaseQuantity} className="w-14 h-14 flex items-center justify-center text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input value={quantity} onChange={handleQuantityChange} className="w-20 h-14 text-center bg-transparent font-bold text-xl text-gray-900 focus:outline-none" />
                    <button onClick={handleIncreaseQuantity} className="w-14 h-14 flex items-center justify-center text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center py-5 border-t-2 border-gray-200 mb-8">
                  <span className="text-gray-700 text-lg font-medium">Subtotal</span>
                  <span className="text-3xl font-bold text-gray-900">Rs. {(quantity * displayPrice).toLocaleString()}</span>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 mb-8 border border-emerald-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900">Free Eco-Friendly Delivery</p>
                    <p className="text-sm text-emerald-700">On orders over Rs. 5,000</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <button
                    onClick={addToCart}
                    disabled={addingToCart}
                    className="flex-1 py-4 px-6 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 border-2 border-emerald-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl shadow-emerald-200"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-10 bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Reviews & Ratings</h2>
              <p className="text-gray-600 mt-2">{reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-start sm:items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{review.userName}</p>
                        <StarRating onChange={() => { }} rating={review.rating} hoverStar={false} />
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-base">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-800 font-semibold text-lg">No reviews yet</p>
                  <p className="text-gray-600 mt-1">Be the first to share your experience!</p>
                </div>
              )}

              {/* Write Review */}
              {userLoggedIn ? (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 sm:p-8 mt-6 border border-emerald-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Write a Review</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Your Rating</label>
                    <StarRating rating={userRating} hoverStar={true} onChange={setUserRating} />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Your Review</label>
                    <textarea
                      value={userReview}
                      onChange={(e) => setUserReview(e.target.value)}
                      rows={4}
                      className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-gray-900 placeholder-gray-500"
                      placeholder="Share your experience with this product..."
                    />
                  </div>
                  <button
                    onClick={handleReviewSubmit}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg"
                  >
                    Submit Review
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-10 text-center border border-emerald-100">
                  <p className="text-gray-800 text-lg mb-4">Please login to write a review</p>
                  <button onClick={() => router.push("/login")} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg">
                    Login to Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Max />
      <Footer />
    </div>
  );
};

export default function ProductPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductPageComponent />
    </Suspense>
  );
}