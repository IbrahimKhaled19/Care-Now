import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { memo } from "react";

const defaultData = [
  { name: "Physiotherapy", value: 60 },
  { name: "Nursing", value: 40 },
];

const COLORS = ["#0d9488", "#82a5a5"];

const PieCharts = memo(({ data = defaultData, height = 260 }) => {
  return (
    <div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius="75%"
              outerRadius="100%"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                  cornerRadius={4}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-xs text-gray-600">
              {entry.name} ({entry.value}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PieCharts;
