import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />

        <Area
          type="monotone"
          dataKey="food"
          fill="#86efac"
          stroke="#15803d"
        />

        <Area
          type="monotone"
          dataKey="demand"
          fill="#bfdbfe"
          stroke="#2563eb"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />

        <Bar
          dataKey="value"
          fill="#16a34a"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={95}
          label
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={
                ['#16a34a', '#2563eb', '#f59e0b', '#ef4444'][
                  i % 4
                ]
              }
            />
          ))}
        </Pie>

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MiniLine({ data }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={data}>
        <XAxis dataKey="day" hide />
        <YAxis hide />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="demand"
          stroke="#15803d"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}