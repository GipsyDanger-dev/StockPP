import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PriceChart = ({ historical, forecast }) => {
  // Logika menggabungkan data
  const chartData = [
    ...(historical || []).map(d => ({ ...d, type: 'Historical' })),
    ...(forecast || []).map(d => ({ ...d, type: 'Forecast' }))
  ];

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#6366f1" 
            fill="#6366f1" 
            fillOpacity={0.1} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// BARIS INI WAJIB ADA DAN HARUS DI LUAR KURUNG KURAWAL KOMPONEN
export default PriceChart;