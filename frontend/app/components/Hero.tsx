'use client';
import Image from 'next/image';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'https://eco-harvest-backend.vercel.app';

interface Advertisement {
  title: string;
  description: string;
  imageUrl?: string;
}

const Hero: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [advertisement, setAdvertisement] = useState<Advertisement[]>([]);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const response = await axios.get<Advertisement[]>(`${BASE_URL}/advertisement/`);
        setAdvertisement(response.data);
      } catch (error) {
        console.error('Error fetching advertisement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvertisement();
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-transparent rounded-full blur-3xl" />

      {/* Floating Leaves */}
      <div className="absolute top-32 right-20 text-5xl opacity-20 hidden lg:block">🌿</div>
      <div className="absolute bottom-32 left-16 text-4xl opacity-15 hidden lg:block">🍃</div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="h-12 w-3/4 rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse" />
              <div className="h-5 w-full rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse" />
              <div className="h-5 w-2/3 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse" />
              <div className="h-10 w-36 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse mt-4" />
            </div>
            <div className="flex-1 hidden lg:block">
              <div className="w-full max-w-md h-64 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 animate-pulse mx-auto" />
            </div>
          </div>
        ) : advertisement.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Text Content */}
            <div className="flex-1 select-none">
              {/* Eco Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-sm font-bold mb-4 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                🌱 Fresh & Organic
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-snug mb-4">
                <span className="text-gray-900">{advertisement[0].title.split(' ').slice(0, -2).join(' ')} </span>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{advertisement[0].title.split(' ').slice(-2).join(' ')}</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 max-w-xl line-clamp-3">
                {advertisement[0].description}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => router.push('/category')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 
                    text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 
                    flex items-center gap-2 text-base"
                >
                  <span>Shop Now</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/category?categoryName=Organic')}
                  className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl 
                    border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 
                    flex items-center gap-2 text-base shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Categories</span>
                </button>
              </div>

              {/* Trust Badges - Compact */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">100% Organic</p>
                    <p className="text-xs text-gray-500">Certified</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Free Delivery</p>
                    <p className="text-xs text-gray-500">Rs.5000+</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Best Prices</p>
                    <p className="text-xs text-gray-500">Farm Direct</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image - Responsive sizing */}
            <div className="flex-1 flex justify-center">
              {advertisement[0].imageUrl && (
                <div className="relative w-full max-w-sm lg:max-w-md">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-3xl blur-2xl transform scale-105" />

                  <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-emerald-100">
                    <Image
                      alt="Featured Product"
                      className="select-none rounded-2xl object-cover w-full h-auto"
                      src={advertisement[0].imageUrl}
                      width={400}
                      height={300}
                      priority
                    />

                    {/* Floating Badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white 
                      py-2 px-4 rounded-full shadow-lg font-bold text-sm flex items-center gap-1">
                      🌿 Eco Fresh
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🌱</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Welcome to EcoHarvest</h2>
            <p className="text-lg text-gray-600 mb-6">Fresh, organic produce delivered to your doorstep</p>
            <button
              onClick={() => router.push('/category')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 
                text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
