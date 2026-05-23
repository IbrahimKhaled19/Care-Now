import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { memo } from "react";

const PatientSatisfactionLevel = memo(({ satisfaction = 85 }) => {
  const progressAngle = (satisfaction / 100) * 360;

  const data = [
    {
      name: "progress",
      value: satisfaction,
      fill: "#0d9488",
    },
  ];

  return (
    <div className="w-full max-w-[220px] mx-auto py-4">
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="78%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={90 - progressAngle}
              barSize={16}
            >
              <RadialBar dataKey="value" cornerRadius={10} fill="#0d9488" />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">
                {satisfaction}%
              </span>
              <p className="text-xs text-gray-500 mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PatientSatisfactionLevel;
