import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  LineChart as ReLineChart,
  Line,
  Legend,
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

type Datum = { name: string; value: number };

export const DonutChart: React.FC<{ data: Datum[]; colors?: string[]; title?: string }> = ({
  data,
  colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
  title,
}) => {
  return (
    <div className="rounded-xl bg-white p-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={6}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const HorizontalBarChart: React.FC<{ data: Datum[]; colors?: string[]; title?: string }> = ({
  data,
  colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
  title,
}) => {
  return (
    <div className="rounded-xl bg-white p-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={data} margin={{ left: 12, right: 12, top: 6, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis type="number" tick={{ fill: "#64748b" }} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#0f172a" }} width={140} />
            <Tooltip formatter={(value: number) => `${value}`} />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={colors[idx % colors.length]} />
              ))}
              <LabelList dataKey="value" position="right" formatter={(val: number) => `${val}`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DonutChart;

export const LineTrendChart: React.FC<{ data: { name: string; value: number }[]; title?: string }> = ({ data, title }) => {
  return (
    <div className="rounded-xl bg-white p-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <ReLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#0f172a" }} />
            <Tooltip formatter={(v: number) => v} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MultiLineChart: React.FC<{
  data: Array<Record<string, any>>;
  series: { key: string; color?: string; label?: string }[];
  title?: string;
}> = ({ data, series, title }) => {
  return (
    <div className="rounded-xl bg-white p-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <ReLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#0f172a" }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label || s.key}
                stroke={s.color || "#ef4444"}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const RadarChart: React.FC<{
  data: { subject: string; A: number }[];
  title?: string;
}> = ({ data, title }) => {
  return (
    <div className="rounded-xl bg-white p-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <ReRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#0f172a" }} />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
            <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
            <Tooltip />
          </ReRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
