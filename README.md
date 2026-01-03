# Buy vs. Rent Calculator

A simple, transparent tool that helps you decide whether it's financially better to buy a home or continue renting and investing the difference. By inputting key financial variables, the app projects your estimated net worth under both scenarios over a chosen time horizon and visually compares the outcomes.

Built for clarity and speed — no accounts, no tracking, no ads. All calculations happen in the browser, and your inputs are saved locally.

## Key Variables

The calculator uses the following user-configurable inputs:

### Core Inputs
- **Home Purchase Price** – The total price of the home you are considering buying.
- **Down Payment Amount** – The upfront cash you put toward the purchase.
- **Mortgage Interest Rate** – Annual interest rate on the mortgage (e.g., 6.5%).
- **Mortgage Term** – Length of the mortgage in years (typically 30 or 15).
- **Home Appreciation Rate** – Expected annual percentage increase in home value.
- **Initial Monthly Rent** – Current or equivalent monthly rent for a comparable property.
- **Annual Rent Increase Rate** – Expected yearly percentage increase in rent.
- **Investment Return Rate** – Expected annual return on investments if you rent instead (e.g., stock market average).
- **Time Horizon** – Number of years to compare the two scenarios.

### Additional Realistic Inputs (with sensible defaults)
- **Closing Costs %** – One-time costs when buying (default: 3% of home price).
- **Selling Costs %** – Costs when selling the home at the end (default: 6% of final home value).
- **Annual Ownership Costs %** – Ongoing costs including property taxes, insurance, and maintenance (default: 1.5% of home price per year).

These inputs allow the tool to model real-world trade-offs accurately while keeping the core experience simple.

## Tech Stack

- **React** – Frontend framework (using Vite for fast development)
- **Tailwind CSS** – Styling and responsive layout
- **LocalStorage** – Persists user inputs between sessions
- **Chart.js** (with react-chartjs-2) – Visualizes net worth growth over time
- Plain JavaScript/TypeScript for all financial calculations (no external APIs)

## Milestones

Here are 5 incremental, testable milestones you can build and see working quickly:

### Milestone 1: Basic Form with Local Storage
- Create a clean form with all input fields (start with the 9 core variables).
- Inputs use controlled components with sensible defaults.
- Save inputs to localStorage on change and load them on page refresh.
- Display all current values below the form in a simple summary card.
- Test: Change values → refresh page → values persist.

### Milestone 2: Core Mortgage and Cash Flow Calculations
- Implement monthly mortgage payment calculation (using the standard formula).
- Calculate monthly ownership cost (mortgage + prorated annual ownership costs).
- Calculate monthly "savings" if renting (ownership cost – rent, adjusted yearly).
- Display key outputs: monthly mortgage payment, monthly rent, monthly difference.
- Test: Input realistic numbers and verify mortgage payment matches an online calculator.

### Milestone 3: Ending Net Worth Projections
- Project both scenarios over the full time horizon:
  - **Buying**: Final home value (with appreciation) + equity from payments – closing/selling costs – cumulative ownership costs.
  - **Renting**: Down payment invested + monthly savings invested, both compounding at the investment return rate.
- Display two big numbers: "Net Worth if Buy" and "Net Worth if Rent" at the end of the horizon.
- Add a clear winner statement (e.g., "Buying builds ~$120k more wealth").
- Test: Try different horizons and rates to confirm results change directionally as expected.

### Milestone 4: Line Chart Comparing Growth Over Time
- Add a line chart showing net worth growth year-by-year for both scenarios.
- Two lines: "Buy" and "Rent" with clear colors and labels.
- Include a crossover point highlight if one scenario overtakes the other.
- Test: Visually confirm the lines match the final net worth numbers from Milestone 3.

### Milestone 5: Polish and Extra Inputs
- Add the three additional inputs (closing costs %, selling costs %, annual ownership costs %) with defaults.
- Place them in a collapsible "Advanced Settings" section to keep the main form clean.
- Add brief tooltips explaining each field.
- Ensure full responsiveness (mobile-friendly layout).
- Test: Full end-to-end — enter data, view chart, adjust advanced settings, see instant updates.

These milestones deliver a functional, insightful tool by Milestone 3, with Milestones 4 and 5 adding visual polish and realism.