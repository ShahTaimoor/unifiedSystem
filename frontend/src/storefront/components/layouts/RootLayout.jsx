import React, { useEffect } from 'react'
import Navbar from '../custom/Navbar'
import BottomNavigation from '../custom/BottomNavigation'
import Footer from '../custom/Footer'
import { useIsMobile } from '../../hooks/use-mobile'
import AuthDrawer from '../custom/AuthDrawer'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCompanyInfo } from '../../redux/slices/company/companySlice'

const RootLayout = ({ children }) => {
    const isMobile = useIsMobile()
    const dispatch = useDispatch()
    const { info: companyInfo } = useSelector((state) => state.company)

    useEffect(() => {
        dispatch(fetchCompanyInfo())
    }, [dispatch])

    // Update document title and favicon dynamically
    useEffect(() => {
        if (companyInfo?.companyName) {
            document.title = companyInfo.companyName;
            
            // Update favicon if logo exists
            if (companyInfo.logo) {
                const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                link.type = 'image/x-icon';
                link.rel = 'shortcut icon';
                link.href = companyInfo.logo;
                document.getElementsByTagName('head')[0].appendChild(link);
            }
        }
    }, [companyInfo]);
    
    return (
        <>
            <Navbar />
            <main className={`min-h-screen ${isMobile ? 'pb-20' : 'pt-16'}`}>
                {children}
            </main>
            <Footer />
            <BottomNavigation />
            <AuthDrawer />
        </>
    )
}

export default RootLayout
