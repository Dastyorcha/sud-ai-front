import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NAVBAR_DATA } from "@/shared/constants/navbarData";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { APP_NAME } from "@/shared/constants/app";
import LangSwitcher from "@/shared/custom/lang-switcher";

export default function AppHeader() {
  const [isScrollEnough, setScrollEnough] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleScroll = () => {
    if (window.scrollY <= 70) {
      setScrollEnough(false);
    } else {
      setScrollEnough(true);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrollEnough ? "lg:pt-3" : ""
        }`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
      >
        <motion.div
          className={`mx-auto py-4 px-8 transition-all duration-500 backdrop-blur-sm shadow-lg shadow-primary ${
            isScrollEnough
              ? "container bg-primary/95 rounded-b-[30px] lg:rounded-[60px] shadow-lg"
              : "w-full bg-primary/95 shadow-md"
          }`}
          layout
        >
          <div className="flex items-center justify-between gap-5 container mx-auto">
            <Link to="/">
              <motion.p
                className="text-xl font-black text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {APP_NAME}
              </motion.p>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAVBAR_DATA?.map((item) => (
                <Link key={item.id} to={item.link}>
                  <motion.div
                    className={`relative font-medium transition-colors ${
                      location.pathname === item.link
                        ? "text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.title}
                    {location.pathname === item.link && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                        layoutId="navbar-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <LangSwitcher className="text-white hover:bg-white/10 hover:text-white" />

              <motion.button
                className="md:hidden text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              className="fixed top-20 right-4 left-4 bg-primary rounded-3xl shadow-2xl p-6"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="flex flex-col gap-4">
                {NAVBAR_DATA?.map((item, index) => (
                  <Link key={item.id} to={item.link}>
                    <motion.div
                      className={`p-4 rounded-2xl font-medium transition-all ${
                        location.pathname === item.link
                          ? "bg-white/20 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item.title}
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
