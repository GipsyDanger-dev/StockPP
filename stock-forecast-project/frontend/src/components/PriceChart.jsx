import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const PriceChart = ({ historical, forecast, indicators }) => {
  // Build indicator lookup by date
  const indicatorMap = {};
  if (indicators && indicators.length > 0) {
    indicators.forEach(ind => {
      indicatorMap[ind.date] = {
        ma20: ind.ma20,
        ma50: ind.ma50
      };
    });
  }

  // Build chart data with separate actual/forecast dataKeys
  const chartData = [];

  // Historical data: actual = price, forecast = null
  (historical || []).forEach((d, i) => {
    const isLast = i === (historical || []).length - 1;
    chartData.push({
      date: d.date,
      actual: d.price,
      // Bridge: last historical point also shows in forecast line so lines connect
      forecast: isLast && forecast && forecast.length > 0 ? d.price : null,
      ma20: indicatorMap[d.date]?.ma20 || null,
      ma50: indicatorMap[d.date]?.ma50 || null,
      type: 'actual'
    });
  });

  // Forecast data: actual = null, forecast = price
  (forecast || []).forEach(d => {
    chartData.push({
      date: d.date,
      actual: null,
      forecast: d.price,
      ma20: null,
      ma50: null,
      type: 'forecast'
    });
  });

  // Find the boundary date for reference line
  const lastHistoricalDate = historical && historical.length > 0
    ? historical[historical.length - 1].date
    : null;

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => val.slice(5)} // Show MM-DD only
          />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
          <Tooltip
            content={<CustomTooltip />}
          />
          <Legend />

          {/* Vertical divider at forecast boundary */}
          {lastHistoricalDate && (
            <ReferenceLine
              x={lastHistoricalDate}
              stroke="#94a3b8"
              strokeDasharray="6 4"
              label={{ value: 'Today', position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            />
          )}

          {/* Historical / Actual Area (indigo, solid) */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.08}
            strokeWidth={2.5}
            dot={false}
            name="Actual"
            connectNulls
            activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Forecast Line (emerald, dashed) */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            name="Forecast"
            connectNulls
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* MA20 Line (orange, thin) */}
          <Line
            type="monotone"
            dataKey="ma20"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
            name="MA20"
            connectNulls
          />

          {/* MA50 Line (sky blue, thin) */}
          <Line
            type="monotone"
            dataKey="ma50"
            stroke="#0ea5e9"
            strokeWidth={1.5}
            dot={false}
            name="MA50"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom tooltip showing type (Actual / Forecast)
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filter out null entries
  const items = payload.filter(p => p.value !== null && p.value !== undefined);
  if (items.length === 0) return null;

  // Determine if this point is actual or forecast
  const dataPoint = items[0]?.payload;
  const isForecast = dataPoint?.type === 'forecast';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-xs text-[#45464D] font-bold mb-2">{label}</p>
      {isForecast && (
        <p className="text-xs text-emerald-600 font-bold mb-1">PREDICTED</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex justify-between gap-4 text-sm">
          <span style={{ color: item.color }} className="font-medium">{item.name}</span>
          <span className="font-bold">${Number(item.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default PriceChart;
