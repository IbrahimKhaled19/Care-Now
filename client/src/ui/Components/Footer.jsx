import { motion } from "motion/react";
import { Facebook, Twitter, Linkedin, ArrowRight } from "lucide-react";
import Button from "../common/Button";

function Footer() {
  return (
    <footer>
      {/* CTA Section */}
      <section className="bg-teal-700">
        <div className="container py-16 lg:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-teal-100 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Quality healthcare is always within reach. Get the support you need
              from trusted professionals right at your doorstep.
            </p>
            <Button
              variant="secondary"
              className="px-8 py-4 text-base bg-white text-teal-700 border-white hover:bg-teal-50 flex items-center justify-center gap-2 mx-auto"
            >
              Download Now
              <ArrowRight size={18} />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="bg-teal-800">
        <div className="container py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Care Now
              </h3>
              <p className="text-teal-200 text-sm leading-relaxed max-w-sm">
                An on-demand healthcare platform connecting patients with
                licensed nurses and physical therapists for safe, timely, and
                personalized in-home care.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-teal-700 text-teal-200 hover:bg-teal-600 hover:text-white flex items-center justify-center transition-colors duration-150"
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Get Started
              </h4>
              <ul className="space-y-3">
                {["Services", "FAQ", "Terms & Conditions", "Privacy Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-teal-200 hover:text-white transition-colors duration-150"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-3">
                {["About Us", "Help Center", "Careers", "Contact"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-teal-200 hover:text-white transition-colors duration-150"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-teal-700 mt-10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-teal-300">
              <p>&copy; {new Date().getFullYear()} CareNow. All rights reserved.</p>
              <div className="mt-3 md:mt-0 flex gap-4">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

export default Footer;
