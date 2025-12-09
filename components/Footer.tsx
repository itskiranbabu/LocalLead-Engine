import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-8 border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
        <div>
          &copy; {new Date().getFullYear()} LocalLead Engine. All rights reserved.
        </div>
        <div className="text-center md:text-right">
          <p className="mb-1">
            <strong>Compliance Notice:</strong> Users are responsible for complying with CAN-SPAM Act, GDPR, and local regulations.
          </p>
          <p>
            Do not scrape protected data. Respect opt-out requests immediately.
          </p>
        </div>
      </div>
    </footer>
  );
};