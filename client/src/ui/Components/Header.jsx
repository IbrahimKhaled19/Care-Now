import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { headerContent } from "../../data/content";
import { useTheme } from "../../context/ThemeContext";
import Button from "../common/Button";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-color)]">
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
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-teal-700 transition-colors duration-150 capitalize"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-muted)] hover:text-teal-700"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            className="p-2 text-[var(--text-secondary)] hover:text-teal-700"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-6 pb-6"
        >
          <nav>
            <ul className="flex flex-col gap-4">
              {headerContent.navlinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="block py-2 text-base font-medium text-[var(--text-primary)] hover:text-teal-700 capitalize"
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
