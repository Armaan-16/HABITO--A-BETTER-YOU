import React from 'react';
import { X, Mail, Heart, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSendEmail = () => {
      window.location.href = "mailto:habitotracker@gmail.com?subject=Habito App Feedback";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-surface border border-surfaceHighlight rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-20"
        >
            <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20 animate-in zoom-in duration-500 delay-100 relative z-10">
                <Heart fill="currentColor" className="text-white w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 relative z-10">We’re always here for you 💛</h2>
            
            <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed relative z-10 font-medium opacity-90 mb-8">
                <p>
                    If you ever have a question, face any inconvenience, or feel something could be better, please don’t hesitate to reach out.
                </p>
                <p>
                    Your feedback truly matters to us—it helps us grow, improve, and build this app around you. Every message is read with care, and we’ll do our best to make your experience smoother and more meaningful.
                </p>
                <p className="text-primary font-semibold pt-2">
                    Thank you for being part of this journey 🌱
                </p>
            </div>

            <button 
                onClick={handleSendEmail}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 group relative z-10"
            >
                <Mail className="group-hover:scale-110 transition-transform text-primary" size={20} />
                <span>habitotracker@gmail.com</span>
            </button>
            
            <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest">
                We typically reply within 24 hours
            </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;