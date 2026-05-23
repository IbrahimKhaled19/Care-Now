import { useState } from "react";
import { headerContent } from "../../data/content";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";

function NavBar() {
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav>
      <ul className="items-center gap-8 hidden lg:flex">
        {headerContent.navlinks.map((link) => (
          <li key={link}>
            <a
              className={`text-sm font-medium transition-colors duration-150 capitalize ${
                active === link
                  ? "text-teal-700"
                  : "text-gray-600 hover:text-teal-700"
              }`}
              onClick={() => setActive(link)}
              href={`#${link}`}
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      <div className="block lg:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-600 hover:text-teal-700"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px]"
          >
            <ul className="flex flex-col gap-2">
              {headerContent.navlinks.map((link) => (
                <li key={link}>
                  <a
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors duration-150 ${
                      active === link
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setActive(link);
                      setMenuOpen(false);
                    }}
                    href={`#${link}`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
