"use client";

import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Max from "../components/Max";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-toastify";

// Base URL for API
const BASE_URL = "https://eco-harvest-backend.vercel.app";

// ==== Types ====
interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  subtitle: string;
  averageRating: number;
  imageUrl: string;
  MRP: number;
  quantity: number;
  unitPrice: number;
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

interface CartResponse {
  cart: Cart;
  products: Product[];
}

interface AppliedCoupon {
  code: string;
  discount: number;
}

const CheckoutPage: React.FC = () => {
  const [id, setId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({ _id: "", products: [], totalAmount: 0 });
  const [productsDetail, setProductsDetail] = useState<Product[]>([]);
  const [numberOfCartItems, setNumberOfCartItems] = useState<number>(0);
  const [advertisement, setAdvertisement] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash_on_delivery");

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: ""
  });

  const router = useRouter();

  const discount = appliedCoupon?.discount || 0;
  const deliveryFee = cart.totalAmount >= 5000 ? 0 : 250;
  const tax = ((cart.totalAmount - discount) * 0.05);
  const finalTotal = cart.totalAmount - discount + tax + deliveryFee;

  useEffect(() => {
    const fetchAdvertisement = async (): Promise<void> => {
      try {
        const response = await axios.get<Advertisement[]>(`${BASE_URL}/advertisement/`);
        setAdvertisement(response.data);
      } catch (error) {
        console.error("Error fetching advertisement:", error);
      }
    };
    fetchAdvertisement();
  }, []);

  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      setLoading(true);
      try {
        const authResponse = await axios.get<UserData>(`${BASE_URL}/check-cookie/`, { withCredentials: true });

        setId(authResponse.data.id);
        setRole(authResponse.data.role);

        if (authResponse.data.role === "Customer") {
          setUserLoggedIn(true);

          const storedCart = sessionStorage.getItem('checkoutCart');
          const storedProducts = sessionStorage.getItem('checkoutProducts');
          const storedCoupon = sessionStorage.getItem('appliedCoupon');

          if (storedCart && storedProducts) {
            setCart(JSON.parse(storedCart));
            setProductsDetail(JSON.parse(storedProducts));
            setNumberOfCartItems(JSON.parse(storedCart).products.length);

            if (storedCoupon) {
              setAppliedCoupon(JSON.parse(storedCoupon));
            }
          } else {
            try {
              const cartResponse = await axios.get<CartResponse>(`${BASE_URL}/cart/${authResponse.data.id}`);
              setCart(cartResponse.data.cart);
              setProductsDetail(cartResponse.data.products);
              setNumberOfCartItems(cartResponse.data.cart.products.length);
            } catch (err) {
              console.error("Error fetching cart:", err);
              toast.error("Failed to load cart");
              router.push("/cart");
            }
          }
        } else if (authResponse.data.role === "Vendor") {
          router.push("/vendor");
        } else if (authResponse.data.role === "Admin") {
          router.push("/admin");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleCheckout = async (): Promise<void> => {
    if (processing) return;

    if (paymentMethod === "card") {
      if (!cardDetails.cardNumber || !cardDetails.cardHolderName ||
        !cardDetails.expiryDate || !cardDetails.cvv) {
        toast.error("Please fill in all card details");
        return;
      }

      if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error("Invalid card number");
        return;
      }

      if (cardDetails.cvv.length !== 3) {
        toast.error("Invalid CVV");
        return;
      }
    }

    setProcessing(true);

    try {
      const orderResponse = await axios.post(
        `${BASE_URL}/orders/checkout`,
        { cart },
        { withCredentials: true }
      );

      if (orderResponse.status === 200 && orderResponse.data) {
        const orderId = orderResponse.data._id;

        const paymentResponse = await axios.post(
          `${BASE_URL}/payments/initiate`,
          {
            orderId: orderId,
            userId: id,
            paymentMethod: paymentMethod,
            couponCode: appliedCoupon?.code || null
          },
          { withCredentials: true }
        );

        if (paymentResponse.data.success) {
          const paymentId = paymentResponse.data.data._id;

          let paymentDetails: any = { paymentMethod: paymentMethod };

          if (paymentMethod === "card") {
            paymentDetails = {
              ...paymentDetails,
              cardNumber: cardDetails.cardNumber,
              cardHolderName: cardDetails.cardHolderName,
              expiryDate: cardDetails.expiryDate,
              cvv: cardDetails.cvv,
              cardLastFour: cardDetails.cardNumber.slice(-4),
              cardType: cardDetails.cardNumber.startsWith('4') ? 'Visa' : 'MasterCard'
            };
          } else if (paymentMethod === "bank_transfer") {
            paymentDetails.bankName = "Commercial Bank";
            paymentDetails.accountNumber = "XXXX1234";
          }

          const processResponse = await axios.post(
            `${BASE_URL}/payments/process/${paymentId}`,
            paymentDetails,
            { withCredentials: true }
          );

          if (processResponse.data.success && processResponse.data.data.status === 'completed') {
            const receiptResponse = await axios.post(
              `${BASE_URL}/receipts`,
              { paymentId: paymentId },
              { withCredentials: true }
            );

            if (receiptResponse.data.success) {
              toast.success("Payment successful!");

              sessionStorage.removeItem('checkoutCart');
              sessionStorage.removeItem('checkoutProducts');
              sessionStorage.removeItem('appliedCoupon');

              router.push(`/payment-success?receiptId=${receiptResponse.data.data._id}`);
            } else {
              toast.warning("Payment successful but receipt generation failed");
              router.push("/orders");
            }
          } else {
            toast.error(processResponse.data.data.failedReason || "Payment failed. Please try again.");
            setProcessing(false);
          }
        } else {
          toast.error("Failed to initiate payment");
          setProcessing(false);
        }
      } else {
        toast.error("Failed to create order");
        setProcessing(false);
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      const errorMessage = error.response?.data?.message || "Checkout failed. Please try again.";
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: "cash_on_delivery", name: "Cash on Delivery", desc: "Pay when you receive your order", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: "card", name: "Credit / Debit Card", desc: "Visa, MasterCard accepted", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { id: "bank_transfer", name: "Bank Transfer", desc: "Direct bank transfer", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "qr_code", name: "QR Code Payment", desc: "Scan and pay", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
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

      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Checkout</h1>
            <p className="text-lg text-gray-600 mt-2">Complete your order</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Section - Order Items & Payment */}
            <div className="flex-1 space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden">
                <div className="p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <h2 className="text-lg font-bold text-gray-900">Order Items ({cart.products.length})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cart.products.map(item => {
                    const product = productsDetail.find(p => p._id === item.productId);
                    return product ? (
                      <div key={item._id} className="p-4 sm:p-5 flex gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            width={80}
                            height={80}
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.subtitle}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Rs. {product.unitPrice.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            Rs. {(product.unitPrice * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="p-5 space-y-3">
                  {paymentMethods.map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${paymentMethod === method.id
                        ? 'border-[#FDAA1C] bg-orange-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-5 h-5 text-[#FDAA1C] focus:ring-[#FDAA1C]"
                      />
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={method.icon} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}

                  {/* Card Details Form */}
                  {paymentMethod === "card" && (
                    <div className="mt-4 p-5 bg-gray-50 rounded-xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          value={cardDetails.cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '');
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            setCardDetails({ ...cardDetails, cardNumber: formatted });
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FDAA1C] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Holder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.cardHolderName}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FDAA1C] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardDetails.expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setCardDetails({ ...cardDetails, expiryDate: value });
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FDAA1C] focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            maxLength={3}
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FDAA1C] focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Order Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white lg:sticky lg:top-32 shadow-xl">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>Rs. {cart.totalAmount.toLocaleString()}</span>
                  </div>

                  {discount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>- Rs. {discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-300">
                    <span>Tax (5%)</span>
                    <span>Rs. {tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-400' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-emerald-400">Rs. {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing || cart.products.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white disabled:text-gray-400 
                    font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Complete Purchase
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  🔒 Your payment is secure and encrypted
                </p>
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

export default CheckoutPage;