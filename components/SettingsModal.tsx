import React, { useState, useEffect } from 'react';
import { X, Palette, RotateCcw, Check } from './Icons';
import { applyTheme, resetTheme, loadTheme, ThemeColors, darkenHex } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: ThemeColors[] = [
    { primary: '#8b5cf6', primaryDark: '#7c3aed', accent: '#d946ef' }, // Default
    { primary: '#3b82f6', primaryDark: '#2563eb', accent: '#06b6d4' }, // Ocean
    { primary: '#10b981', primaryDark: '#059669', accent: '#84cc16' }, // Emerald
    { primary: '#f97316', primaryDark: '#ea580c', accent: '#eab308' }, // Sunset
    { primary: '#f43f5e', primaryDark: '#e11d48', accent: '#ec4899' }, // Rose
    { primary: '#6366f1', primaryDark: '#4f46e5', accent: '#a855f7' }, // Midnight
];

const PRESET_NAMES = ['Default Violet', 'Ocean Blue', 'Emerald Forest', 'Sunset Orange', 'Rose Red', 'Midnight'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [colors, setColors] = useState<ThemeColors>({ primary: '#8b5cf6', primaryDark: '#7c3aed', accent: '#d946ef' });

  useEffect(() => {
    if (isOpen) {
        const current = loadTheme();
        setColors(current);
    }
  }, [isOpen]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    let newColors = { ...colors, [key]: value };
    
    // Auto-update dark shade if primary changes, unless user is manually tweaking dark
    if (key === 'primary') {
        newColors.primaryDark = darkenHex(value, 15);
    }

    setColors(newColors);
    applyTheme(newColors);
  };

  const handlePresetClick = (preset: ThemeColors) => {
    setColors(preset);
    applyTheme(preset);
  };

  const handleReset = () => {
    const defaults = resetTheme();
    setColors(defaults);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-surface border border-surfaceHighlight rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surfaceHighlight/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="text-primary" />
                Appearance Settings
            </h2>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
            
            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Primary</label>
                    <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <input 
                            type="color" 
                            value={colors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                        />
                        <span className="text-xs font-mono text-white flex-1">{colors.primary}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Primary Dark</label>
                    <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <input 
                            type="color" 
                            value={colors.primaryDark}
                            onChange={(e) => handleColorChange('primaryDark', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                        />
                        <span className="text-xs font-mono text-white flex-1">{colors.primaryDark}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Accent</label>
                    <div className="flex items-center gap-3 bg-surfaceHighlight/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <input 
                            type="color" 
                            value={colors.accent}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                        />
                        <span className="text-xs font-mono text-white flex-1">{colors.accent}</span>
                    </div>
                </div>
            </div>

            {/* Preview Block */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-sm">Theme Preview</h3>
                    <p className="text-xs text-gray-300 mt-1">This is how your active theme looks.</p>
                </div>
                <button className="bg-primary hover:bg-primaryDark transition-colors text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-primary/30">
                    Hover Me
                </button>
            </div>

            {/* Presets */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Quick Presets</label>
                    <button 
                        onClick={handleReset}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                    >
                        <RotateCcw size={12} /> Reset to Default
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map((preset, idx) => {
                        const isActive = colors.primary.toLowerCase() === preset.primary.toLowerCase();
                        return (
                            <button
                                key={PRESET_NAMES[idx]}
                                onClick={() => handlePresetClick(preset)}
                                className={`group relative h-12 rounded-xl border transition-all overflow-hidden ${isActive ? 'ring-2 ring-white border-transparent' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="absolute inset-0 flex">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: preset.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: preset.accent }} />
                                </div>
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Check size={16} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 text-[10px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {PRESET_NAMES[idx]}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-surfaceHighlight/10 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;