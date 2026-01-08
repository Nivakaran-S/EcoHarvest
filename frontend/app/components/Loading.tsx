import Image from "next/image"
import EcoHarvestLogo from "../images/ecoHarvestLogo.png"

const Loading = () => {
    return(
        <div className="flex flex-col justify-center items-center h-[100vh] w-[100vw] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-[#FDAA1C]/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#22C55E]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Logo with Glow */}
            <div className="relative z-10">
                <div className="absolute inset-0 bg-[#FDAA1C]/30 rounded-full blur-2xl animate-pulse" />
                <Image 
                    src={EcoHarvestLogo} 
                    alt="EcoHarvest Logo" 
                    className="h-64 w-64 md:h-80 md:w-80 relative z-10 animate-float drop-shadow-2xl"
                    priority
                />
            </div>
            
            {/* Loading Text */}
            <div className="mt-8 text-center relative z-10">
                <p className="text-white text-xl font-medium mb-4" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                    Preparing your experience
                </p>
                
                {/* Premium Loading Bar */}
                <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-[#FDAA1C] via-[#22C55E] to-[#FDAA1C] rounded-full animate-shimmer" 
                         style={{ backgroundSize: '200% 100%' }}
                    />
                </div>
                
                {/* Dots Animation */}
                <div className="flex justify-center gap-2 mt-4">
                    <span className="w-2 h-2 bg-[#FDAA1C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#FDAA1C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#FDAA1C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>

            {/* Tagline */}
            <p className="absolute bottom-8 text-gray-500 text-sm tracking-wider">
                Fresh • Organic • Sustainable
            </p>
        </div>
    )
}

export default Loading 