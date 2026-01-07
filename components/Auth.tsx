import React, { useState } from 'react';
import { Zap, ChevronRight, User, Phone, Lock, Mail } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Please fill in required fields (Phone & Password).');
      return;
    }

    // Validate Indian Phone Number
    // Must be 10 digits and start with 6, 7, 8, or 9
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
        return;
    }

    if (isLogin) {
      const result = loginUser(phone, password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Login failed');
      }
    } else {
      if (!name) {
        setError('Name is required for sign up.');
        return;
      }
      const result = registerUser(name, phone, password, email);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                <Zap className="text-white w-8 h-8" fill="currentColor" />
            </div>
        </div>

        <div className="bg-surface border border-surfaceHighlight rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-sm">
                {isLogin ? 'Enter your credentials to access your tracker.' : 'Start your journey to better habits today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="text"
                                placeholder="John Doe"
                                className="w-full bg-surfaceHighlight/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 ml-1">Email (Optional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="email"
                                placeholder="john@example.com"
                                className="w-full bg-surfaceHighlight/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Phone Number</label>
                <div className="relative">
                    {/* Visual Prefix +91 */}
                    <div className="absolute left-3 top-3.5 text-gray-400 text-sm font-medium border-r border-white/10 pr-2 h-5 flex items-center pointer-events-none select-none">
                        +91
                    </div>
                    <input 
                        type="tel"
                        placeholder="98765 43210"
                        className="w-full bg-surfaceHighlight/50 border border-white/5 rounded-xl py-3 pl-14 pr-4 text-white focus:outline-none focus:border-primary transition-colors tracking-widest font-medium placeholder-gray-600"
                        value={phone}
                        onChange={e => {
                            // Enforce numbers only and max 10 digits
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setPhone(val);
                        }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-surfaceHighlight/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                    {error}
                </div>
            )}

            <button 
                type="submit"
                className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all mt-4 flex items-center justify-center gap-2 group"
            >
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-gray-500 hover:text-white transition-colors"
            >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;