import { motion } from "motion/react";
import { Heart, Users, Clock } from "lucide-react";

function About() {
  return (
    <section id="about" className="bg-white">
      <div className="container py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <span className="text-teal-600 font-medium text-sm tracking-wide uppercase mb-4 block">
            About Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
            Healthcare that comes to you
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Care Now is a modern healthcare platform designed to bring trusted
            medical services directly to your home. We connect patients with
            certified nurses and professional physiotherapists who provide safe,
            reliable, and compassionate care at the right time and place.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {[
            {
              icon: Heart,
              title: "Compassionate Care",
              text: "Whether you need assistance with blood tests, medication administration, health assessments, or physiotherapy sessions, we ensure a seamless experience from booking to completion.",
            },
            {
              icon: Users,
              title: "Trusted Professionals",
              text: "Our network of verified healthcare providers are background-checked, licensed, and committed to delivering the highest standard of care in the comfort of your home.",
            },
            {
              icon: Clock,
              title: "Always Accessible",
              text: "Our mission is to make healthcare accessible, convenient, and patient-centered because your health should never wait. Book same-day appointments with ease.",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
                <item.icon size={24} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
