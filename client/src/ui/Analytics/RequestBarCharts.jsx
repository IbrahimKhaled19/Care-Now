import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { memo } from "react";
import { tooltipStyle, gridProps, axisProps, tickStyle } from "./chartTheme";

const defaultData = [
  { name: "Jan", completed: 350, cancelled: 50 },
  { name: "Feb", completed: 450, cancelled: 75 },
  { name: "Mar", completed: 500, cancelled: 100 },
  { name: "Apr", completed: 475, cancelled: 80 },
  { name: "May", completed: 525, cancelled: 90 },
  { name: "Jun", completed: 400, cancelled: 60 },
  { name: "Jul", completed: 480, cancelled: 85 },
];

const RequestBarsChart = memo(({ data = defaultData, height = "260px" }) => {
  return (
    <div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            barSize={28}
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} tick={tickStyle} />
            <YAxis {...axisProps} tick={tickStyle} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={tooltipStyle}
            />
            <Bar
              dataKey="completed"
              stackId="a"
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="cancelled"
              stackId="a"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#0d9488]" />
          <span className="text-xs text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" />
          <span className="text-xs text-gray-600">Cancelled</span>
        </div>
      </div>
    </div>
  );
});

export default RequestBarsChart;
