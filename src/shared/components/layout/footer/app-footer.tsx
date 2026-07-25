import { motion } from "motion/react";
import { Github, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { NAVBAR_DATA } from "@/shared/constants/navbarData";
import { APP_NAME } from "@/shared/constants/app";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: "https://github.com", label: "GitHub" },
    { icon: Mail, href: "mailto:hello@example.com", label: "Email" },
  ];

  const footerLinks = [
    {
      title: "Quick Links",
      links: NAVBAR_DATA.map((item) => ({ name: item.title, path: item.link })),
    },
    // {
    //   title: "Legal",
    //   links: [
    //     { name: "Privacy Policy", path: "/privacy" },
    //     { name: "Terms of Service", path: "/terms" },
    //     { name: "Cookie Policy", path: "/cookies" },
    //   ],
    // },
  ];

  return (
    <footer className="w-full bg-primary text-white mt-20 rounded-t-[30px] lg:container lg:mx-auto lg:mb-5 lg:rounded-[40px] lg:px-4">
      <div className="container mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-black mb-4">Logo</h3>
            <p className="text-white/80 mb-4">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos, eligendi.
            </p>
          </motion.div>

          {footerLinks.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="text-lg font-bold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path}>
                      <motion.span
                        className="text-white/80 hover:text-white transition-colors inline-block"
                        whileHover={{ x: 5 }}
                      >
                        {link.name}
                      </motion.span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-lg font-bold mb-4">Connect With Us</h4>
            <div className="flex gap-3 mb-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
            <p className="text-white/80 text-sm">Follow us on social media for updates and news.</p>
          </motion.div>
        </div>

        <motion.div
          className="border-t border-white/20 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/80">
            <p>
              &copy; {currentYear} {APP_NAME}
            </p>
            <p>All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
