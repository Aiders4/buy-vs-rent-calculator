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
- **CSS** – Custom styling and responsive layout
- **LocalStorage** – Persists user inputs between sessions
- **Chart.js** (with react-chartjs-2) – Visualizes net worth growth over time
- Plain JavaScript for all financial calculations (no external APIs)