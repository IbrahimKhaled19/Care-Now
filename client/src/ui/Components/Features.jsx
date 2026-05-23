import { motion } from "motion/react";
import { Stethoscope, Home, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: Stethoscope,
    title: "Qualified Professionals",
    text: "Access a network of highly qualified and verified healthcare professionals.",
    accent: "bg-teal-50 text-teal-700",
  },
  {
    icon: Home,
    title: "At-Home Service",
    text: "Receive personalized care in the comfort and privacy of your own home.",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    text: "Your health data is protected with the highest security standards.",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    icon: Zap,
    title: "Fast Response",
    text: "Get instantly matched with a qualified professional and receive care right when you need it.",
    accent: "bg-amber-50 text-amber-700",
  },
];

function Features() {
  return (
    <section id="features" className="bg-cream-50">
      <div className="container py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-teal-600 font-medium text-sm tracking-wide uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
            Built for your peace of mind
          </h2>
        </motion.div>

        {/* Featured layout: large + 3 smaller */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Large feature card */}
          {(() => {
            const FeaturedIcon = features[0].icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 lg:p-10 border border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl ${features[0].accent} flex items-center justify-center mb-6`}>
                  <FeaturedIcon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {features[0].title}
                </h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-6">
                  {features[0].text}
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Every provider in our network undergoes rigorous verification,
                  including license validation, background checks, and ongoing
                  performance reviews to ensure you receive the best care possible.
                </p>
              </motion.div>
            );
          })()}

          {/* Smaller feature cards */}
          <div className="grid gap-6">
            {features.slice(1).map((feature, idx) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (idx + 1) * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 flex gap-5"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.accent} flex items-center justify-center shrink-0`}>
                    <FeatureIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
