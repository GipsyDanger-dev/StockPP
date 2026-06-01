import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketSummary } from '../hooks/useApi';
import * as apiService from '../services/apiService';

const Market = () => {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState('All Sectors');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: marketData, isLoading, isError, error } = useMarketSummary(true);
  const stocks = marketData?.tickers || [];

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiService.searchTickers(searchTerm);
        setSearchResults(res.results || []);
      } catch (err) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const sectors = ['All Sectors', ...new Set(stocks.map(s => s.sector).filter(Boolean))];

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = activeSector === 'All Sectors' || stock.sector === activeSector;
    return matchesSearch && matchesSector;
  });

  const showSearchResults = searchTerm.length >= 2;

  return (
    <div className="min-h-screen bg-white text-[var(--light-text)]">
      <header className="bg-[var(--light-surface)] px-6 lg:px-12 py-10 border-b border-[var(--light-border)]">
        <h1 className="text-5xl lg:text-7xl font-bold text-black mb-4 tracking-tighter">Market Explorer</h1>
        <p className="text-[var(--light-text-secondary)] text-xl lg:text-2xl">Real-time equities overview. Search any ticker.</p>

        <div className="flex gap-4 mt-8 flex-wrap">
          {sectors.map(sector => (
            <button
              key={sector}
              onClick={() => setActiveSector(sector)}
              className={`px-8 py-3 rounded-full font-bold border-2 transition-all ${activeSector === sector ? 'bg-black text-white border-black' : 'bg-white text-black border-[var(--light-border-alt)] hover:bg-slate-100'}`}
            >
              {sector}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        <div className="bg-white border-2 border-[var(--light-border-alt)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 bg-[var(--light-surface)] border-b border-[var(--light-border-alt)]">
            <div className="relative max-w-xl">
              <input
                type="text"
                placeholder="Search any ticker (e.g. AAPL, TSLA, BBCA.JK)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 px-12 border-2 border-[var(--light-border-alt)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-4 top-4 text-slate-400" size={24} />
              {isSearching && <Loader className="absolute right-4 top-4 animate-spin text-indigo-600" size={24} />}
            </div>
            {showSearchResults && (
              <p className="text-sm text-[var(--light-text-secondary)] mt-3">
                Search results for "{searchTerm}" - Click to view analysis
              </p>
            )}
          </div>

          {isLoading && !showSearchResults ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <p className="text-[var(--light-text-secondary)]">Loading market data...</p>
            </div>
          ) : isError && !showSearchResults ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-red-50">
              <p className="text-red-600 font-bold">Market API is currently down or undergoing maintenance.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--light-surface)] text-[var(--light-text-secondary)] font-bold text-sm tracking-widest uppercase border-b border-[var(--light-border-alt)]">
                    <tr>
                      <th className="p-6">Ticker</th>
                      <th className="p-6">Company</th>
                      {!showSearchResults && <th className="p-6">Sector</th>}
                      {!showSearchResults && <th className="p-6">Price</th>}
                      {!showSearchResults && <th className="p-6 text-right">Trend</th>}
                      {showSearchResults && <th className="p-6">Type</th>}
                      {showSearchResults && <th className="p-6 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showSearchResults ? (
                      searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <tr
                            key={result.symbol}
                            onClick={() => navigate(`/analytics/${result.symbol}`)}
                            className="hover:bg-indigo-50 cursor-pointer transition-colors"
                          >
                            <td className="p-6 font-bold text-xl">{result.symbol}</td>
                            <td className="p-6 text-[var(--light-text-secondary)] text-lg">{result.name}</td>
                            <td className="p-6 text-[var(--light-text-secondary)]">{result.type}</td>
                            <td className="p-6 text-right">
                              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold">
                                View Analysis
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-[var(--light-text-secondary)]">
                            {isSearching ? 'Searching...' : 'No results found'}
                          </td>
                        </tr>
                      )
                    ) : (
                      filteredStocks.map((stock) => (
                        <tr key={stock.ticker} onClick={() => navigate(`/analytics/${stock.ticker}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                          <td className="p-6 font-bold text-xl">{stock.ticker}</td>
                          <td className="p-6 text-[var(--light-text-secondary)] text-lg">{stock.name}</td>
                          <td className="p-6 text-[var(--light-text-secondary)]">{stock.sector || 'N/A'}</td>
                          <td className="p-6 font-bold text-xl">${stock.price?.toFixed(2) || 'N/A'}</td>
                          <td className={`p-6 text-right font-bold text-lg ${stock.change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || '0'}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!showSearchResults && (
                <div className="p-6 bg-[var(--light-surface)] flex items-center border-t border-[var(--light-border-alt)]">
                  <span className="text-[var(--light-text-secondary)]">Showing {filteredStocks.length} of {stocks.length} results</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Market;
