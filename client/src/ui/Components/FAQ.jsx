import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What services does Care Now offer?",
    answer:
      "Care Now provides a range of in-home healthcare services including nursing care, physiotherapy, blood tests, medication administration, health assessments, and post-operative care. All services are delivered by certified professionals.",
  },
  {
    question: "How do I pay for the services?",
    answer:
      "We accept various payment methods including credit/debit cards, insurance coverage, and direct billing. Payment is processed securely after your service is completed. Contact our support team for specific insurance inquiries.",
  },
  {
    question: "Is Care Now available in my city?",
    answer:
      "Care Now is rapidly expanding across the country. Enter your location in the app to check availability in your area. If we're not yet in your city, you can join our waitlist to be notified when we arrive.",
  },
  {
    question: "How are healthcare providers vetted?",
    answer:
      "Every provider undergoes rigorous verification including license validation, background checks, credential verification, and ongoing performance reviews. We maintain the highest standards to ensure you receive quality care.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-cream-50">
      <div className="container py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-teal-600 font-medium text-sm tracking-wide uppercase mb-4 block">
            Common Questions
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={faq.question}
                  className={`rounded-xl border transition-colors duration-150 ${
                    isOpen
                      ? "bg-white border-teal-200"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-gray-800 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-teal-600 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-gray-500 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQ;
