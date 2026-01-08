'use client';

import React from "react";
import Image from "next/image";
import Profile from "../images/profile5.png";
import Bell from "../images/bell.png";
import LogoutButton from "../../components/Logout";
import axios from "axios";

// ==== Config ====
const BASE_URL = "https://eco-harvest-backend.vercel.app/";

// ==== Types ====
export interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface UserInformation {
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface TopNavigationProps {
  userInformation: UserInformation | null;
  id: string;
  isLoggedIn: boolean;
  notifications: Notification[];
  onMenuClick?: () => void;
}

// ==== Component ====
const TopNavigation: React.FC<TopNavigationProps> = ({
  id,
  isLoggedIn,
  notifications,
  userInformation,
  onMenuClick
}) => {

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(`${BASE_URL}notification/${notificationId}`);
      window.location.reload();
    } catch (err) {
      console.error("Error in deleting notification: ", err);
    }
  };

  return (
    <header className="w-full h-16 lg:h-[68px] flex items-center justify-between px-4 lg:px-6 bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Mobile Logo */}
        <div className="lg:hidden">
          <h2 className="text-lg font-bold text-gray-900">EcoHarvest</h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative group">
          <button className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="absolute hidden group-hover:block right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto z-50">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{notifications.length} new</p>
            </div>

            <div className="divide-y divide-gray-100">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDAA1C] to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
            {userInformation?.firstName?.[0] || 'A'}{userInformation?.lastName?.[0] || ''}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {userInformation?.firstName ?? "Admin"} {userInformation?.lastName ?? ""}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        {/* Logout */}
        {isLoggedIn && (
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavigation;
