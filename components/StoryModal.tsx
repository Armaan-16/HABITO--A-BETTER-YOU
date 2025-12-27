import React, { useState } from 'react';
import { X, Heart, Upload, Image as ImageIcon } from 'lucide-react';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose }) => {
  const [qrSrc, setQrSrc] = useState<string>('/support_qr.png');
  const [imgError, setImgError] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setQrSrc(objectUrl);
      setImgError(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-surface border border-surfaceHighlight rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-20"
        >
            <X size={20} />
        </button>

        {/* Left: The Story */}
        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center text-center md:text-left relative overflow-hidden bg-gradient-to-br from-surface to-surfaceHighlight/20">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <h2 className="text-3xl font-bold text-white mb-8 relative z-10 font-sans tracking-tight">The Habito Story</h2>
            
            <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed relative z-10 font-medium font-serif italic opacity-90">
                <p>We all start with plans.</p>
                <p>But between busy days and tired nights, habits break and procrastination takes over.</p>
                <p className="text-white">December shows us the truth.<br/>January gives us something powerful: determination.</p>
                <p>A chance to start again—this time with awareness.</p>
                <p>This app isn’t just a task tracker.<br/>It’s a mirror of your days, habits, and growth—helping you pause, reset, and do better tomorrow.</p>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-primary font-bold not-italic font-sans text-lg">Because time management isn’t productivity.</p>
                    <p className="text-primary font-bold not-italic font-sans text-lg">It’s life management.</p>
                </div>
            </div>
        </div>

        {/* Right: Support / QR */}
        <div className="bg-white text-black p-8 flex flex-col items-center justify-center text-center md:w-[320px] relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
            
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-5 text-pink-600 animate-pulse">
                <Heart fill="currentColor" size={28} />
            </div>
            
            <h3 className="text-2xl font-bold mb-2 tracking-tight">Support Us</h3>
            <p className="text-sm text-gray-600 mb-8 px-4 leading-relaxed">
                If Habito helps you improve your life, consider supporting our journey.
            </p>

            <div className="relative group">
                {!imgError ? (
                    <img 
                        src={qrSrc} 
                        onError={() => setImgError(true)}
                        alt="Scan to Support" 
                        className="w-48 h-48 object-contain rounded-xl border-2 border-gray-100 shadow-lg"
                    />
                ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 text-center">
                        <ImageIcon className="text-gray-300 mb-2" size={32} />
                        <p className="text-xs text-gray-500 mb-3 font-medium">QR Image Missing</p>
                        
                        <label className="cursor-pointer bg-primary hover:bg-primaryDark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <Upload size={12} />
                            Upload QR
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileUpload}
                            />
                        </label>
                        <p className="text-[9px] text-gray-400 mt-2">or save 'support_qr.png' in root</p>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-1 mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Scan via UPI</span>
                <span className="text-[10px] text-gray-400">Secure Payment</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;