import Navbar from '@/components/Navbar'
import HeroCarousel from '@/components/HeroCarousel'
import AboutExperience from '@/components/AboutExperience'
import RoomsShowcase from '@/components/RoomsShowcase'
import AmenitiesSection from '@/components/AmenitiesSection'
import PhotoGallery from '@/components/PhotoGallery'
import GuestReviewsAndContact from '@/components/GuestReviewsAndContact'
import LocationMapFooter from '@/components/LocationMapFooter'
import ConciergeWidget from '@/components/ConciergeWidget'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroCarousel />
        <AboutExperience />
        <RoomsShowcase />
        <AmenitiesSection />
        <PhotoGallery />
        <GuestReviewsAndContact />
        <LocationMapFooter />
      </main>
      <ConciergeWidget />
    </>
  )
}
