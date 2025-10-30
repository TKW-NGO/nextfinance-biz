import React, { useState, useEffect, useCallback } from 'react';
import Image from "next/image";

// --- MOCK DATA & UTILITIES ---

const mockPortfolio = {
  value: 12534.56,
  todayChange: 153.21,
  todayPercent: 1.24,
  sinceStart: 3450.11,
  sinceStartPercent: 38.45,
};

const initialMockStocks = [
  { id: 'TSLA', name: 'Tesla, Inc.', price: 923.45, change: 10.12, percent: 1.11, held: 5, marketCap: '870B' },
  { id: 'AAPL', name: 'Apple Inc.', price: 175.80, change: -1.50, percent: -0.85, held: 12, marketCap: '2.8T' },
  { id: 'AMZN', name: 'Amazon.com, Inc.', price: 135.20, change: 5.40, percent: 4.16, held: 0, marketCap: '1.4T' },
  { id: 'GOOG', name: 'Alphabet Inc.', price: 2510.99, change: -25.50, percent: -1.01, held: 3, marketCap: '1.7T' },
  { id: 'MSFT', name: 'Microsoft Corp.', price: 340.12, change: 2.10, percent: 0.62, held: 8, marketCap: '2.5T' },
  { id: 'NVDA', name: 'Nvidia Corp.', price: 290.50, change: 8.90, percent: 3.16, held: 0, marketCap: '710B' },
  { id: 'META', name: 'Meta Platforms, Inc.', price: 300.70, change: -0.80, percent: -0.27, held: 2, marketCap: '850B' },
];

const mockNews = [
  { id: 1, title: "TSLA Rises on AI Optimism", source: "MarketWatch", time: "1h ago" },
  { id: 2, title: "Fed Minutes Signal Potential Rate Hike", source: "Bloomberg", time: "2h ago" },
  { id: 3, title: "AAPL Launches New Wearable Tech", source: "TechCrunch", time: "3h ago" },
  { id: 4, title: "AMZN Acquires Logistics Startup", source: "Reuters", time: "4h ago" },
];

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Utility function to get the color class based on change
const getChangeColor = (value: number) => {
  return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
};

// Generates a simple random walk data set for a chart
const generateHistoricalData = (startPrice = 100) => {
  let price = startPrice;
  const data = [];
  for (let i = 0; i < 100; i++) {
    price += (Math.random() - 0.5) * 2;
    data.push({ x: i, y: price });
  }
  return data;
};

// --- ICON COMPONENTS (Inline SVG for reliability) ---
const ArrowIcon = ({ up }: { up: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-4 h-4 inline-block transition-transform duration-300 ${up ? 'text-green-400 rotate-0' : 'text-red-400 rotate-180'}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="12 17 12 4"></polyline>
    <polyline points="7 9 12 4 17 9"></polyline>
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- SIMPLE SVG CHART COMPONENT ---
type ChartPoint = { x: number; y: number };
const SimpleChart = ({ data, color, height = 160 }: { data: ChartPoint[], color: string, height?: number }) => {
  if (!data || data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-gray-500">No data available</div>;

  // Determine min/max values for scaling
  const yValues = data.map(d => d.y);
  const minY = Math.min(...yValues) * 0.95; // 5% buffer
  const maxY = Math.max(...yValues) * 1.05; // 5% buffer
  const rangeY = maxY - minY;
  const numPoints = data.length;

  // Convert data points to SVG path commands
  const pathData = data.map((d, i) => {
    const x = (i / (numPoints - 1)) * 100;
    // Normalize Y value to a 0-100 range, then invert for SVG coordinates
    const yNormalized = ((d.y - minY) / rangeY) * 100;
    const y = 100 - yNormalized;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Placeholder Grid Lines */}
        <path
          d="M0 25 L100 25 M0 50 L100 50 M0 75 L100 75"
          stroke="#374151"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Line Data */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};


// --- 1. HEADER COMPONENT ---
const Header = ({ setSearchQuery }: { setSearchQuery: (query: string) => void }) => {
  const navItems = ['Investing', 'Cash Management', 'Retirement', 'Account'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center">
          <a href="#" className="text-2xl font-extrabold text-green-400 tracking-wider font-inter">
            NextFinance
          </a>
        </div>

        {/* Search Bar */}
        <div className="flex-grow max-w-sm mx-4 md:mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stocks, crypto, and more"
              className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <nav className="flex items-center space-x-4">
          <div className="hidden lg:flex space-x-6">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="text-gray-300 hover:text-green-400 text-sm font-medium transition duration-150"
              >
                {item}
              </a>
            ))}
          </div>

          <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md transition duration-150 transform hover:scale-[1.02]">
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
};

// --- 2. PORTFOLIO VALUE & CHART COMPONENT ---
type Portfolio = typeof mockPortfolio;
const PortfolioOverview = ({ portfolio, chartData, chartColor }: { portfolio: Portfolio, chartData: ChartPoint[], chartColor: string }) => {
  const changeColor = getChangeColor(portfolio.todayChange);

  return (
    <div className="p-6 bg-gray-800/50 rounded-xl shadow-2xl border border-gray-700/50">
      <h2 className="text-3xl font-light text-gray-200 mb-2">Portfolio Value</h2>
      <p className="text-6xl font-extrabold text-white">
        {formatCurrency(portfolio.value)}
      </p>

      {/* Daily Change */}
      <div className={`mt-2 font-medium ${changeColor}`}>
        <span className="text-xl">
          {formatCurrency(portfolio.todayChange)} ({portfolio.todayPercent.toFixed(2)}%)
        </span>
        <span className="text-gray-400 text-lg"> Today</span>
      </div>

      <SimpleChart data={chartData} color={chartColor} height={180} />

      {/* Time Range Selector (Mock interaction) */}
      <div className="flex space-x-4 mt-6 text-sm font-semibold text-gray-400">
        {['1D', '1W', '1M', '3M', '1Y', 'All'].map((time) => (
          <button
            key={time}
            className={`py-1 px-3 rounded-full transition duration-150 ${
              time === '1D'
                ? 'bg-green-600 text-white shadow-lg'
                : 'hover:bg-gray-700'
            }`}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 3. WATCHLIST / STOCKS COMPONENT ---
type Stock = typeof initialMockStocks[0];
const StockRow = ({ stock, onSelect }: { stock: Stock, onSelect: (stock: Stock) => void }) => {
  const changeColor = getChangeColor(stock.change);
  const isPositive = stock.change >= 0;
  const sharesText = stock.held > 0 ? `${stock.held} Shares` : 'Trade';

  return (
    <div
      onClick={() => onSelect(stock)}
      className="flex items-center justify-between py-4 border-b border-gray-700/50 last:border-b-0 transition duration-150 hover:bg-gray-800/20 cursor-pointer px-2 -mx-2 rounded-lg"
    >
      {/* Stock Info */}
      <div className="flex flex-col">
        <span className="text-white font-semibold">{stock.id}</span>
        <span className="text-gray-400 text-xs">{stock.name}</span>
      </div>

      {/* Price and Change */}
      <div className="flex flex-col items-end">
        <span className="text-white font-medium">{formatCurrency(stock.price)}</span>
        <div className={`text-sm ${changeColor} flex items-center`}>
          <span className="inline-block mr-1">
            {isPositive ? '+' : ''}{stock.percent.toFixed(2)}%
          </span>
          <ArrowIcon up={isPositive} />
        </div>
      </div>

      {/* Shares Held / Action Button (Mobile hidden) */}
      <div className="hidden sm:block">
        <button
          className={`px-3 py-1 text-xs rounded-full font-semibold transition duration-150 ${
            stock.held > 0
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {sharesText}
        </button>
      </div>
    </div>
  );
};

const Watchlist = ({ stocks, onSelectStock }: { stocks: Stock[], onSelectStock: (stock: Stock) => void }) => {
  return (
    <div className="mt-8 bg-gray-800/50 p-6 rounded-xl shadow-2xl border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700/50 pb-3">Stocks You Own & Watchlist</h3>
      <div>
        {stocks.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">No results found for your search query.</p>
        ) : (
          stocks.map((stock) => (
            <StockRow key={stock.id} stock={stock} onSelect={onSelectStock} />
          ))
        )}
      </div>
    </div>
  );
};

// --- 4. NEWS/ACTIVITY SIDEBAR ---
type NewsItemType = typeof mockNews[0];
const NewsItem = ({ news }: { news: NewsItemType }) => (
  <div className="py-4 border-b border-gray-700/50 last:border-b-0 cursor-pointer hover:bg-gray-800/20 rounded-md -mx-4 px-4 transition duration-150">
    <p className="text-sm font-medium text-white mb-1 leading-snug">{news.title}</p>
    <div className="flex justify-between text-xs text-gray-400">
      <span>{news.source}</span>
      <span>{news.time}</span>
    </div>
  </div>
);

const Sidebar = ({ news }: { news: NewsItemType[] }) => {
  return (
    <div className="h-full bg-gray-900 md:bg-gray-800/50 p-6 rounded-xl md:shadow-2xl md:border md:border-gray-700/50 mt-8 lg:mt-0">
      <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700/50 pb-3">Latest News</h3>
      <div>
        {news.map((item) => (
          <NewsItem key={item.id} news={item} />
        ))}
      </div>

      <button className="w-full mt-6 text-sm font-semibold text-green-400 hover:text-green-300 transition duration-150 py-2 rounded-lg border border-green-400/50 hover:border-green-300">
        View More News
      </button>
    </div>
  );
};

// --- 5. STOCK DETAIL MODAL COMPONENT ---
const StockDetailModal = ({ stock, onClose }: { stock: Stock, onClose: () => void }) => {
  const isPositive = stock.change >= 0;
  const chartColor = isPositive ? '#34D399' : '#F87171';
  const changeColor = getChangeColor(stock.change);

  // Generate chart data based on the stock's current price
  const [chartData] = useState(generateHistoricalData(stock.price));
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('Buy');

  // Replaced alert with console.log as alerts are discouraged in modern web apps and in Canvas.
  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeAmount || isNaN(parseFloat(tradeAmount))) {
      console.error('Invalid trade amount');
      return;
    }
    const shares = parseFloat(tradeAmount);
    // Simulated trading logic
    console.log(`Simulated Transaction: ${tradeType} ${shares} shares of ${stock.id} at ${formatCurrency(stock.price)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl p-6 md:p-8 overflow-y-auto transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-gray-700/50 pb-4 mb-4">
          <div>
            <h2 className="text-4xl font-extrabold text-white">{stock.id}</h2>
            <p className="text-xl text-gray-400">{stock.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition duration-150 rounded-full p-1"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Price and Chart Section */}
        <div className="mb-6">
          <p className="text-5xl font-bold text-white mb-2">{formatCurrency(stock.price)}</p>
          <div className={`font-medium ${changeColor} text-xl flex items-center`}>
            {formatCurrency(stock.change)} ({stock.percent.toFixed(2)}%) Today
            <ArrowIcon up={isPositive} />
          </div>
          <SimpleChart data={chartData} color={chartColor} height={250} />

          <div className="flex justify-around mt-4 text-gray-400 text-sm font-medium">
            {['1D', '1W', '1M', '3M', '1Y', 'All'].map((time) => (
              <span key={time} className={`py-1 px-3 rounded-full ${time === '1M' ? 'bg-gray-700 text-white' : 'hover:text-white'}`}>
                {time}
              </span>
            ))}
          </div>
        </div>

        {/* Trading Widget */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-2xl font-semibold text-white mb-4">Trade {stock.id}</h3>
          <form onSubmit={handleTrade} className="space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="flex rounded-lg bg-gray-700 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setTradeType('Buy')}
                className={`flex-1 py-2 rounded-lg transition duration-150 ${
                  tradeType === 'Buy' ? 'bg-green-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('Sell')}
                className={`flex-1 py-2 rounded-lg transition duration-150 ${
                  tradeType === 'Sell' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sell
              </button>
            </div>

            {/* Shares/Amount Input */}
            <div>
              <label className="block text-gray-400 mb-1">Shares</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount of shares"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Summary */}
            <div className="flex justify-between text-sm text-gray-300 border-t border-gray-700 pt-4">
              <span>Estimated Cost:</span>
              <span className="font-semibold">{formatCurrency(parseFloat(tradeAmount) * stock.price || 0)}</span>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-bold text-white transition duration-150 shadow-lg ${
                tradeType === 'Buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirm {tradeType} Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function Home() {
  const [portfolio] = useState(mockPortfolio);
  const [stocks] = useState(initialMockStocks);
  const [news] = useState(mockNews);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [chartData] = useState(generateHistoricalData(portfolio.value));

  // Determine chart color based on overall portfolio change
  const chartColor = portfolio.todayChange >= 0 ? '#34D399' : '#F87171';

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock =>
    stock.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectStock = useCallback((stock: Stock) => {
    setSelectedStock(stock);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStock(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading NextFinance Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 font-inter text-gray-100">
      {/* Note: The global font import is typically handled in globals.css/layout.tsx in Next.js, but we'll include the CSS fix in globals.css below */}
      <Header setSearchQuery={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Portfolio & Watchlist) */}
          <div className="lg:col-span-2">
            <PortfolioOverview portfolio={portfolio} chartData={chartData} chartColor={chartColor} />
            <Watchlist stocks={filteredStocks} onSelectStock={handleSelectStock} />
          </div>

          {/* Sidebar (News) */}
          <div className="lg:col-span-1">
            <Sidebar news={news} />
          </div>
        </div>

        {/* Legal/Footer Disclaimer */}
        <div className="mt-12 pt-6 border-t border-gray-700/50 text-xs text-gray-500 text-center">
            <p>
                **Disclaimer:** This is a conceptual trading site replica for demonstration purposes only. The domain 'nextfinance.biz' and all data displayed are fictional. Investing involves risk.
            </p>
        </div>
      </main>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal stock={selectedStock} onClose={handleCloseModal} />
      )}
    </div>
  );
};
