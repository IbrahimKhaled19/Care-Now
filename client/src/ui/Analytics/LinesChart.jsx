import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { memo } from "react";
import { tooltipStyle, gridProps, axisProps, tickStyle } from "./chartTheme";

const formatK = (value) => `${value / 1000}K`;
const formatRequests = (value) => [`${value} requests`, undefined];

const defaultLines = [
  { dataKey: "total", name: "Total Requests", stroke: "#82a5a5" },
  { dataKey: "completed", name: "Completed", stroke: "#0d9488" },
  { dataKey: "cancelled", name: "Cancelled", stroke: "#ef4444" },
];

const defaultData = [
  { name: "Jan", cancelled: 20, completed: 400, total: 600 },
  { name: "Feb", cancelled: 25, completed: 500, total: 800 },
  { name: "Mar", cancelled: 30, completed: 600, total: 850 },
  { name: "Apr", cancelled: 40, completed: 700, total: 1000 },
  { name: "May", cancelled: 35, completed: 750, total: 1050 },
  { name: "Jun", cancelled: 45, completed: 800, total: 1100 },
  { name: "Jul", cancelled: 40, completed: 750, total: 1000 },
  { name: "Aug", cancelled: 35, completed: 800, total: 1050 },
  { name: "Sep", cancelled: 30, completed: 850, total: 1100 },
  { name: "Oct", cancelled: 25, completed: 900, total: 1050 },
  { name: "Nov", cancelled: 30, completed: 850, total: 1000 },
  { name: "Dec", cancelled: 35, completed: 900, total: 1100 },
];

const LinesChart = memo(
  ({
    data = defaultData,
    height = "320px",
    lines = defaultLines,
  }) => {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} tick={tickStyle} />
            <YAxis {...axisProps} tick={tickStyle} tickFormatter={formatK} />
            <Tooltip formatter={formatRequests} contentStyle={tooltipStyle} />
            <Legend
              align="center"
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
            />
            {lines.map((lineProps) => (
              <Line
                key={lineProps.dataKey}
                type="monotone"
                dot={false}
                strokeWidth={2}
                {...lineProps}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

export default LinesChart;
