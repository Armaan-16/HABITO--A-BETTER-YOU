
// Helper to convert Hex to RGB string "r g b" for Tailwind opacity support
export const hexToRgb = (hex: string): string | null => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` 
    : null;
};

// Calculate a darker variant of a color for hover states (hex input, hex output)
export const darkenHex = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const [r, g, b] = rgb.split(' ').map(Number);
    const factor = (100 - percent) / 100;
    
    const darkR = Math.max(0, Math.floor(r * factor));
    const darkG = Math.max(0, Math.floor(g * factor));
    const darkB = Math.max(0, Math.floor(b * factor));
    
    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
};

export interface ThemeColors {
    primary: string;
    primaryDark: string;
    accent: string;
}

export const DEFAULT_THEME: ThemeColors = {
    primary: '#8b5cf6', // Violet
    primaryDark: '#7c3aed', 
    accent: '#d946ef'   // Fuchsia
};

export const applyTheme = (colors: ThemeColors) => {
    const primaryRgb = hexToRgb(colors.primary);
    const primaryDarkRgb = hexToRgb(colors.primaryDark);
    const accentRgb = hexToRgb(colors.accent);
    
    if (primaryRgb && primaryDarkRgb && accentRgb) {
        // We apply to both root and body to ensure we override any specific styles
        const root = document.documentElement;
        const body = document.body;
        
        const setVar = (name: string, value: string) => {
            root.style.setProperty(name, value);
            body.style.setProperty(name, value);
        };
        
        // Apply CSS Variables
        setVar('--color-primary', primaryRgb);
        setVar('--color-primary-dark', primaryDarkRgb);
        setVar('--color-accent', accentRgb);
        
        // Save to Storage
        localStorage.setItem('habito_theme', JSON.stringify(colors));
    }
};

export const loadTheme = (): ThemeColors => {
    try {
        const stored = localStorage.getItem('habito_theme');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Handle legacy storage format (missing primaryDark)
            const theme: ThemeColors = {
                primary: parsed.primary || DEFAULT_THEME.primary,
                accent: parsed.accent || DEFAULT_THEME.accent,
                primaryDark: parsed.primaryDark || darkenHex(parsed.primary || DEFAULT_THEME.primary, 15)
            };
            
            // Apply immediately
            applyTheme(theme);
            return theme;
        }
    } catch (e) {
        console.error("Failed to load theme", e);
    }
    // Apply default if nothing stored
    applyTheme(DEFAULT_THEME);
    return DEFAULT_THEME;
};

export const resetTheme = () => {
    applyTheme(DEFAULT_THEME);
    return DEFAULT_THEME;
};