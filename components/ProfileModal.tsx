import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, Eye, EyeOff, Save, AlertCircle, Edit2, Mail, Check } from 'lucide-react';
import { User as UserType } from '../types';
import { updateUserProfile } from '../services/authService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (user: UserType) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [mode, setMode] = useState<'view' | 'edit_details' | 'edit_password'>('view');
  
  // Detail States
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');

  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setName(user.name);
        setPhone(user.phone);
        setEmail(user.email || '');
        setNewPassword('');
        setMode('view');
        setError('');
        setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleUpdateDetails = () => {
    if (!name.trim() || !phone.trim()) {
        setError("Name and Phone are required.");
        return;
    }

    // Validate Indian Phone Number format
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
        return;
    }

    const updatedUser = { ...user, name, phone, email };
    // Pass old ID (user.phone) to handle migration if phone changed
    const result = updateUserProfile(updatedUser, user.phone); 

    if (result.success) {
        onUpdate(updatedUser); // Update App state
        setMode('view');
        setSuccessMsg('Profile updated successfully!');
        setError('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMsg(''), 3000);
    } else {
        setError(result.message || "Failed to update profile.");
    }
  };

  const handleUpdatePassword = () => {
    if (!newPassword.trim()) {
        setError('Password cannot be empty');
        return;
    }
    
    const updatedUser = { ...user, password: newPassword };
    const result = updateUserProfile(updatedUser, user.phone); // ID hasn't changed here
    
    if (result.success) {
        onUpdate(updatedUser);
        setMode('view');
        setNewPassword('');
        setSuccessMsg('Password changed successfully!');
        setError('');
        setTimeout(() => setSuccessMsg(''), 3000);
    } else {
        setError("Failed to update password.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative bg-surface border border-surfaceHighlight rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surfaceHighlight/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="text-primary" />
                Profile Info
            </h2>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Messages */}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">{error}</div>}
            {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl text-center">{successMsg}</div>}

            {/* DETAILS SECTION */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Details</label>
                    {mode === 'view' && (
                        <button 
                            onClick={() => setMode('edit_details')} 
                            className="text-xs text-primary hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <Edit2 size={12} /> Edit
                        </button>
                    )}
                </div>

                {mode === 'edit_details' ? (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 ml-1">Name</label>
                            <input 
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 ml-1">Phone (Login ID)</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2 text-gray-400 text-xs border-r border-white/10 pr-2 h-6 flex items-center pointer-events-none select-none">
                                    +91
                                </div>
                                <input 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-12 pr-3 text-white focus:border-primary focus:outline-none tracking-wide"
                                    value={phone}
                                    onChange={e => {
                                        // Enforce numbers only and max 10 digits
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPhone(val);
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-yellow-500/80 px-1">Note: Changing phone number will move all your data to the new ID.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 ml-1">Email</label>
                            <input 
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleUpdateDetails} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primaryDark flex items-center justify-center gap-2">
                                <Save size={14} /> Save Changes
                            </button>
                            <button onClick={() => { setMode('view'); setError(''); }} className="px-4 bg-white/5 text-gray-400 py-2 rounded-lg text-sm font-bold hover:bg-white/10">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-3 rounded-xl border border-white/5 text-gray-300">
                            <User size={18} className="text-gray-500" />
                            <span className="flex-1">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-3 rounded-xl border border-white/5 text-gray-300">
                            <Phone size={18} className="text-gray-500" />
                            <span className="flex-1">+91 {user.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-3 rounded-xl border border-white/5 text-gray-300">
                            <Mail size={18} className="text-gray-500" />
                            <span className="flex-1">{user.email || <span className="text-gray-600 italic">No email added</span>}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* PASSWORD SECTION */}
            <div className="pt-6 border-t border-white/5">
                 <div className="flex justify-between items-end mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Security</label>
                    {mode === 'view' && (
                        <button 
                            onClick={() => setMode('edit_password')} 
                            className="text-xs text-primary hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <Edit2 size={12} /> Change Password
                        </button>
                    )}
                </div>

                {mode === 'edit_password' ? (
                    <div className="space-y-3 animate-in fade-in">
                         <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input 
                                type="text"
                                placeholder="Enter new password"
                                className="w-full bg-black/30 border border-primary/50 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleUpdatePassword} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primaryDark flex items-center justify-center gap-2">
                                <Save size={14} /> Update Password
                            </button>
                            <button onClick={() => { setMode('view'); setError(''); setNewPassword(''); }} className="px-4 bg-white/5 text-gray-400 py-2 rounded-lg text-sm font-bold hover:bg-white/10">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative group">
                        <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-3 rounded-xl border border-white/5 text-white">
                            <Lock size={18} className="text-gray-500" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={user.password} 
                                readOnly 
                                className="bg-transparent border-none outline-none w-full cursor-default text-gray-400"
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Warning Note */}
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-yellow-100/80 leading-relaxed">
                        <strong className="text-yellow-500 block mb-1">Important:</strong>
                        Please save your password carefully or write it down. Since we do not store your data on a cloud server, retrieving a lost password is extremely difficult.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;