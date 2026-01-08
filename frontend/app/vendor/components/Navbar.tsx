"use client";

import { useState, useEffect } from "react";
import { FiBell, FiPlus, FiLogOut, FiMenu } from "react-icons/fi";
import ProductModal from "./ProductModal";

const BASE_URL = "/api/proxy";

interface ProductData {
  name: string;
  subtitle: string;
  quantity: number | string;
  unitPrice: number | string;
  MRP: number | string;
  imageUrl: string;
  category: string;
  productCategory_id: string;
  status: string;
}

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("Vendor");

  useEffect(() => {
    const fetchVendorId = async () => {
      try {
        const res = await fetch(`${BASE_URL}/check-cookie`, {
          credentials: "include",
        });

        const data: { id: string; role: string } = await res.json();
        if (!res.ok || data.role !== "Vendor") {
          throw new Error("Not a vendor or unauthorized");
        }

        const userId = data.id;
        const userRes = await fetch(`${BASE_URL}/vendors/${userId}`, {
          credentials: "include",
        });
        const userData: any[] = await userRes.json();
        if (!userRes.ok || !userData[1]?.entityId) {
          throw new Error("User entityId (vendorId) not found");
        }

        const vendorEntityId = userData[1].entityId;
        const vendorInfo = userData[0];

        setVendorId(vendorEntityId);
        setVendorName(vendorInfo?.businessName || "Vendor");
        localStorage.setItem("vendorId", vendorEntityId);
      } catch (err) {
        console.error("Error fetching vendor ID:", err);
      }
    };

    fetchVendorId();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("vendorId");
        window.location.href = "/login";
      } else {
        alert("Logout failed!");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddProduct = async (productData: ProductData, resetForm: () => void) => {
    if (!vendorId) {
      setToastMessage("Vendor ID not found. Please try again.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const fullProductData = {
      ...productData,
      vendorId,
      quantity: Number(productData.quantity),
      unitPrice: Number(productData.unitPrice),
      MRP: Number(productData.MRP),
    };

    try {
      const response = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullProductData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const newProduct = await response.json();
      console.log("Product created successfully:", newProduct);

      setToastMessage("Product added successfully!");
      resetForm();
      setIsModalOpen(false);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Error creating product:", err);
      setToastMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="relative">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-white shadow-sm border-b border-gray-200">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiMenu size={24} />
            </button>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
              Welcome back, <span className="text-[#FDAA1C]">{vendorName}</span>
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">Manage your products and orders</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className="bg-[#FDAA1C] hover:bg-yellow-500 text-gray-900 px-3 sm:px-4 py-2 rounded-xl flex items-center font-medium transition-all shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>

          <button className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors relative">
            <FiBell size={20} className="text-gray-600" />
          </button>

          <button
            className="p-2.5 bg-gray-100 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${toastMessage.includes('Error')
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
          }`}>
          {toastMessage}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProduct}
        toastMessage={toastMessage}
      />
    </div>
  );
};

export default Navbar;
