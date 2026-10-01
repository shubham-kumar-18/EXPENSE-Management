import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Chart = ({ type, data, options }) => {
  if (type === "pie") {
    return <Pie data={data} options={options} />;
  }
  return <Bar data={data} options={options} />;
};

export default Chart;
