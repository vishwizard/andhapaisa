import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockChart = ({ data, label = "Price", color = "rgb(99, 102, 241)" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No chart data available
      </div>
    );
  }

  const isPositive =
    data.length >= 2 && data[data.length - 1].close >= data[0].close;

  const lineColor = color || (isPositive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)");
  const bgColor = isPositive
    ? "rgba(16, 185, 129, 0.1)"
    : "rgba(239, 68, 68, 0.1)";

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label,
        data: data.map((d) => d.close),
        borderColor: lineColor,
        backgroundColor: bgColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#f1f5f9",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748b",
          maxTicksLimit: 8,
          maxRotation: 0,
          font: { size: 11 },
        },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: {
          color: "#64748b",
          callback: (val) => `$${val.toFixed(0)}`,
          font: { size: 11 },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-72 md:h-80">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockChart;