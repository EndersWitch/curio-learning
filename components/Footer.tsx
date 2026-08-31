import Bloom from '@/components/Bloom'
import { Facebook, Instagram } from '@/components/icons'

const FACEBOOK_URL = 'https://www.facebook.com/share/18qLm3rkG3/'
const INSTAGRAM_URL = 'https://www.instagram.com/curiolearning.co.za?igsh=MXU0MXExdDE5NDR2cQ=='

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-col-title">Study</div>
          <a href="/papers">Papers</a>
          <a href="/quiz">Quiz</a>
          <a href="/subjects">Subjects</a>
          <a href="/deeplearn">Deep Learn</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Account</div>
          <a href="/login">Log In / Sign Up</a>
          <a href="/profile">My Profile</a>
          <a href="/subscription">Subscription</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Support</div>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Follow Us</div>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><Facebook size={15} /> Facebook</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram size={15} /> Instagram</a>
        </div>
      </div>
      <div className="footer-divider" />
      <div className="footer-bottom">
        <a href="/" className="footer-logo">
          <Bloom size={20} />
          curio
        </a>
        <p className="footer-copy">© 2026 Curio Learning · Made with love for SA students</p>
      </div>
    </footer>
  )
}
