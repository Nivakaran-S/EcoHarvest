"use client";

import { FiHome, FiBox, FiShoppingCart, FiBarChart2, FiUser, FiX } from "react-icons/fi";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();

  const navItems = [
    { href: "/vendor", icon: FiHome, label: "Dashboard" },
    { href: "/vendor/products", icon: FiBox, label: "Products" },
    { href: "/vendor/orders", icon: FiShoppingCart, label: "Orders" },
    { href: "/vendor/analysis", icon: FiBarChart2, label: "Analytics" },
    { href: "/vendor/profile", icon: FiUser, label: "Profile" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 lg:w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">EcoHarvest</h2>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Vendor Portal</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all cursor-pointer
                  ${isActive
                    ? "bg-[#FDAA1C] text-gray-900 shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }
                `}>
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Need Help?</p>
            <a href="#" className="text-sm text-[#FDAA1C] hover:text-yellow-400 font-medium transition-colors">
              Contact Support →
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
