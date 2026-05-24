import { useState } from "react";
import { Stethoscope, Users } from "lucide-react";
import Button from "../ui/common/Button";

export default function RolePicker({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const roles = [
    { id: "provider", label: "Healthcare Provider", desc: "I provide care services", icon: Stethoscope },
    { id: "patient", label: "Patient", desc: "I need care services", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome to Care Now</h1>
        <p className="text-sm text-gray-500 mb-8">Select your role to get started</p>

        <div className="space-y-3 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const active = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors cursor-pointer text-left ${
                  active
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
                }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-teal-700" : "text-gray-800"}`}>{role.label}</p>
                  <p className="text-xs text-gray-500">{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          disabled={!selected}
          onClick={() => onSelect(selected)}
          className="w-full py-2.5"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
