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
  { name: "Blood collection", value: 1.5 },
  { name: "Lab analysis", value: 2.5 },
  { name: "Post-injury rehab", value: 4.0 },
  { name: "Sports rehab", value: 5.5 },
  { name: "Pain management", value: 7.0 },
  { name: "Pediatric PT", value: 8.5 },
  { name: "Mobility assessment", value: 10.0 },
];

const BarsChart = memo(({ data = defaultData, height = "260px" }) => {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
          barSize={28}
        >
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
            tick={tickStyle}
            {...axisProps}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2.5, 5, 7.5, 10]}
            tick={tickStyle}
            {...axisProps}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default BarsChart;
