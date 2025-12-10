import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, CheckCircle, MapPin, BarChart2, Zap, User, Star, Quote } from 'lucide-react';

export const Landing: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
         login(email, password, true);
    } else {
         login(email, password, false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-2xl">
                <span className="bg-blue-600 text-white px-2 py-1 rounded-lg">LE</span>
                <span>LocalLead Engine</span>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
                <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
                <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
                <button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Testimonials</button>
            </div>
            <div className="md:hidden">
                {/* Mobile placeholder if needed */}
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-slate-900 text-white pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide animate-fade-in">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Now available in India
                </div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    Turn Local Maps into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Revenue</span>.
                </h1>
                <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                    The only AI-powered lead generation tool tailored for agencies. Find clients in minutes, verify them with Maps, and send high-converting pitches instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 pt-4 text-sm font-medium text-slate-400">
                   <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-teal-400" /> No Credit Card Required
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-teal-400" /> 14-Day Free Trial
                   </div>
                </div>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 relative z-10">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">{isSignUp ? 'Start Your Free Trial' : 'Welcome Back'}</h3>
                    <p className="text-slate-500 text-sm mt-1">{isSignUp ? 'Get 50 leads free today.' : 'Login to access your dashboard.'}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
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
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-white"
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
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
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
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-600 rounded-full blur-[120px]"></div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Everything you need to <span className="text-blue-600">close deals</span></h2>
                  <p className="text-slate-500 text-lg">Stop buying expensive, outdated databases. Use AI to find fresh local leads and pitch them instantly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                          <MapPin size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-slate-800">Google Maps Grounding</h3>
                      <p className="text-slate-600 leading-relaxed">Find real businesses in specific areas (e.g., "Dentists in Kharadi"). Our AI verifies they exist via Maps so you never pitch a closed shop.</p>
                  </div>
                  <div className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                          <Zap size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-slate-800">WhatsApp Pitch Writer</h3>
                      <p className="text-slate-600 leading-relaxed">Generate high-converting, culturally relevant WhatsApp messages. The AI understands Indian business etiquette and writes scripts that get replies.</p>
                  </div>
                  <div className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:shadow-xl transition-all duration-300">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
                          <BarChart2 size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-slate-800">Pipeline Valuation</h3>
                      <p className="text-slate-600 leading-relaxed">Track the potential rupee value of your leads automatically. Our algorithm estimates deal size based on business type so you focus on high-ticket clients.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p className="text-slate-400 text-lg">Choose the plan that fits your agency's growth stage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Starter Plan */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 flex flex-col">
                    <div className="mb-4">
                        <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Starter</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">₹0</h3>
                    <p className="text-slate-400 mb-6 text-sm">Forever free for solo consultants.</p>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> 50 Leads / Month
                        </li>
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> Basic Email Templates
                        </li>
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> WhatsApp Link Generator
                        </li>
                    </ul>
                    <button onClick={() => { setIsSignUp(true); scrollToSection('root'); }} className="w-full py-3 rounded-lg border border-slate-600 hover:bg-slate-700 font-bold transition-colors">
                        Start Free
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-blue-600 rounded-2xl p-8 flex flex-col transform md:-translate-y-4 shadow-2xl shadow-blue-900/50 border border-blue-400 relative">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                    <div className="mb-4">
                        <span className="bg-blue-800 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase">Growth</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">₹2,499<span className="text-lg font-normal text-blue-200">/mo</span></h3>
                    <p className="text-blue-100 mb-6 text-sm">For growing agencies & teams.</p>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-white text-sm">
                            <CheckCircle size={16} className="text-yellow-400" /> Unlimited Leads
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <CheckCircle size={16} className="text-yellow-400" /> Advanced AI Writer
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <CheckCircle size={16} className="text-yellow-400" /> CRM Integrations
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <CheckCircle size={16} className="text-yellow-400" /> Priority Support
                        </li>
                    </ul>
                    <button onClick={() => { setIsSignUp(true); scrollToSection('root'); }} className="w-full py-3 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-bold transition-colors shadow-lg">
                        Get Started
                    </button>
                </div>

                {/* Agency Plan */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 flex flex-col">
                    <div className="mb-4">
                        <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Agency</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">₹9,999<span className="text-lg font-normal text-slate-400">/mo</span></h3>
                    <p className="text-slate-400 mb-6 text-sm">Full scale automation & API access.</p>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> Everything in Growth
                        </li>
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> 5 Team Seats
                        </li>
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> White Label Reports
                        </li>
                        <li className="flex items-center gap-3 text-slate-300 text-sm">
                            <CheckCircle size={16} className="text-blue-500" /> API Access
                        </li>
                    </ul>
                    <button onClick={() => { setIsSignUp(true); scrollToSection('root'); }} className="w-full py-3 rounded-lg border border-slate-600 hover:bg-slate-700 font-bold transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Loved by Indian Marketers</h2>
                  <p className="text-slate-500 text-lg">See how others are scaling their agencies with LocalLead Engine.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex gap-1 text-yellow-400 mb-4">
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                      </div>
                      <p className="text-slate-600 mb-6 leading-relaxed italic">
                        "I used to spend hours on Google Maps manually copying numbers. Now I just type 'Gyms in Pune' and get 50 leads in seconds. The WhatsApp scripts are a game changer."
                      </p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">R</div>
                          <div>
                              <div className="font-bold text-slate-900">Rahul Sharma</div>
                              <div className="text-xs text-slate-500">Founder, DigitalPune</div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex gap-1 text-yellow-400 mb-4">
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                      </div>
                      <p className="text-slate-600 mb-6 leading-relaxed italic">
                        "The pipeline valuation feature helped me realize I was chasing small fish. I shifted focus to high-ticket clients and doubled my revenue in 2 months."
                      </p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">P</div>
                          <div>
                              <div className="font-bold text-slate-900">Priya Mehta</div>
                              <div className="text-xs text-slate-500">Freelance SEO Expert</div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex gap-1 text-yellow-400 mb-4">
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                      </div>
                      <p className="text-slate-600 mb-6 leading-relaxed italic">
                        "Finally a tool that understands the Indian market. The AI doesn't sound robotic; it actually writes like a professional consultant."
                      </p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">A</div>
                          <div>
                              <div className="font-bold text-slate-900">Amit Verma</div>
                              <div className="text-xs text-slate-500">Growth Head, TechSpark</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-slate-400 text-sm">
                  &copy; {new Date().getFullYear()} LocalLead Engine. Designed for Indian Agencies.
              </div>
              <div className="flex gap-6 text-sm font-medium text-slate-400">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
          </div>
      </footer>
    </div>
  );
};