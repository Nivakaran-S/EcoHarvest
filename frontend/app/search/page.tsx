"use client";
import React, { Suspense, useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Max from "../components/Max";
import Product from "../components/Product";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSearchParams } from "next/navigation";

const BASE_URL = "https://eco-harvest-backend.vercel.app";

interface ProductData {
  _id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
  unitPrice: number;
}

interface CartItem {
  _id: string;
  quantity: number;
}

interface Cart {
  products: CartItem[];
}

const SearchPage: React.FC = () => {
  const searchParams = useSearchParams();
  const categoryName = searchParams.get("category") || "";
  const query = searchParams.get("query") || "";

  const [id, setId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({ products: [] });
  const [searchProducts, setSearchProducts] = useState<ProductData[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("Featured");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const response = await axios.get<{ id: string; role: string }>(
          `${BASE_URL}/check-cookie/`,
          { withCredentials: true }
        );

        setId(response.data.id);
        setRole(response.data.role);

        if (response.data.role === "Customer") {
          setUserLoggedIn(true);
          try {
            const response2 = await axios.get<Cart>(
              `${BASE_URL}/cart/${response.data.id}`
            );
            setCart(response2.data);
          } catch (err) {
            console.error("Error fetching cart items:", err);
          }
        } else if (response.data.role === "Vendor") {
          router.push("/vendor");
        } else if (response.data.role === "Admin") {
          router.push("/admin");
        }
      } catch (error) {
        setUserLoggedIn(false);
      }
    };

    fetchCookies();
  }, [router]);

  useEffect(() => {
    const handleSearch = async () => {
      setLoading(true);
      try {
        const categoryNe = categoryName === "All Categories" ? "" : categoryName;
        const response = await axios.post<ProductData[]>(`${BASE_URL}/products/search`, {
          searchTerm: query,
          categoryN: categoryNe,
        });
        setSearchProducts(response.data);
        setProductCount(response.data.length);
      } catch (err) {
        console.error("Error searching products:", err);
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  }, [categoryName, query]);

  // Filter sidebar content component
  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Category
        </h3>
        <div className="space-y-2">
          {["All Categories", "Daily Grocery", "Drinks", "Tea and Coffee", "Snacks", "Organic"].map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-emerald-50 transition-colors">
              <input
                type="radio"
                name="category"
                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                defaultChecked={cat === (categoryName || "All Categories")}
              />
              <span className="text-sm text-gray-700 group-hover:text-emerald-700 font-medium">{cat}</span>
            </label>
          ))}
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
        <input
          type="range"
          min="0"
          max="10000"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-sm font-medium text-emerald-700 mt-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <span>Rs. 0</span>
          <span>—</span>
          <span>Rs. 10,000</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Brands
        </h3>
        <div className="space-y-2">
          {["Anchor", "Nestle", "Ambewela", "Elephant House", "Ceylon Tea"].map((brand) => (
            <label key={brand} className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-emerald-700 font-medium">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Customer Reviews */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Customer Reviews
        </h3>
        {[5, 4, 3, 2, 1].map((stars) => (
          <label key={stars} className="flex items-center gap-3 cursor-pointer group py-2 px-2 rounded-xl hover:bg-emerald-50 transition-colors">
            <input
              type="radio"
              name="rating"
              className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
            />
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">& up</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <Navigation
        cart={cart}
        id={id}
        userLoggedIn={userLoggedIn}
        productsDetail={[]}
        numberOfCartItems={cart.products.length}
      />

      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3">
              {query ? `Search results for "${query}"` : 'All Products'}
            </h1>
            <p className="text-lg text-gray-600">
              <span className="text-emerald-600 font-semibold">{productCount}</span> {productCount === 1 ? 'product' : 'products'} found
              {categoryName && categoryName !== "All Categories" && ` in ${categoryName}`}
            </p>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="md:hidden flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl 
              text-sm font-semibold text-white mb-6 hover:from-emerald-700 hover:to-teal-700 transition-all w-full justify-center shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter & Sort
          </button>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 sticky top-32">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </h2>
                <FilterContent />
              </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {showFilters && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setShowFilters(false)}
                />
                <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white z-50 md:hidden overflow-y-auto shadow-2xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <FilterContent />
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl mt-8 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              {/* Sort Bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 px-5 py-4 mb-6 flex items-center justify-between">
                <span className="text-gray-700 font-medium hidden sm:block">
                  Showing <span className="text-emerald-600 font-semibold">{productCount}</span> results
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="font-semibold text-gray-900 bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                  >
                    <option>Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Highest Rated</option>
                    <option>Newest</option>
                  </select>
                </div>
              </div>

              {/* Products */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-emerald-100 p-4 animate-pulse shadow-sm">
                      <div className="aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl mb-4" />
                      <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-3" />
                      <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                    </div>
                  ))}
                </div>
              ) : searchProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {searchProducts.map((product) => (
                    <Product
                      key={product._id}
                      id={product._id}
                      title={product.name}
                      imageUrl={product.imageUrl}
                      subtitle={product.subtitle}
                      unitPrice={product.unitPrice}
                      discounts={[]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-emerald-100 shadow-sm">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                  <p className="text-gray-600 mb-8">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => router.push("/")}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                  >
                    Browse All Products
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

function Search(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}

export default Search;