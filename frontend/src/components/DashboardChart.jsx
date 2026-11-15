
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

function DashboardChart({ languageData, totalLanguageBytes }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={languageData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
          >
            {languageData.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => [
              totalLanguageBytes
                ? `${(
                    (value / totalLanguageBytes) *
                    100
                  ).toFixed(1)}%`
                : "0%",
              "Share",
            ]}
            contentStyle={{
              background: "#171b2b",
              border: "1px solid #343b52",
              borderRadius: "10px",
              color: "#fff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="chart-center">
        <strong>{languageData.length}</strong>
        <span>Languages</span>
      </div>
    </div>
  );
}

export default DashboardChart;
