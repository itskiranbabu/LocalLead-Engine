import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, CheckCircle, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      if (isSignUp && !name) {
        alert("Please enter your name");
        return;
      }
      login(email, name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg">LE</span>
            LocalLead Engine
        </h1>
        <p className="text-slate-400">Your AI-powered local growth partner.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 transition-all duration-300">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? 'Start finding leads in minutes.' : 'Sign in to access your campaigns.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          required={isSignUp}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="John Doe"
                          value={name}
                          onChange={e => setName(e.target.value)}
                      />
                  </div>
              </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
                {isSignUp ? 'Get Started' : 'Sign In'} <ArrowRight size={18} />
            </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 mb-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-blue-600 font-bold hover:underline focus:outline-none"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
        </div>

        {!isSignUp && (
          <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Why LocalLead Engine?</h3>
              <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={16} className="text-green-500" /> Google Maps & Search Grounding
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={16} className="text-green-500" /> AI Email Personalization
                  </li>
              </ul>
          </div>
        )}
      </div>
    </div>
  );
};