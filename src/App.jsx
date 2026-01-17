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
    // Formula: B = P * ((1+r)^n - (1+r)^p) / ((1+r)^n - 1)
    // where P = principal, r = monthly rate, n = total payments, p = payments made
    if (year > 0 && monthlyRate > 0) {
      const paymentsMade = year * 12;
      const remainingPayments = Math.max(0, numPayments - paymentsMade);
      if (remainingPayments > 0) {
        remainingLoanBalance = loanAmount * 
          (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, paymentsMade)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
      } else {
        remainingLoanBalance = 0;
      }
    }
    
    // Selling costs only apply at final year
    const sellingCost = year === values.timeHorizon ? homeValue * (values.sellingCostsPercent / 100) : 0;
    
    // Cumulative ownership costs (property taxes, insurance, maintenance)
    const cumulativeOwnershipCosts = monthlyOwnershipExtra * 12 * year;
    
    // Buy scenario net worth:
    // Home value - remaining loan balance - selling costs - closing costs (paid upfront)
    // Note: Down payment is already equity in the home, so it's included in (homeValue - remainingLoanBalance)
    const buyNet = homeValue - remainingLoanBalance - sellingCost - (year === 0 ? closingCost : 0) - cumulativeOwnershipCosts;
    buyNetWorth.push(Math.round(Math.max(0, buyNet)));

    // Rent scenario: invest down payment + closing costs that would have been spent on buying
    const initialInvestment = values.downPayment + closingCost;
    const investedInitial = initialInvestment * Math.pow(1 + values.investmentReturn / 100, year);
    
    // Calculate yearly savings (difference between ownership cost and rent)
    // Only calculate savings for completed years (year > 0)
    if (year > 0) {
      const yearlySavings = Math.max(0, totalMonthlyOwnership * 12 - currentRent * 12);
      // Compound savings: previous savings plus new savings, all growing at investment return rate
      // This approximates monthly investing by compounding annually
      cumulativeSavings = (cumulativeSavings + yearlySavings) * (1 + values.investmentReturn / 100);
    }
    
    rentNetWorth.push(Math.round(investedInitial + cumulativeSavings));

    if (year < values.timeHorizon) currentRent *= (1 + values.rentIncrease / 100);
  }

  const finalBuy = buyNetWorth[values.timeHorizon];
  const finalRent = rentNetWorth[values.timeHorizon];
  const difference = finalRent - finalBuy;
  const winner = difference > 0 ? 'Rent & Invest' : 'Buy';

  const chartData = {
    labels: years.map(y => `Year ${y}`),
    datasets: [
      { label: 'Buy', data: buyNetWorth, borderColor: '#5171a5', backgroundColor: 'rgba(81, 113, 165, 0.2)', fill: true, tension: 0.4 },
      { label: 'Rent & Invest', data: rentNetWorth, borderColor: '#a9e4ef', backgroundColor: 'rgba(169, 228, 239, 0.2)', fill: true, tension: 0.4 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: '#2d1e2f'
        }
      },
      title: { 
        display: true, 
        text: 'Net Worth Growth Over Time', 
        font: { size: 18 },
        color: '#2d1e2f'
      },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: { 
      x: {
        ticks: { color: '#2d1e2f' },
        grid: { color: 'rgba(45, 30, 47, 0.1)' }
      },
      y: { 
        ticks: { 
          callback: v => '$' + v.toLocaleString(),
          color: '#2d1e2f'
        },
        grid: { color: 'rgba(45, 30, 47, 0.1)' }
      } 
    },
  };

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  return (
    <div className="min-h-screen py-4 px-8" style={{ backgroundColor: '#fff8f0', paddingLeft: '8px', paddingRight: '8px' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#2d1e2f' }}>
          Buy vs. Rent Calculator
        </h1>

        {/* Inputs Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6" style={{ border: '1px solid rgba(169, 228, 239, 0.3)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#2d1e2f', textAlign: 'left' }}>Inputs</h2>

          {/* Core Inputs */}
          <div className="inputs-grid grid gap-4 mb-6">
            {['homePrice', 'downPayment', 'mortgageRate', 'mortgageTerm', 'homeAppreciation', 'initialRent', 'rentIncrease', 'investmentReturn', 'timeHorizon'].map(key => {
              const isCurrency = key.includes('Rent') || key.includes('Price') || key.includes('Payment');
              const isPercentage = key.includes('Rate') || key.includes('Increase') || key.includes('Appreciation') || key.includes('Return');
              const isYears = key.includes('Term') || key.includes('Horizon');
              
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '230px 12px 73px', alignItems: 'center' }}>
                  <label className="text-sm font-medium" style={{ color: '#2d1e2f', textAlign: 'left' }}>
                    {formatLabel(key)}
                    {isPercentage ? ' (%)' : isCurrency ? ' ($)' : ' (years)'}
                  </label>
                  <div></div>
                  <input
                    type="number"
                    step={isPercentage ? '0.1' : '1'}
                    max={isCurrency ? 99999999 : isYears ? 999 : 999}
                    value={values[key]}
                    onChange={handleChange(key)}
                    className="px-3 py-2 rounded-lg focus:outline-none"
                    style={{ 
                      border: '1px solid rgba(81, 113, 165, 0.3)',
                      color: '#2d1e2f',
                      backgroundColor: '#ffffff',
                      width: '73px',
                      textAlign: 'right'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5171a5'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(81, 113, 165, 0.3)'}
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
                color: '#5171a5',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                marginLeft: 0
              }}
              onMouseEnter={(e) => e.target.style.color = '#3d5580'}
              onMouseLeave={(e) => e.target.style.color = '#5171a5'}
            >
              Advanced Settings
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid rgba(169, 228, 239, 0.3)' }}>
                {['closingCostsPercent', 'sellingCostsPercent', 'annualOwnershipPercent'].map(key => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '230px 12px 73px', alignItems: 'center' }}>
                    <label className="text-sm font-medium" style={{ color: '#2d1e2f', textAlign: 'left' }}>
                      {formatLabel(key)} (%)
                    </label>
                    <div></div>
                    <input
                      type="number"
                      step="0.1"
                      max="999"
                      value={values[key]}
                      onChange={handleChange(key)}
                      className="px-3 py-2 rounded-lg focus:outline-none"
                      style={{ 
                        border: '1px solid rgba(81, 113, 165, 0.3)',
                        color: '#2d1e2f',
                        backgroundColor: '#ffffff',
                        width: '73px',
                        textAlign: 'right'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#5171a5'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(81, 113, 165, 0.3)'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Output Cards */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginBottom: '24px', flexWrap: 'nowrap' }}>
            <div 
              style={{ 
                borderRadius: '12px',
                padding: '10px 12px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #5171a5 0%, #3d5580 100%)',
                flex: '0 0 auto',
                width: '160px'
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9, margin: 0 }}>If You Buy</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', marginBottom: 0 }}>${finalBuy.toLocaleString()}</p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, opacity: 0.8 }}>after {values.timeHorizon} years</p>
            </div>
            <div 
              style={{ 
                borderRadius: '12px',
                padding: '10px 12px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #5171a5 0%, #3d5580 100%)',
                border: '2px solid #a9e4ef',
                flex: '0 0 auto',
                width: '160px'
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9, margin: 0 }}>If You Rent & Invest</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', marginBottom: 0 }}>${finalRent.toLocaleString()}</p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, opacity: 0.8 }}>after {values.timeHorizon} years</p>
            </div>
            <div 
              style={{ 
                borderRadius: '12px',
                padding: '10px 12px',
                textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                backgroundColor: difference > 0 ? 'rgba(169, 228, 239, 0.4)' : 'rgba(254, 234, 250, 0.6)',
                border: '2px solid #a9e4ef',
                flex: '0 0 auto',
                width: '160px'
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#2d1e2f', margin: 0 }}>{winner} builds more wealth</p>
              <p style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', marginBottom: 0, color: '#5171a5' }}>
                by ${Math.abs(Math.round(difference)).toLocaleString()}
              </p>
              <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0, color: '#2d1e2f' }}>over {values.timeHorizon} years</p>
            </div>
          </div>

        {/* Chart Below */}
        <div className="bg-white rounded-2xl shadow-xl p-6" style={{ border: '1px solid rgba(169, 228, 239, 0.3)' }}>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;