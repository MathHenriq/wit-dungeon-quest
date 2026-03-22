import { useState, useEffect } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  reducedMotion: boolean;
  fontSize: 'small' | 'normal' | 'large';
}

const DEFAULTS: AccessibilitySettings = {
  highContrast: false,
  colorBlindMode: 'none',
  reducedMotion: false,
  fontSize: 'normal',
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('wit-accessibility');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem('wit-accessibility', JSON.stringify(settings));
    const body = document.body;
    body.classList.toggle('high-contrast', settings.highContrast);
    body.classList.toggle('reduced-motion', settings.reducedMotion);
    body.classList.remove('deuteranopia', 'protanopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') body.classList.add(settings.colorBlindMode);
    document.documentElement.style.fontSize =
      settings.fontSize === 'small' ? '14px' :
      settings.fontSize === 'large' ? '18px' : '16px';
  }, [settings]);

  const update = (partial: Partial<AccessibilitySettings>) =>
    setSettings(prev => ({ ...prev, ...partial }));

  return { settings, update };
}
