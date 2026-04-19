import { useState, useMemo, useCallback } from 'react'
import {
  COMPANY_INFO,
  CONTACT_INFO,
  LOCATION,
  SOCIAL_MEDIA,
  COPYRIGHT_TEXT,
  SECTION_TITLES,
} from '@/constants/footer'
import { getCurrentYear, renderSocialIcon } from '@/utils/footerHelpers'

const Footer = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null)

  const currentYear = useMemo(() => getCurrentYear(), [])

  const createMouseEnterHandler = useCallback(
    (socialName) => () => {
      setHoveredIcon(socialName)
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredIcon(null)
  }, [])

  return (
    <footer className="relative overflow-hidden bg-black text-white pb-20 lg:pb-0 -mt-16 lg:mt-0">
      {/* Modern background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full filter blur-3xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full filter blur-3xl animate-float-gentle"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Top section with company info */}
        <div className="container mx-auto px-4 pt-2 pb-8 lg:pt-8 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Company Brand Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-red-500">
                  {COMPANY_INFO.name}
                </h2>
                <p className="text-slate-300 text-sm font-medium tracking-wide uppercase">
                  {COMPANY_INFO.tagline}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {COMPANY_INFO.description}
                </p>
              </div>

              {/* Social Media Links */}
              <div className="flex space-x-4">
                {SOCIAL_MEDIA.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`w-10 h-10 rounded-full bg-slate-700/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${social.color} hover:bg-slate-600/50 hover:scale-110`}
                    onMouseEnter={createMouseEnterHandler(social.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {renderSocialIcon(social.icon)}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">
                {SECTION_TITLES.contactInfo}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 mt-0.5 text-blue-400">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">{CONTACT_INFO.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 mt-0.5 text-green-400">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    {CONTACT_INFO.whatsapp.map((phone, index) => (
                      <p key={index} className="text-slate-300 text-sm">
                        {phone}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Map */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">
                {SECTION_TITLES.location}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 mt-0.5 text-red-400">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {LOCATION.address.map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < LOCATION.address.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
                  <iframe
                    src={LOCATION.mapEmbedUrl}
                    className="w-full h-48 rounded-lg"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-slate-700/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-center items-center">
              <p className="text-slate-400 text-sm">
                © {currentYear}{' '}
                <span className="text-red-500 font-semibold">
                  {COMPANY_INFO.name}
                </span>
                . {COPYRIGHT_TEXT}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
