import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { ChevronDown, ChevronUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DEFAULT_VALUES = {
  homePrice: 500000,
  downPayment: 100000,
  mortgageRate: 6.5,
  mortgageTerm: 30,
  homeAppreciation: 3,
  initialRent: 2500,
  rentIncrease: 3,
  investmentReturn: 7,
  timeHorizon: 10,
  closingCostsPercent: 3,
  sellingCostsPercent: 6,
  annualOwnershipPercent: 1.5,
};

function App() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem('buyVsRentInputs');
    if (saved) {
      try {
        return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_VALUES;
      }
    }
    return DEFAULT_VALUES;
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    localStorage.setItem('buyVsRentInputs', JSON.stringify(values));
  }, [values]);

  const handleChange = (key) => (e) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // Calculations
  const loanAmount = Math.max(0, values.homePrice - values.downPayment);
  const monthlyRate = values.mortgageRate / 100 / 12;
  const numPayments = values.mortgageTerm * 12;
  const monthlyMortgage = monthlyRate > 0
    ? loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const monthlyOwnershipExtra = (values.homePrice * values.annualOwnershipPercent) / 100 / 12;
  const totalMonthlyOwnership = monthlyMortgage + monthlyOwnershipExtra;

  const years = Array.from({ length: values.timeHorizon + 1 }, (_, i) => i);
  const buyNetWorth = [];
  const rentNetWorth = [];

  let currentRent = values.initialRent;
  let cumulativeSavings = 0;

  for (let year = 0; year <= values.timeHorizon; year++) {
    const homeValue = values.homePrice * Math.pow(1 + values.homeAppreciation / 100, year);
    const sellingCost = year === values.timeHorizon ? homeValue * (values.sellingCostsPercent / 100) : 0;
    const closingCost = year === values.timeHorizon ? values.homePrice * (values.closingCostsPercent / 100) : 0;
    const cumulativeExtra = monthlyOwnershipExtra * 12 * year;

    const buyNet = homeValue - loanAmount - sellingCost - closingCost - cumulativeExtra + values.downPayment;
    buyNetWorth.push(Math.round(Math.max(0, buyNet)));

    const investedDown = values.downPayment * Math.pow(1 + values.investmentReturn / 100, year);
    const yearlySavings = Math.max(0, totalMonthlyOwnership * 12 - currentRent * 12);
    cumulativeSavings = (cumulativeSavings + yearlySavings) * (1 + values.investmentReturn / 100);
    rentNetWorth.push(Math.round(investedDown + cumulativeSavings));

    if (year < values.timeHorizon) currentRent *= (1 + values.rentIncrease / 100);
  }

  const finalBuy = buyNetWorth[values.timeHorizon];
  const finalRent = rentNetWorth[values.timeHorizon];
  const difference = finalRent - finalBuy;
  const winner = difference > 0 ? 'Rent & Invest' : 'Buy';

  const chartData = {
    labels: years.map(y => `Year ${y}`),
    datasets: [
      { label: 'Buy', data: buyNetWorth, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.2)', fill: true, tension: 0.4 },
      { label: 'Rent & Invest', data: rentNetWorth, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.2)', fill: true, tension: 0.4 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Net Worth Growth Over Time', font: { size: 18 } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } },
  };

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Buy vs. Rent Calculator
        </h1>

        {/* Inputs at the top */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6">Inputs</h2>

          {/* Core Inputs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {['homePrice', 'downPayment', 'mortgageRate', 'mortgageTerm', 'homeAppreciation', 'initialRent', 'rentIncrease', 'investmentReturn', 'timeHorizon'].map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatLabel(key)}
                  {key.includes('Rate') || key.includes('Increase') ? ' (%)' : key.includes('Rent') || key.includes('Price') || key.includes('Payment') ? ' ($)' : ' (years)'}
                </label>
                <input
                  type="number"
                  step={key.includes('Rate') || key.includes('Increase') ? '0.1' : '1'}
                  value={values[key]}
                  onChange={handleChange(key)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-lg font-medium text-blue-600 hover:text-blue-800 mb-4"
            >
              Advanced Settings
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showAdvanced && (
              <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                {['closingCostsPercent', 'sellingCostsPercent', 'annualOwnershipPercent'].map(key => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatLabel(key)} (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={values[key]}
                      onChange={handleChange(key)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Below */}
        <div className="space-y-12">
          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Final Numbers */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-10 text-white text-center shadow-xl">
              <p className="text-xl font-medium opacity-90">If You Buy</p>
              <p className="text-5xl font-bold mt-4">${finalBuy.toLocaleString()}</p>
              <p className="text-lg mt-4 opacity-80">after {values.timeHorizon} years</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-10 text-white text-center shadow-xl">
              <p className="text-xl font-medium opacity-90">If You Rent & Invest</p>
              <p className="text-5xl font-bold mt-4">${finalRent.toLocaleString()}</p>
              <p className="text-lg mt-4 opacity-80">after {values.timeHorizon} years</p>
            </div>
          </div>

          {/* Winner */}
          <div className={`text-center py-12 px-8 rounded-2xl shadow-2xl ${difference > 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
            <p className="text-3xl font-bold text-gray-800">{winner} builds more wealth</p>
            <p className={`text-6xl font-extrabold mt-6 ${difference > 0 ? 'text-green-600' : 'text-blue-600'}`}>
              by ${Math.abs(Math.round(difference)).toLocaleString()}
            </p>
            <p className="text-xl text-gray-600 mt-6">over {values.timeHorizon} years</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;