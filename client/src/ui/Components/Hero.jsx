import { motion } from "motion/react";
import Button from "../common/Button";
import { ArrowRight, Shield, Clock, MapPin } from "lucide-react";

function Hero() {
  return (
    <section className="bg-cream-50 overflow-hidden">
      <div className="container py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-6">
              <Shield size={16} />
              Trusted by 10,000+ families
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 leading-tight mb-6">
              Expert care,
              <br />
              <span className="text-teal-600">right at home</span>
            </h1>

            <p className="text-lg text-gray-500 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Skip the waiting rooms. Get personalized healthcare from certified
              nurses and physiotherapists, delivered to your doorstep with
              compassion and professionalism.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button className="px-8 py-4 text-base flex items-center justify-center gap-2">
                Get Started
                <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" className="px-8 py-4 text-base">
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal-500" />
                <span>Same-day booking</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-teal-500" />
                <span>Available nationwide</span>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden bg-teal-100">
              <img
                src="/assets/landing_page/hero.png"
                alt="Care Now healthcare professional providing compassionate home care"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-8 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 max-w-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Shield size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Verified Professionals
                  </p>
                  <p className="text-xs text-gray-500">
                    All providers are background-checked
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
