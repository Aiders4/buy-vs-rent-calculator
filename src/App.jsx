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
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TOOLTIPS = {
  homePrice: 'Total purchase price of the property you\'re considering',
  downPayment: 'Amount paid upfront, reducing the size of your mortgage',
  mortgageRate: 'Annual interest rate charged on your mortgage loan',
  mortgageTerm: 'How long you have to repay the mortgage in full',
  homeAppreciation: 'Expected annual increase in your home\'s market value',
  initialRent: 'Your current monthly rent payment',
  rentIncrease: 'Expected annual increase in your rent, typically tied to inflation',
  investmentReturn: 'Expected annual return if you invest savings in the market instead of buying',
  timeHorizon: 'How long you plan to stay before selling or moving — longer horizons tend to favour buying',
  closingCostsPercent: 'One-time fees at purchase (legal, appraisal, etc.) as a percentage of home price',
  sellingCostsPercent: 'Fees when selling (agent commission, transfer taxes) as a percentage of sale price',
  annualOwnershipPercent: 'Yearly costs beyond the mortgage (property tax, insurance, maintenance) as a percentage of home value',
};

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

  // Closing costs are paid at purchase (year 0)
  const closingCost = values.homePrice * (values.closingCostsPercent / 100);
  
  const years = Array.from({ length: values.timeHorizon + 1 }, (_, i) => i);
  const buyNetWorth = [];
  const rentNetWorth = [];

  let currentRent = values.initialRent;
  let cumulativeSavings = 0;
  let remainingLoanBalance = loanAmount;

  for (let year = 0; year <= values.timeHorizon; year++) {
    // Calculate home value with appreciation
    const homeValue = values.homePrice * Math.pow(1 + values.homeAppreciation / 100, year);
    
    // Calculate remaining loan balance after payments
    if (year > 0) {
      const paymentsMade = year * 12;
      if (paymentsMade >= numPayments) {
        remainingLoanBalance = 0;
      } else if (monthlyRate > 0) {
        // Standard amortization formula: B = P * ((1+r)^n - (1+r)^p) / ((1+r)^n - 1)
        remainingLoanBalance = loanAmount *
          (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, paymentsMade)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
      } else {
        // 0% interest: balance decreases linearly
        remainingLoanBalance = loanAmount * (1 - paymentsMade / numPayments);
      }
    }
    
    // Selling costs only apply at final year
    const sellingCost = year === values.timeHorizon ? homeValue * (values.sellingCostsPercent / 100) : 0;

    // Buy scenario net worth:
    // Home equity minus selling costs. Ownership costs (taxes, insurance, maintenance) are not
    // deducted here — they are accounted for on the rent side as part of the differential savings
    // the renter can invest. Closing costs are similarly captured by the renter's initial investment.
    const buyNet = homeValue - remainingLoanBalance - sellingCost;
    buyNetWorth.push(Math.round(Math.max(0, buyNet)));

    // Rent scenario: invest down payment + closing costs that would have been spent on buying
    const initialInvestment = values.downPayment + closingCost;
    const investedInitial = initialInvestment * Math.pow(1 + values.investmentReturn / 100, year);
    
    // Calculate yearly savings (difference between ownership cost and rent)
    // Only calculate savings for completed years (year > 0)
    if (year > 0) {
      const yearlySavings = totalMonthlyOwnership * 12 - currentRent * 12;
      // Compound savings: previous savings plus new savings, all growing at investment return rate
      // This approximates monthly investing by compounding annually
      // Savings can be negative when rent exceeds buying costs, reducing the renter's portfolio
      cumulativeSavings = (cumulativeSavings + yearlySavings) * (1 + values.investmentReturn / 100);
      currentRent *= (1 + values.rentIncrease / 100);
    }

    rentNetWorth.push(Math.round(investedInitial + cumulativeSavings));
  }

  const finalBuy = buyNetWorth[values.timeHorizon];
  const finalRent = rentNetWorth[values.timeHorizon];
  const difference = finalRent - finalBuy;
  const winner = difference > 0 ? 'Rent & Invest' : 'Buy';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const chartData = {
    labels: years.map(y => isMobile ? `Yr ${y}` : `Year ${y}`),
    datasets: [
      { label: 'Buy', data: buyNetWorth, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.15)', fill: true, tension: 0.4 },
      { label: 'Rent & Invest', data: rentNetWorth, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: true, tension: 0.4 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1f2937',
          font: { size: isMobile ? 11 : 12 }
        }
      },
      title: {
        display: true,
        text: 'Net Worth Growth Over Time',
        font: { size: isMobile ? 14 : 18 },
        color: '#1f2937'
      },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: {
      x: {
        ticks: {
          color: '#1f2937',
          font: { size: isMobile ? 10 : 12 },
          maxRotation: isMobile ? 45 : 0,
        },
        grid: { color: 'rgba(31, 41, 55, 0.1)' }
      },
      y: {
        ticks: {
          callback: v => {
            if (isMobile && v >= 1000) return '$' + (v / 1000).toLocaleString() + 'k';
            return '$' + v.toLocaleString();
          },
          color: '#1f2937',
          font: { size: isMobile ? 10 : 12 },
          maxTicksLimit: isMobile ? 6 : 8,
        },
        grid: { color: 'rgba(31, 41, 55, 0.1)' }
      }
    },
  };

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  return (
    <div className="min-h-screen py-4 px-8" style={{ backgroundColor: '#fff8f0', paddingLeft: '8px', paddingRight: '8px' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center" style={{ color: '#1f2937', marginBottom: '24px' }}>
          Buy vs. Rent Calculator
        </h1>

        {/* Inputs Section */}
        <div className="card-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h2 className="font-semibold" style={{ color: '#1f2937', textAlign: 'left', fontSize: '26px', marginTop: 0, marginBottom: '8px' }}>Inputs</h2>

          {/* Core Inputs */}
          <div className="inputs-grid grid mb-6">
            {['homePrice', 'downPayment', 'mortgageRate', 'mortgageTerm', 'homeAppreciation', 'initialRent', 'rentIncrease', 'investmentReturn', 'timeHorizon'].map(key => {
              const isCurrency = key.includes('Rent') || key.includes('Price') || key.includes('Payment');
              const isPercentage = key.includes('Rate') || key.includes('Increase') || key.includes('Appreciation') || key.includes('Return');
              const isYears = key.includes('Term') || key.includes('Horizon');
              
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '230px 12px 73px', alignItems: 'center' }}>
                  <label className="font-medium" style={{ color: '#1f2937', textAlign: 'left', fontSize: '15px' }}>
                    {formatLabel(key)}
                    {isPercentage ? ' (%)' : isCurrency ? ' ($)' : ' (years)'}
                    <span className="tooltip-trigger" data-tooltip={TOOLTIPS[key]}>&#9432;</span>
                  </label>
                  <div></div>
                  <input
                    type="number"
                    step={isPercentage ? '0.1' : '1'}
                    max={isCurrency ? 99999999 : isYears ? 999 : 999}
                    value={values[key]}
                    onChange={handleChange(key)}
                    className="input-field"
                  />
                </div>
              );
            })}
          </div>

          {/* Advanced Settings */}
          <div style={{ textAlign: 'left' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-base font-medium mb-4"
              style={{ 
                color: '#2563eb',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                marginLeft: 0
              }}
              onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.color = '#2563eb'}
            >
              Advanced Settings
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                {['closingCostsPercent', 'sellingCostsPercent', 'annualOwnershipPercent'].map(key => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '230px 12px 73px', alignItems: 'center' }}>
                    <label className="font-medium" style={{ color: '#1f2937', textAlign: 'left', fontSize: '15px' }}>
                      {formatLabel(key).replace(' Percent', '')} (%)
                      <span className="tooltip-trigger" data-tooltip={TOOLTIPS[key]}>&#9432;</span>
                    </label>
                    <div></div>
                    <input
                      type="number"
                      step="0.1"
                      max="999"
                      value={values[key]}
                      onChange={handleChange(key)}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Output Cards */}
        <div className="result-cards">
            <div
              className="result-card"
              style={{
                borderRadius: '16px',
                padding: '16px 20px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                backgroundColor: '#2563eb',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', opacity: 0.9, margin: 0 }}>If You Buy</p>
              <p style={{ fontSize: isMobile ? '42px' : '24px', fontWeight: '600', marginTop: '4px', marginBottom: 0 }}>${finalBuy.toLocaleString()}</p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, opacity: 0.8 }}>after {values.timeHorizon} years</p>
            </div>
            <div
              className="result-card"
              style={{
                borderRadius: '16px',
                padding: '16px 20px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                backgroundColor: '#10b981',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', opacity: 0.9, margin: 0 }}>If You Rent & Invest</p>
              <p style={{ fontSize: isMobile ? '42px' : '24px', fontWeight: '600', marginTop: '4px', marginBottom: 0 }}>${finalRent.toLocaleString()}</p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, opacity: 0.8 }}>after {values.timeHorizon} years</p>
            </div>
            <div
              className="result-card"
              style={{
                borderRadius: '16px',
                padding: '16px 20px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.03)',
                backgroundColor: difference > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                border: difference > 0 ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{winner} builds more wealth</p>
              <p style={{ fontSize: isMobile ? '46px' : '26px', fontWeight: '700', marginTop: '4px', marginBottom: 0, color: difference > 0 ? '#10b981' : '#2563eb' }}>
                by ${Math.abs(Math.round(difference)).toLocaleString()}
              </p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, color: '#1f2937' }}>over {values.timeHorizon} years</p>
            </div>
          </div>

        {/* Chart Below */}
        <div className="card-panel chart-section">
          <div className="chart-height">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;