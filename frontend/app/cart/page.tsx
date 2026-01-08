"use client";

import Footer from "../components/Footer";
import Max from "../components/Max";
import Navigation from "../components/Navigation";
import Image from "next/image";
import ProductImage from "../images/product.png";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";

// Base URL for API
const BASE_URL = "https://eco-harvest-backend.vercel.app";

// Interfaces
interface CartItem {
  _id: string;
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface ProductDetail {
  _id: string;
  name: string;
  unitPrice: number;
  status: string;
  imageUrl: string;
  subtitle: string;
}

interface Cart {
  _id: string;
  products: CartItem[];
  totalAmount: number;
}

interface Advertisement {
  title: string;
  description: string;
  imageUrl: string;
}

interface UserData {
  id: string;
  role: string;
}

interface CouponValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    discountAmount: number;
    finalAmount: number;
    coupon: any;
  };
}

const CartPage: React.FC = () => {
  const [id, setId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({ _id: "", products: [], totalAmount: 0 });
  const [productsDetail, setProductsDetail] = useState<ProductDetail[]>([]);
  const [updateBtnVisible, setUpdateBtnVisible] = useState<boolean>(false);
  const [advertisement, setAdvertisement] = useState<Advertisement[]>([]);
  const [numberOfCartItems, setNumberOfCartItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  const router = useRouter();

  // Calculate delivery fee based on order amount
  const deliveryFee = cart.totalAmount >= 5000 ? 0 : 250;
  const tax = ((cart.totalAmount - discount) * 0.05);
  const finalTotal = cart.totalAmount - discount + tax + deliveryFee;

  // Fetch advertisements
  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const response = await axios.get<Advertisement[]>(`${BASE_URL}/advertisement/`);
        setAdvertisement(response.data);
      } catch (error) {
        console.error("Error fetching advertisement:", error);
      }
    };
    fetchAdvertisement();
  }, []);

  // Check cookie and fetch cart
  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const response = await axios.get<UserData>(`${BASE_URL}/check-cookie/`, { withCredentials: true });
        setId(response.data.id);
        setRole(response.data.role);

        if (response.data.role === "Customer") {
          setUserLoggedIn(true);
          try {
            const cartResponse = await axios.get<{ cart: Cart; products: ProductDetail[] }>(
              `${BASE_URL}/cart/${response.data.id}`
            );
            setCart(cartResponse.data.cart);
            setProductsDetail(cartResponse.data.products);
            setNumberOfCartItems(cartResponse.data.cart.products.length);
          } catch (err) {
            setUserLoggedIn(false);
            router.push("/");
          }
        } else if (response.data.role === "Vendor") {
          router.push("/vendor");
        } else if (response.data.role === "Admin") {
          router.push("/admin");
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchCookies();
  }, [router]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await axios.post<CouponValidationResponse>(
        `${BASE_URL}/coupons/validate`,
        {
          code: couponCode,
          orderAmount: cart.totalAmount,
          products: cart.products
        },
        { withCredentials: true }
      );

      if (response.data.success && response.data.data) {
        setAppliedCoupon(response.data.data.coupon);
        setDiscount(response.data.data.discountAmount);
        toast.success(`Coupon applied! You saved Rs. ${response.data.data.discountAmount.toFixed(2)}`);
      } else {
        toast.error(response.data.message || "Invalid coupon code");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to apply coupon";
      toast.error(errorMessage);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  // Checkout
  const handleCheckout = async () => {
    if (userLoggedIn) {
      try {
        sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
        sessionStorage.setItem('checkoutProducts', JSON.stringify(productsDetail));
        if (appliedCoupon) {
          sessionStorage.setItem('appliedCoupon', JSON.stringify({
            code: appliedCoupon.code,
            discount: discount
          }));
        } else {
          sessionStorage.removeItem('appliedCoupon');
        }
        router.push("/checkout");
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to proceed to checkout");
      }
    } else {
      router.push("/login");
    }
  };

  // Update cart quantity
  const handleUpdateCart = async (cartId: string, productId: string, quantity: number) => {
    try {
      await axios.post(`${BASE_URL}/cart/update/`, {
        cartId,
        productId,
        updatedQuantity: quantity,
      });
      setUpdateBtnVisible(false);

      const cartResponse = await axios.get<{ cart: Cart; products: ProductDetail[] }>(
        `${BASE_URL}/cart/${id}`
      );
      setCart(cartResponse.data.cart);
      setProductsDetail(cartResponse.data.products);

      toast.success("Cart updated successfully");

      if (appliedCoupon) {
        handleApplyCoupon();
      }
    } catch (err) {
      console.error("Error updating cart:", err);
      toast.error("Failed to update cart");
    }
  };

  // Delete product
  const handleDeleteProduct = async (cartId: string, productId: string) => {
    try {
      const response = await axios.post(`${BASE_URL}/cart/delete/`, {
        cartId,
        productId
      });

      if (response.status === 200) {
        setCart((prevCart) => {
          const newProducts = prevCart.products.filter((p) => p.productId !== productId);
          if (newProducts.length === 0) {
            router.push("/");
            return prevCart;
          }
          const newTotal = newProducts.reduce((total, item) => {
            const product = productsDetail.find((p) => p._id === item.productId);
            return total + (product ? product.unitPrice * item.quantity : 0);
          }, 0);
          return {
            ...prevCart,
            products: newProducts,
            totalAmount: newTotal,
          };
        });
        toast.success("Product removed from cart");

        if (appliedCoupon) {
          setTimeout(() => handleApplyCoupon(), 500);
        }
      }
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Failed to remove product. Please try again.");
    }
  };

  // Quantity helpers
  const handleIncreaseQuantity = (itemId: string) => updateQuantityInternal(itemId, 1);
  const handleDecreaseQuantity = (itemId: string) => updateQuantityInternal(itemId, -1);

  const updateQuantityInternal = (itemId: string, change: number) => {
    setCart((prevCart) => {
      const updatedProducts = prevCart.products.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
      );
      const updatedTotal = updatedProducts.reduce((total, item) => {
        const product = productsDetail.find((p) => p._id === item.productId);
        return total + (product ? product.unitPrice * item.quantity : 0);
      }, 0);
      return { ...prevCart, products: updatedProducts, totalAmount: updatedTotal };
    });
    setUpdateBtnVisible(true);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart((prev) => {
      const updatedProducts = prev.products.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      const updatedTotal = updatedProducts.reduce((total, item) => {
        const product = productsDetail.find((p) => p._id === item.productId);
        return total + (product ? product.unitPrice * item.quantity : 0);
      }, 0);
      return { ...prev, products: updatedProducts, totalAmount: updatedTotal };
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation
        numberOfCartItems={numberOfCartItems}
        productsDetail={productsDetail}
        cart={cart}
        id={id}
        userLoggedIn={userLoggedIn}
      />

      <main className="pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Advertisement Banner */}
          {advertisement.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl overflow-hidden shadow-lg mb-8">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-6 sm:p-8 text-white">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                    {advertisement[0]?.title}
                  </h2>
                  <p className="text-emerald-100 text-sm sm:text-base">
                    {advertisement[0]?.description}
                  </p>
                </div>
                <div className="w-full sm:w-48 lg:w-64 h-40 sm:h-auto flex items-center justify-center p-4">
                  <Image
                    src={advertisement[0]?.imageUrl || ProductImage}
                    width={180}
                    height={140}
                    alt="Advertisement"
                    className="rounded-xl object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Shopping Cart
            <span className="text-lg font-normal text-gray-500 ml-3">
              ({cart.products.length} {cart.products.length === 1 ? 'item' : 'items'})
            </span>
          </h1>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Cart Items Section */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {cart.products.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {cart.products.map((item) => {
                      const product = productsDetail.find((p) => p._id === item.productId);
                      if (!product) return null;
                      return (
                        <div key={item._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Product Image */}
                            <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                              <Image
                                alt={product.name}
                                src={product.imageUrl || ProductImage}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">{product.subtitle}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      Rs. {product.unitPrice.toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {product.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-gray-900">
                                    Rs. {(product.unitPrice * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex flex-wrap items-center gap-3 mt-4">
                                <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => handleDecreaseQuantity(item.id)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <input
                                    value={item.quantity}
                                    onChange={(e) => {
                                      setUpdateBtnVisible(true);
                                      updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1));
                                    }}
                                    className="w-12 h-10 text-center bg-transparent font-semibold text-gray-900 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleIncreaseQuantity(item.id)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>

                                {updateBtnVisible && (
                                  <button
                                    onClick={() => handleUpdateCart(cart._id, product._id, item.quantity)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                                  >
                                    Update
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteProduct(cart._id, product._id)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h3>
                    <p className="text-gray-600 mb-8">Add some items to get started!</p>
                    <button
                      onClick={() => router.push("/")}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Section */}
            {cart.products.length > 0 && (
              <div className="w-full lg:w-96 flex-shrink-0">
                <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 lg:sticky lg:top-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">Rs. {cart.totalAmount.toLocaleString()}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="font-medium">- Rs. {discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>Tax (5%)</span>
                      <span className="font-medium">Rs. {tax.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                        {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                      </span>
                    </div>

                    {deliveryFee === 0 && (
                      <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        🎉 You qualify for free delivery!
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>Rs. {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Coupon Section */}
                  <div className="mb-6">
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-green-800">Coupon Applied!</p>
                            <p className="text-xs text-green-600">{appliedCoupon.code}</p>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <input
                          className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm 
                            focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 uppercase placeholder:normal-case transition-all"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={validatingCoupon}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black disabled:from-gray-400 disabled:to-gray-500 
                            text-white text-sm font-semibold rounded-xl transition-all"
                        >
                          {validatingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold 
                        rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold 
                        rounded-xl transition-colors border border-emerald-200"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    🔒 Secure checkout powered by SSL
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Max />
      <Footer />
    </div>
  );
};

export default CartPage;