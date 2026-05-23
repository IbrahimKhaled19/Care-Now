import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { headerContent } from "../../data/content";
import Button from "../common/Button";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream-50/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/landing_page/logo.png"
            alt="Care Now"
            className="w-12 h-12 object-contain"
          />
          <span className="text-xl font-bold text-teal-800">Care Now</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {headerContent.navlinks.map((link) => (
              <li key={link}>
                <a
                  href={`#${link}`}
                  className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors duration-150 capitalize"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <SignedOut>
            <Link to="/login">
              <Button variant="ghost" className="px-4 py-2 text-sm">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button className="px-4 py-2 text-sm">
                Sign Up
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" className="px-4 py-2 text-sm">
                Dashboard
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-gray-600 hover:text-teal-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden bg-cream-50 border-b border-gray-100 px-6 pb-6"
        >
          <nav>
            <ul className="flex flex-col gap-4">
              {headerContent.navlinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="block py-2 text-base font-medium text-gray-700 hover:text-teal-700 capitalize"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-2 mt-4">
            <SignedOut>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full py-3 text-base">
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up" onClick={() => setMenuOpen(false)}>
                <Button className="w-full py-3 text-base">
                  Sign Up
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                <Button className="w-full py-3 text-base">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>
        </motion.div>
      )}
    </header>
  );
}

export default Header;
