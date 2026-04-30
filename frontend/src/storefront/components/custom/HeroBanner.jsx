import React from 'react';
import { Link } from 'react-router-dom';
import { useStorefrontSettings } from '../../contexts/StorefrontSettingsContext';

const HeroBanner = () => {
  const { heroTitle, heroSubtitle } = useStorefrontSettings();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-800/20 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between py-8 lg:py-12 gap-6 lg:gap-10">
          {/* Left — Text Content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              Wholesale Dealers — Pakistan
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">
              {heroTitle || 'Premium Car Accessories'}
            </h1>
            <p className="text-base sm:text-lg text-gray-300 mb-5 max-w-lg mx-auto lg:mx-0">
              {heroSubtitle
                ? heroSubtitle
                : 'Quality auto parts & accessories at unbeatable wholesale prices. Fast delivery across Pakistan.'}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="#products"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop Now
              </a>
              <a
                href="https://wa.me/923114000096?text=Hi%20I%20want%20to%20order%20car%20accessories"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              >
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Order
              </a>
            </div>
          </div>

          {/* Right — Stats */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full lg:w-auto max-w-xs mx-auto lg:mx-0">
            {[
              { label: 'Products', value: '500+', icon: '📦' },
              { label: 'Brands', value: '50+', icon: '🏷️' },
              { label: 'Orders', value: '10K+', icon: '✅' },
              { label: 'Delivery', value: 'Fast', icon: '🚚' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors duration-200"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="relative h-8 lg:h-10">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full"
        >
          <path d="M0,40 C360,0 1080,40 1440,20 L1440,40 Z" fill="white" />
        </svg>
      </div>
    </div>
  );
};

export default HeroBanner;
