import { motion } from "motion/react";
import { ListChecks, MapPin, Sparkles } from "lucide-react";

const steps = [
  {
    icon: ListChecks,
    title: "Choose Service",
    text: "Select the healthcare service you need, such as nursing care or physiotherapy.",
  },
  {
    icon: MapPin,
    title: "Set Location",
    text: "Enter your location to find qualified professionals in your area.",
  },
  {
    icon: Sparkles,
    title: "Get Matched",
    text: "Our app instantly matches you with a qualified professional ready to provide care.",
  },
];

function HowItWorks() {
  return (
    <section id="how it works" className="bg-white">
      <div className="container py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-teal-600 font-medium text-sm tracking-wide uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
            How it works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              {/* Step number */}
              <div className="relative inline-flex mb-6">
                <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center">
                  <step.icon size={32} className="text-teal-600" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
