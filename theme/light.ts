// theme/light.ts
export type LightTheme = {
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    primary: string;
    success: string;
    danger: string;
    border: string;
    shadow: string;
  };
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number };
};

export const lightTheme: LightTheme = {
  colors: {
    background: '#F7F9FC',
    card: '#FFFFFF',
    text: '#1F2937',
    subtext: '#6B7280',
    primary: '#2563EB',
    success: '#10B981',
    danger: '#EF4444',
    border: '#E5E7EB',
    shadow: 'rgba(0,0,0,0.08)',
  },
  spacing: (n: number) => n * 8,
  radius: { sm: 8, md: 12, lg: 16 },
};
