import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, CheckCircle, MapPin, BarChart2, Zap, User } from 'lucide-react';

export const Landing: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Acts as name in mock mode if signup, or password in real mode
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For Supabase: email + password. For Mock: email + name (if signup)
    // We'll normalize this. If Supabase is active, we need a password field.
    // The current UI reused the "Password" field as "Name" in mock mode.
    // Let's make it robust.
    
    if (isSignUp) {
         login(email, password, true); // Supabase expects password here. We need to handle metadata separately in context
    } else {
         login(email, password, false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-y-auto">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">LE</span>
            <span>LocalLead Engine</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
            <div className="inline-block bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2">
                🇮🇳 Made for Indian Agencies
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Turn Local Maps into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Revenue Engines</span>.
            </h1>
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                The only AI-powered lead generation tool tailored for the Indian market. Find clients in Pune, Mumbai, Bangalore & beyond. Send WhatsApp pitches that convert.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle size={16} className="text-green-400" /> No Credit Card Required
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle size={16} className="text-green-400" /> Free Trial Plan
               </div>
            </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200">
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{isSignUp ? 'Start Your Free Trial' : 'Welcome Back'}</h3>
                <p className="text-slate-500 text-sm mt-1">{isSignUp ? 'Get 50 leads free today.' : 'Login to access your dashboard.'}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="agency@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {isSignUp ? 'Create Password' : 'Password'}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all hover:translate-y-[-2px]"
                >
                    {isLoading ? 'Processing...' : (isSignUp ? 'Get Started Now' : 'Login')} <ArrowRight size={16} />
                </button>
            </form>

            <div className="mt-6 text-center border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                    {isSignUp ? "Already have an account?" : "New to LocalLead?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-blue-600 font-bold hover:underline">
                        {isSignUp ? 'Login' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="bg-slate-50 py-20 px-6 text-slate-900">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to <span className="text-blue-600">close deals</span>.</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Stop buying expensive databases. Use AI to find fresh local leads and pitch them instantly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                          <MapPin size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Google Maps Grounding</h3>
                      <p className="text-slate-500 leading-relaxed">Find real businesses in specific areas (e.g., "Dentists in Kharadi"). Our AI verifies they exist via Maps.</p>
                  </div>
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                          <Zap size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">WhatsApp Pitch Writer</h3>
                      <p className="text-slate-500 leading-relaxed">Generate high-converting, culturally relevant WhatsApp messages that get replies in India.</p>
                  </div>
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 mb-6">
                          <BarChart2 size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Pipeline Valuation</h3>
                      <p className="text-slate-500 leading-relaxed">Track the potential rupee value of your leads. Focus on high-ticket clients first.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6 border-t border-slate-800">
          <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
              <p className="mb-4">&copy; {new Date().getFullYear()} LocalLead Engine. Designed for Indian SaaS Growth.</p>
              <div className="flex justify-center gap-6">
                  <a href="#" className="hover:text-white">Privacy Policy</a>
                  <a href="#" className="hover:text-white">Terms of Service</a>
                  <a href="#" className="hover:text-white">Contact Support</a>
              </div>
          </div>
      </footer>
    </div>
  );
};