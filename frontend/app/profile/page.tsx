"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";

// Base URL for API requests
const BASE_URL = "/api/proxy";

const ProfilePage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get<{ id: string; role: string }>(
          `${BASE_URL}/check-cookie/`,
          { withCredentials: true }
        );

        if (response.data.role === "Customer") {
          // Redirect to account page for profile management
          router.push("/account");
        } else if (response.data.role === "Vendor") {
          router.push("/vendor");
        } else if (response.data.role === "Admin") {
          router.push("/admin");
        }
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#FDAA1C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  );
};

export default ProfilePage;
