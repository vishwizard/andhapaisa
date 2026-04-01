import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#a855f7",
];

const PortfolioPieChart = ({ holdings }) => {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No holdings to display
      </div>
    );
  }

  const data = {
    labels: holdings.map((h) => h.symbol),
    datasets: [
      {
        data: holdings.map((h) => h.currentValue || h.totalInvested),
        backgroundColor: COLORS.slice(0, holdings.length),
        borderColor: "#0f172a",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#94a3b8",
          padding: 15,
          usePointStyle: true,
          pointStyleWidth: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#f1f5f9",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${ctx.label}: $${ctx.parsed.toFixed(2)} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default PortfolioPieChart;