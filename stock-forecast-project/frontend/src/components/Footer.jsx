import React from 'react';
import { AlertCircle, Github, Mail } from 'lucide-react';

/**
 * Footer Component - Bottom section with disclaimer and info
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Disclaimer Banner */}
        <div className="py-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">Disclaimer</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                ⚠️ <strong>Important:</strong> This tool is for technical analysis purposes only and does not constitute financial advice. 
                Stock prices are inherently unpredictable, and LSTM predictions may contain errors. Always consult with a financial 
                advisor before making investment decisions. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* About */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">About</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Stock Price Forecasting using advanced LSTM Deep Learning models. Built with FastAPI and React.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Features</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>• LSTM Neural Networks</li>
                <li>• Real-time Data</li>
                <li>• Performance Metrics</li>
                <li>• Export Reports</li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Tech Stack</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>• Backend: FastAPI</li>
                <li>• ML: TensorFlow</li>
                <li>• Frontend: React</li>
                <li>• Data: yfinance</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Contact</h3>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; {currentYear} StockForecast. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * Compact Footer for embedded use
 */
export const CompactFooter = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
      <p>
        ⚠️ <strong>Disclaimer:</strong> This tool is for technical analysis purposes only and does not constitute financial advice.
      </p>
    </footer>
  );
};
