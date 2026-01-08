"use client";
import React, { Suspense, useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Max from "../components/Max";
import Product from "../components/Product";
import Image from "next/image";
import Star from "../images/log.png";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Loading from "../components/Loading";

// API base
const BASE_URL = "https://eco-harvest-backend.vercel.app";

// --- Interfaces ---
interface Product {
  _id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  unitPrice: number;
  rating?: number;
  averageRating?: number;
  category?: string;
  productCategory_id?: string;
  brand?: string;
  MRP?: number;
  numberOfReviews?: number;
}

interface Category {
  _id: string;
  name: string;
}

interface ProductCategory {
  _id: string;
  name: string;
}

interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  products: CartItem[];
  totalAmount: number;
}

interface Discount {
  _id: string;
  productId: { _id: string };
  percentage: number;
  status: boolean;
  startDate: string;
  endDate: string;
}

interface UserData {
  id: string;
  role: string;
}

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("categoryName") || "All Categories";

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Mobile filters state
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Filters
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>("Featured");

  // Cart & user
  const [id, setId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart | undefined>(undefined);
  const [productsDetail, setProductsDetail] = useState<Product[]>([]);
  const [numberOfCartItems, setNumberOfCartItems] = useState<number>(0);

  // --- Fetch cookies (user login state) ---
  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const response = await axios.get<UserData>(`${BASE_URL}/check-cookie/`, {
          withCredentials: true,
        });

        setId(response.data.id);
        setRole(response.data.role);

        if (["Customer", "Company"].includes(response.data.role)) {
          setUserLoggedIn(true);
        } else if (response.data.role === "Vendor") {
          router.push("/vendor");
        } else if (response.data.role === "Admin") {
          router.push("/admin");
        }
      } catch {
        setUserLoggedIn(false);
      }
    };
    fetchCookies();
  }, [router]);

  // --- Fetch cart ---
  useEffect(() => {
    const fetchCart = async () => {
      if (!userLoggedIn || !id) return;
      try {
        const response = await axios.get<{ cart: Cart; products: Product[] }>(
          `${BASE_URL}/cart/${id}`
        );
        setCart(response.data.cart);
        setProductsDetail(response.data.products);
        setNumberOfCartItems(response.data.cart.products.length);
      } catch {
        setCart(undefined);
      }
    };
    fetchCart();
  }, [id, userLoggedIn]);

  // --- Fetch categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ProductCategory[]>(`${BASE_URL}/productcategories/`);
        setProductCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // --- Fetch products ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url;
        if (categoryId && categoryId !== "") {
          url = `${BASE_URL}/products/category/${categoryId}`;
        } else {
          url = `${BASE_URL}/products`;
        }

        const response = await axios.get<Product[]>(url);
        setProducts(response.data);

        if (response.data.length > 0) {
          const prices = response.data.map((p) => p.unitPrice || 0);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setMinPrice(min);
          setMaxPrice(max);
          setPriceRange([min, max]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  // --- Fetch discounts ---
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get<Discount[]>(`${BASE_URL}/api/discount/`);
        setDiscounts(response.data);
      } catch (error) {
        console.error("Error fetching discounts", error);
      }
    };
    fetchDiscounts();
  }, []);

  // --- Filtering + Sorting ---
  useEffect(() => {
    const filtered = products.filter(
      (p) =>
        p.unitPrice >= priceRange[0] &&
        p.unitPrice <= priceRange[1] &&
        (!selectedBrands.length || selectedBrands.includes(p.brand || "")) &&
        (p.averageRating || p.rating || 0) >= minRating
    );

    switch (sortOption) {
      case "Price: Low to High":
        filtered.sort((a, b) => a.unitPrice - b.unitPrice);
        break;
      case "Price: High to Low":
        filtered.sort((a, b) => b.unitPrice - a.unitPrice);
        break;
      case "Highly Rated":
        filtered.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
        break;
    }

    setSortedProducts(filtered);
  }, [products, priceRange, selectedBrands, minRating, sortOption]);

  // --- Handlers ---
  const handleCategoryClick = (selectedCategoryId: string, selectedCategoryName: string) => {
    router.push(`/category?categoryId=${selectedCategoryId}&categoryName=${encodeURIComponent(selectedCategoryName)}`);
    setShowMobileFilters(false);
  };

  const handleAllCategoriesClick = () => {
    router.push(`/category?categoryName=All%20Categories`);
    setShowMobileFilters(false);
  };

  // Filter component (reusable for both desktop and mobile)
  const FiltersContent = () => (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Category
        </h3>
        <div className="space-y-1">
          {categoriesLoading ? (
            <div className="text-gray-500 text-sm animate-pulse">Loading categories...</div>
          ) : (
            <>
              <button
                className={`w-full text-left cursor-pointer text-sm py-2.5 px-4 rounded-xl transition-all ${(!categoryId || categoryName === "All Categories")
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md"
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                onClick={handleAllCategoriesClick}
              >
                All Categories
              </button>

              {productCategories.map((category) => (
                <button
                  key={category._id}
                  className={`w-full text-left cursor-pointer text-sm py-2.5 px-4 rounded-xl transition-all ${categoryId === category._id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  onClick={() => handleCategoryClick(category._id, category.name)}
                >
                  {category.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Price Range
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Min Price</label>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-full accent-emerald-600 h-2 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Max Price</label>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full accent-emerald-600 h-2 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-sm font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 p-3 rounded-xl border border-emerald-100">
            <span>Rs. {priceRange[0].toLocaleString()}</span>
            <span>—</span>
            <span>Rs. {priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Customer Reviews
        </h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              className={`w-full flex items-center cursor-pointer p-3 rounded-xl transition-all ${minRating === star
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'hover:bg-emerald-50 text-gray-700'
                }`}
              onClick={() => setMinRating(minRating === star ? 0 : star)}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={idx} className={`w-4 h-4 ${idx < star ? (minRating === star ? 'text-yellow-300' : 'text-yellow-400') : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className={`ml-2 text-sm font-medium ${minRating === star ? 'text-white' : ''}`}>& Up</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <Navigation
        numberOfCartItems={numberOfCartItems}
        productsDetail={productsDetail}
        cart={cart}
        id={id}
        userLoggedIn={userLoggedIn}
      />

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl z-50 overflow-y-auto md:hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FiltersContent />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full mt-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden md:block w-72 flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 sticky top-32">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </h2>
                <FiltersContent />
              </div>
            </aside>

            {/* Products Section */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 px-5 py-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <p className="text-gray-800 font-medium">
                    <span className="text-2xl font-bold text-emerald-600">{sortedProducts.length}</span>
                    <span className="ml-2">products found</span>
                  </p>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="md:hidden flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-white border-2 border-gray-200 text-gray-900 font-medium rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer flex-1 sm:flex-none"
                  >
                    <option>Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Highly Rated</option>
                  </select>
                </div>
              </div>

              {/* Category Title */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  {categoryName}
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Explore our eco-friendly collection</p>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => (
                    <Product
                      key={product._id}
                      id={product._id}
                      title={product.name}
                      subtitle={product.subtitle}
                      unitPrice={product.unitPrice}
                      imageUrl={product.imageUrl}
                      averageRating={product.averageRating}
                      discounts={discounts}
                      numberOfReviews={product.numberOfReviews}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-xl text-gray-800 font-semibold mb-2">No products found</p>
                    <p className="text-gray-600">Try adjusting your filters or explore other categories</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Max />
      <Footer />
    </div>
  );
};

function Category(): React.JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <CategoryPage />
    </Suspense>
  );
}

export default Category;