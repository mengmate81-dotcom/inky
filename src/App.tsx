import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Pen, Ink } from './types';
import { PenItem } from './components/PenItem';
import { Modal } from './components/Modal';
import { PlusIcon, PenIcon, ColorSwatchIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon, BrandLogoIcon, PaintBrushIcon, SparklesIcon } from './components/icons';
import { BrandLogo } from './components/BrandLogo';
import { ImageUploader } from './components/ImageUploader';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { GoogleGenAI } from "@google/genai";

const initialPens: Pen[] = [
  { id: '1', brand: 'Lamy', model: 'Safari', nib: { size: 'Fine', material: 'Steel' }, inkId: '101' },
  { id: '2', brand: 'Pilot', model: 'Custom 823', nib: { size: 'Medium', material: '14k Gold', features: 'Two-tone' }, inkId: '102' },
  { id: '3', brand: 'TWSBI', model: 'Eco', nib: { size: 'Broad', material: 'Steel' }, inkId: null },
];

const initialInks: Ink[] = [
  { id: '101', brand: 'Diamine', name: 'Oxford Blue', color: '#002147' },
  { id: '102', brand: 'Iroshizuku', name: 'Kon-peki', color: '#009bce' },
  { id: '103', brand: 'J. Herbin', name: 'Emerald of Chivor', color: '#1a5750' },
  { id: '104', brand: 'Noodler\'s', name: 'Apache Sunset', color: '#fe7f00' },
];

type Theme = 'twilight' | 'daylight' | 'aurora';

// --- THEME DEFINITIONS (omitted for brevity, no changes) ---
const themes: Record<Theme, Record<string, string>> = {
  twilight: {
    '--color-background-start': '#201b43',
    '--color-background-end': '#4a3f93',
    '--color-surface-primary': 'rgba(30, 27, 67, 0.75)',
    '--color-surface-secondary': 'rgba(30, 27, 67, 0.45)',
    '--color-surface-inset': 'rgba(30, 27, 67, 0.35)',
    '--color-text-primary': '#F8FAFC',
    '--color-text-secondary': '#E2E8F0',
    '--color-text-subtle': '#A0AEC0',
    '--color-text-accent': '#06b6d4', // cyan-500
    '--color-text-danger': '#fb7185', // rose-400
    '--color-button-accent-bg': '#06b6d4',
    '--color-button-accent-text': '#0F172A',
    '--color-button-accent-hover-bg': '#22d3ee', // cyan-400
    '--color-button-subtle-hover-bg': 'rgba(6, 182, 212, 0.1)',
    '--color-button-danger-hover-bg': 'rgba(251, 113, 133, 0.1)',
    '--color-border-primary': 'rgba(6, 182, 212, 0.2)',
    '--color-border-secondary': 'rgba(6, 182, 212, 0.1)',
    '--color-border-input': 'rgba(6, 182, 212, 0.3)',
    '--color-backdrop': 'rgba(32, 27, 67, 0.4)',
    '--color-shadow': 'rgba(0, 0, 0, 0.5)',
    '--paper-texture-opacity': '0.02',
    '--paper-texture-blend-mode': 'overlay',
  },
  daylight: {
    '--color-background-start': '#fde047', // yellow-300
    '--color-background-end': '#fb923c', // orange-400
    '--color-surface-primary': 'rgba(255, 255, 255, 0.7)',
    '--color-surface-secondary': 'rgba(241, 245, 249, 0.8)',
    '--color-surface-inset': 'rgba(241, 245, 249, 0.9)',
    '--color-text-primary': '#1E293B',
    '--color-text-secondary': '#475569',
    '--color-text-subtle': '#64748B',
    '--color-text-accent': '#2563eb', // blue-600
    '--color-text-danger': '#e11d48', // rose-600
    '--color-button-accent-bg': '#2563eb',
    '--color-button-accent-text': '#FFFFFF',
    '--color-button-accent-hover-bg': '#3b82f6', // blue-500
    '--color-button-subtle-hover-bg': 'rgba(37, 99, 235, 0.1)',
    '--color-button-danger-hover-bg': 'rgba(225, 29, 72, 0.1)',
    '--color-border-primary': 'rgba(0, 0, 0, 0.08)',
    '--color-border-secondary': 'rgba(0, 0, 0, 0.05)',
    '--color-border-input': '#CBD5E1',
    '--color-backdrop': 'rgba(255, 255, 255, 0.1)',
    '--color-shadow': 'rgba(100, 116, 139, 0.2)',
    '--paper-texture-opacity': '0.05',
    '--paper-texture-blend-mode': 'multiply',
  },
  aurora: {
    '--color-background-start': '#10b981', // emerald-500
    '--color-background-end': '#ec4899', // pink-500
    '--color-surface-primary': 'rgba(11, 22, 40, 0.65)',
    '--color-surface-secondary': 'rgba(11, 22, 40, 0.4)',
    '--color-surface-inset': 'rgba(11, 22, 40, 0.3)',
    '--color-text-primary': '#F8FAFC',
    '--color-text-secondary': '#E2E8F0',
    '--color-text-subtle': '#94A3B8',
    '--color-text-accent': '#a3e635', // lime-400
    '--color-text-danger': '#f97316', // orange-500
    '--color-button-accent-bg': '#a3e635',
    '--color-button-accent-text': '#1e3a13', // green-950
    '--color-button-accent-hover-bg': '#bef264', // lime-300
    '--color-button-subtle-hover-bg': 'rgba(163, 230, 53, 0.1)',
    '--color-button-danger-hover-bg': 'rgba(249, 115, 22, 0.1)',
    '--color-border-primary': 'rgba(163, 230, 53, 0.2)',
    '--color-border-secondary': 'rgba(163, 230, 53, 0.1)',
    '--color-border-input': 'rgba(163, 230, 53, 0.3)',
    '--color-backdrop': 'rgba(11, 22, 40, 0.4)',
    '--color-shadow': 'rgba(0, 0, 0, 0.5)',
    '--paper-texture-opacity': '0.02',
    '--paper-texture-blend-mode': 'overlay',
  },
};

const paperTextureUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E`;

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const colorDifference = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return Infinity;

  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
};

interface IdentificationResult {
  brand: string;
  name: string;
}

const App: React.FC = () => {
  const [pens, setPens] = useState<Pen[]>(initialPens);
  const [inks, setInks] = useState<Ink[]>(initialInks);
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'pens' | 'inks'>('pens');
  const [theme, setTheme] = useState<Theme>('twilight');
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  
  // AI Identifier State
  const [isIdentifierOpen, setIdentifierOpen] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifierImage, setIdentifierImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [identificationError, setIdentificationError] = useState<string | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  useEffect(() => {
    const root = document.body;
    const themeProperties = themes[theme];
    Object.keys(themeProperties).forEach(key => {
        root.style.setProperty(key, themeProperties[key]);
    });
    root.style.background = `linear-gradient(to bottom right, var(--color-background-start), var(--color-background-end))`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeProperties['--color-background-start']);
  }, [theme]);

  // --- EXISTING STATE (omitted for brevity, no changes) ---
  const [isAddPenModalOpen, setAddPenModalOpen] = useState(false);
  const [newPen, setNewPen] = useState({ brand: '', model: '', nib: { size: '', material: '', features: '' } });
  const [newPenLogo, setNewPenLogo] = useState<string | null>(null);

  const [isAddInkModalOpen, setAddInkModalOpen] = useState(false);
  const [newInk, setNewInk] = useState({ brand: '', name: '', color: '#000000' });
  const [newInkLogo, setNewInkLogo] = useState<string | null>(null);

  const [penToInk, setPenToInk] = useState<Pen | null>(null);
  
  const [penSearch, setPenSearch] = useState('');
  const [inkSearch, setInkSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  const [penSortConfig, setPenSortConfig] = useState<{ key: 'brand' | 'model' | 'nibSize', direction: 'ascending' | 'descending' }>({ key: 'brand', direction: 'ascending' });
  // --- END OF EXISTING STATE ---


  const getInkById = useCallback((inkId: string | null) => {
    return inks.find(ink => ink.id === inkId);
  }, [inks]);

  const normalizeBrand = (brand: string) => brand.trim().toLowerCase();

  // --- FILTERING AND SORTING LOGIC (omitted for brevity, no changes) ---
  const filteredPens = useMemo(() => {
    const searchTerm = penSearch.toLowerCase();
    
    let pensToProcess = [...pens];

    if (searchTerm) {
      pensToProcess = pensToProcess.filter(pen => 
        pen.brand.toLowerCase().includes(searchTerm) ||
        pen.model.toLowerCase().includes(searchTerm) ||
        pen.nib.size.toLowerCase().includes(searchTerm) ||
        pen.nib.material.toLowerCase().includes(searchTerm) ||
        (pen.nib.features || '').toLowerCase().includes(searchTerm)
      );
    }

    const { key, direction } = penSortConfig;
    pensToProcess.sort((a, b) => {
        let valA: string, valB: string;

        if (key === 'nibSize') {
            valA = a.nib.size.toLowerCase();
            valB = b.nib.size.toLowerCase();
        } else {
            valA = a[key].toLowerCase();
            valB = b[key].toLowerCase();
        }

        if (valA < valB) {
            return direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
            return direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return pensToProcess;
  }, [pens, penSearch, penSortConfig]);

  const filteredInks = useMemo(() => {
    const searchTerm = inkSearch.toLowerCase();
    const COLOR_SIMILARITY_THRESHOLD = 75;

    const textFiltered = inks.filter(ink => 
      ink.brand.toLowerCase().includes(searchTerm) ||
      ink.name.toLowerCase().includes(searchTerm) ||
      ink.color.toLowerCase().includes(searchTerm)
    );

    if (!selectedColor) {
      return textFiltered;
    }

    return textFiltered.filter(ink => 
      colorDifference(ink.color, selectedColor) < COLOR_SIMILARITY_THRESHOLD
    );
  }, [inks, inkSearch, selectedColor]);
  // --- END OF FILTERING AND SORTING ---

  const handleAddPen = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPen.brand && newPen.model && newPen.nib.size && newPen.nib.material) {
      const trimmedBrand = newPen.brand.trim();
      if (newPenLogo && trimmedBrand) {
        setBrandLogos(prev => ({ ...prev, [normalizeBrand(trimmedBrand)]: newPenLogo }));
      }
      setPens(prev => [...prev, { ...newPen, brand: trimmedBrand, id: Date.now().toString(), inkId: null }]);
      setNewPen({ brand: '', model: '', nib: { size: '', material: '', features: '' } });
      setNewPenLogo(null);
      setAddPenModalOpen(false);
    }
  };

  const handleAddInk = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInk.brand && newInk.name) {
      const trimmedBrand = newInk.brand.trim();
      if (newInkLogo && trimmedBrand) {
        setBrandLogos(prev => ({ ...prev, [normalizeBrand(trimmedBrand)]: newInkLogo }));
      }
      setInks(prev => [...prev, { ...newInk, brand: trimmedBrand, id: Date.now().toString() }]);
      setNewInk({ brand: '', name: '', color: '#000000' });
      setNewInkLogo(null);
      setAddInkModalOpen(false);
    }
  };
  
  // --- EXISTING HANDLERS (omitted for brevity, no changes) ---
  const handleOpenInkSelector = (pen: Pen) => {
      setPenToInk(pen);
  };
  
  const handleCleanPen = (penId: string) => {
      setPens(pens.map(p => p.id === penId ? {...p, inkId: null} : p));
  };
  
  const handleInkPen = (penId: string, inkId: string) => {
      setPens(pens.map(p => p.id === penId ? {...p, inkId} : p));
      setPenToInk(null);
  };

  const setSortKey = (key: 'brand' | 'model' | 'nibSize') => {
    setPenSortConfig(prev => ({
        key,
        direction: prev.key === key ? (prev.direction === 'ascending' ? 'descending' : 'ascending') : 'ascending'
    }));
  }
  // --- END OF EXISTING HANDLERS ---
  
  const handleIdentifyImage = async (base64: string) => {
    setIdentifierImage(base64);
    setIsIdentifying(true);
    setIdentificationResult(null);
    setIdentificationError(null);

    const prompt = `Identify the brand and model/name of the fountain pen or ink in this image. Respond ONLY in the format: "Brand: [brand_name], Name: [model/ink_name]"`;
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64.split(',')[1],
      },
    };

    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }, imagePart] },
      });
      const text = response.text;
      
      const brandMatch = text.match(/Brand: (.*?),/);
      const nameMatch = text.match(/Name: (.*?)$/);

      if (brandMatch && nameMatch) {
        setIdentificationResult({ brand: brandMatch[1].trim(), name: nameMatch[1].trim() });
      } else {
        throw new Error('无法解析识别结果，请重试。');
      }

    } catch (error) {
      console.error("Identification failed:", error);
      setIdentificationError("识别失败，请检查网络或稍后重试。");
    } finally {
      setIsIdentifying(false);
    }
  };
  
  const addIdentifiedPen = () => {
    if (!identificationResult) return;
    setNewPen({
      brand: identificationResult.brand,
      model: identificationResult.name,
      nib: { size: '', material: '', features: '' }
    });
    if (identifierImage) setNewPenLogo(identifierImage);
    setIdentifierOpen(false);
    setAddPenModalOpen(true);
  };

  const addIdentifiedInk = () => {
    if (!identificationResult) return;
    setNewInk({
      brand: identificationResult.brand,
      name: identificationResult.name,
      color: '#000000'
    });
    if (identifierImage) setNewInkLogo(identifierImage);
    setIdentifierOpen(false);
    setAddInkModalOpen(true);
  };

  const resetIdentifier = () => {
    setIdentifierOpen(false);
    setIdentifierImage(null);
    setIdentificationResult(null);
    setIdentificationError(null);
    setIsIdentifying(false);
  }

  const Fab = () => (
    <button
      onClick={() => activeTab === 'pens' ? setAddPenModalOpen(true) : setAddInkModalOpen(true)}
      className="absolute bottom-5 right-5 bg-[var(--color-button-accent-bg)] text-[var(--color-button-accent-text)] rounded-full p-3.5 shadow-lg hover:bg-[var(--color-button-accent-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-button-accent-bg)] focus:ring-opacity-50 transform hover:scale-105 transition-transform duration-200"
      aria-label={activeTab === 'pens' ? '添加新钢笔' : '添加新墨水'}
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style>{`
        body {
          -webkit-tap-highlight-color: transparent;
        }
        .texture-paper {
          position: relative;
          z-index: 0;
        }
        .texture-paper::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url("${paperTextureUrl}");
          opacity: var(--paper-texture-opacity);
          mix-blend-mode: var(--paper-texture-blend-mode);
          pointer-events: none;
          border-radius: inherit;
          z-index: -1;
        }
      `}</style>
      <div className="w-full max-w-sm h-[750px] bg-[var(--color-surface-secondary)] rounded-[32px] shadow-2xl p-2 flex flex-col overflow-hidden ring-1 ring-black/10 backdrop-blur-sm" style={{boxShadow: `0 25px 50px -12px var(--color-shadow)`}}>
        <div className="bg-[var(--color-surface-primary)] rounded-[24px] flex-1 flex flex-col relative overflow-hidden backdrop-blur-lg texture-paper">
          <header className="flex items-center justify-between space-x-2 p-3 border-b border-[var(--color-border-primary)] flex-shrink-0">
            <div className="flex items-center space-x-2">
                <BrandLogoIcon className="w-8 h-8 text-[var(--color-text-primary)]" />
                <div>
                  <h1 className="text-lg font-bold text-[var(--color-text-primary)]">墨印</h1>
                  <p className="text-xs text-[var(--color-text-secondary)]">我的收藏</p>
                </div>
            </div>
             <div className="flex items-center space-x-1">
                <button onClick={() => setIdentifierOpen(true)} className="p-1 rounded-full hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-accent)] hover:text-[var(--color-text-accent)]" title="AI 识别">
                    <SparklesIcon className="w-5 h-5" />
                </button>
                <div className="relative">
                    <button onClick={() => setShowThemeSwitcher(!showThemeSwitcher)} className="p-1 rounded-full hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        <PaintBrushIcon className="w-5 h-5" />
                    </button>
                    {showThemeSwitcher && (
                        <div className="absolute top-full right-0 mt-2 z-10">
                            <ThemeSwitcher currentTheme={theme} onThemeChange={(t) => { setTheme(t); setShowThemeSwitcher(false); }} />
                        </div>
                    )}
                </div>
            </div>
          </header>

          <nav className="flex p-1 bg-[var(--color-surface-secondary)] mx-3 mt-2 rounded-lg flex-shrink-0 backdrop-blur-sm">
            <button onClick={() => setActiveTab('pens')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'pens' ? 'bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-accent)] texture-paper' : 'text-[var(--color-text-secondary)]'}`}>钢笔</button>
            <button onClick={() => setActiveTab('inks')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'inks' ? 'bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-accent)] texture-paper' : 'text-[var(--color-text-secondary)]'}`}>墨水</button>
          </nav>
          
          <main className="flex-1 overflow-y-auto p-3 pb-20">
            {/* --- PEN AND INK LISTS (omitted for brevity, no changes) --- */}
            {activeTab === 'pens' && (
              <div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={penSearch}
                    onChange={e => setPenSearch(e.target.value)}
                    placeholder="按品牌、型号或笔尖搜索..."
                    className="w-full border border-[var(--color-border-input)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 text-sm focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] placeholder:text-[var(--color-text-subtle)]"
                    aria-label="搜索钢笔"
                  />
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">排序:</span>
                  <div className="flex space-x-1 p-0.5 bg-[var(--color-surface-secondary)] rounded-lg backdrop-blur-sm">
                    {(['brand', 'model', 'nibSize'] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSortKey(key)}
                        className={`flex items-center space-x-1 capitalize px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                          penSortConfig.key === key ? 'bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-accent)] texture-paper' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-primary)]'
                        }`}
                      >
                        <span>{key === 'brand' ? '品牌' : key === 'model' ? '型号' : '笔尖'}</span>
                        {penSortConfig.key === key && (
                          penSortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredPens.map(pen => (
                  <PenItem key={pen.id} pen={pen} ink={getInkById(pen.inkId)} onInk={handleOpenInkSelector} onClean={handleCleanPen} customLogo={brandLogos[normalizeBrand(pen.brand)]} />
                ))}
              </div>
            )}
            {activeTab === 'inks' && (
              <div>
                <div className="mb-3 flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={inkSearch}
                      onChange={e => setInkSearch(e.target.value)}
                      placeholder="按品牌、名称搜索..."
                      className="w-full border border-[var(--color-border-input)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 text-sm focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] placeholder:text-[var(--color-text-subtle)]"
                      aria-label="搜索墨水"
                    />
                  </div>
                  <div className="relative">
                    <label 
                      htmlFor="color-picker" 
                      className="w-9 h-9 flex items-center justify-center rounded-md cursor-pointer border-2"
                      style={{ 
                        backgroundColor: selectedColor || 'transparent',
                        borderColor: selectedColor ? selectedColor : 'var(--color-border-input)'
                      }}
                      aria-label="选择颜色以筛选"
                    >
                      {!selectedColor && <ColorSwatchIcon className="w-5 h-5 text-[var(--color-text-subtle)]" />}
                    </label>
                    <input
                      id="color-picker"
                      type="color"
                      value={selectedColor || '#ffffff'}
                      onChange={e => setSelectedColor(e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    {selectedColor && (
                      <button 
                        onClick={() => setSelectedColor(null)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white rounded-full p-0.5 shadow-md flex items-center justify-center hover:bg-gray-700 transition-colors"
                        aria-label="清除颜色筛选"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {filteredInks.map(ink => (
                    <div key={ink.id} className="bg-[var(--color-surface-primary)] p-2 rounded-xl shadow-sm text-center backdrop-blur-lg texture-paper" style={{boxShadow: `0 1px 2px 0 var(--color-shadow)`}}>
                      <div className="relative w-12 h-12 mx-auto mb-2">
                          <BrandLogo brandName={ink.brand} className="w-12 h-12" customLogo={brandLogos[normalizeBrand(ink.brand)]} />
                          <div 
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                              style={{ backgroundColor: ink.color }}
                          ></div>
                      </div>
                      <p className="font-semibold text-xs text-[var(--color-text-primary)] truncate">{ink.brand}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{ink.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
          
          <Fab />
        </div>
      </div>
      
      {/* --- ADD PEN/INK MODALS (omitted for brevity, no changes) --- */}
      <Modal isOpen={isAddPenModalOpen} onClose={() => { setAddPenModalOpen(false); setNewPenLogo(null); }} title="添加新钢笔">
        <form onSubmit={handleAddPen} className="space-y-3">
          <ImageUploader 
            brandName={newPen.brand}
            currentImage={newPenLogo}
            onImageSelect={setNewPenLogo} 
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">品牌</label>
            <input type="text" value={newPen.brand} onChange={e => setNewPen({...newPen, brand: e.target.value})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" required />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">型号</label>
            <input type="text" value={newPen.model} onChange={e => setNewPen({...newPen, model: e.target.value})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" required />
          </div>
          <div className="space-y-3 p-3 bg-[var(--color-surface-inset)] rounded-lg border border-[var(--color-border-primary)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] -mb-1">笔尖详情</h3>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">尺寸</label>
              <input type="text" value={newPen.nib.size} onChange={e => setNewPen({...newPen, nib: {...newPen.nib, size: e.target.value}})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" placeholder="例如: F, 1.1 Stub" required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">材质</label>
              <input type="text" value={newPen.nib.material} onChange={e => setNewPen({...newPen, nib: {...newPen.nib, material: e.target.value}})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" placeholder="例如: 钢尖, 14k金" required />
            </div>
             <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">特性 (可选)</label>
              <input type="text" value={newPen.nib.features} onChange={e => setNewPen({...newPen, nib: {...newPen.nib, features: e.target.value}})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" placeholder="例如: 双色, 雕刻" />
            </div>
          </div>
          <button type="submit" className="w-full bg-[var(--color-button-accent-bg)] text-[var(--color-button-accent-text)] py-2 rounded-lg font-semibold hover:bg-[var(--color-button-accent-hover-bg)] transition-colors flex items-center justify-center space-x-2">
            <PenIcon className="w-5 h-5" />
            <span>添加钢笔</span>
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAddInkModalOpen} onClose={() => { setAddInkModalOpen(false); setNewInkLogo(null); }} title="添加新墨水">
        <form onSubmit={handleAddInk} className="space-y-3">
          <ImageUploader 
            brandName={newInk.brand}
            currentImage={newInkLogo}
            onImageSelect={setNewInkLogo} 
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">品牌</label>
            <input type="text" value={newInk.brand} onChange={e => setNewInk({...newInk, brand: e.target.value})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" required />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">墨水名称</label>
            <input type="text" value={newInk.name} onChange={e => setNewInk({...newInk, name: e.target.value})} className="mt-1 block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" required />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">颜色</label>
            <div className="flex items-center space-x-2 mt-1">
              <input type="color" value={newInk.color} onChange={e => setNewInk({...newInk, color: e.target.value})} className="h-9 w-9 p-0 border-0 cursor-pointer rounded-md" />
              <input type="text" value={newInk.color} onChange={e => setNewInk({...newInk, color: e.target.value})} className="block w-full border border-[var(--color-border-input)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-md shadow-sm p-2 focus:ring-[var(--color-text-accent)] focus:border-[var(--color-text-accent)] text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full bg-[var(--color-button-accent-bg)] text-[var(--color-button-accent-text)] py-2 rounded-lg font-semibold hover:bg-[var(--color-button-accent-hover-bg)] transition-colors flex items-center justify-center space-x-2">
            <ColorSwatchIcon className="w-5 h-5" />
            <span>添加新墨水</span>
          </button>
        </form>
      </Modal>
      
      <Modal isOpen={penToInk !== null} onClose={() => setPenToInk(null)} title={`为 ${penToInk?.brand || ''} ${penToInk?.model || ''} 上墨`}>
        <div className="max-h-80 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {inks.map(ink => (
              <button key={ink.id} onClick={() => penToInk && handleInkPen(penToInk.id, ink.id)} className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors text-left">
                <BrandLogo brandName={ink.brand} className="w-8 h-8 flex-shrink-0" customLogo={brandLogos[normalizeBrand(ink.brand)]} />
                <div className="flex-grow">
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm">{ink.brand}</p>
                  <p className="text-[var(--color-text-secondary)] text-xs truncate">{ink.name}</p>
                </div>
                <div className="w-5 h-5 rounded-full border border-[var(--color-border-primary)] flex-shrink-0" style={{ backgroundColor: ink.color }}></div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isIdentifierOpen} onClose={resetIdentifier} title="AI 识别">
        <div className="space-y-4">
          {!identifierImage && (
             <div className="text-center">
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">上传一张钢笔或墨水的照片，AI会尝试识别它。</p>
                <ImageUploader onImageSelect={handleIdentifyImage} />
             </div>
          )}
          {isIdentifying && (
            <div className="flex flex-col items-center justify-center space-y-3 p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-text-accent)]"></div>
              <p className="text-sm text-[var(--color-text-secondary)]">正在识别中...</p>
            </div>
          )}
          {identificationError && (
             <div className="text-center text-[var(--color-text-danger)] bg-[var(--color-button-danger-hover-bg)] p-3 rounded-lg">
                <p className="font-semibold">出错了</p>
                <p className="text-sm">{identificationError}</p>
                <button onClick={() => setIdentifierImage(null)} className="mt-2 text-sm font-semibold text-[var(--color-text-accent)]">重试</button>
            </div>
          )}
          {identificationResult && (
            <div className="space-y-4 text-center">
              <div>
                <p className="text-sm text-[var(--color-text-subtle)]">识别结果:</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{identificationResult.brand}</p>
                <p className="text-[var(--color-text-secondary)]">{identificationResult.name}</p>
              </div>
              <div className="flex justify-center">
                {identifierImage && <img src={identifierImage} alt="Identified item" className="w-24 h-24 rounded-lg object-cover shadow-md" />}
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-sm text-[var(--color-text-secondary)]">要将此物品添加到收藏吗？</p>
                <div className="flex space-x-2">
                  <button onClick={addIdentifiedPen} className="w-full bg-[var(--color-surface-inset)] text-[var(--color-text-primary)] py-2 rounded-lg font-semibold hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-center space-x-2">
                    <PenIcon className="w-5 h-5" />
                    <span>添加为钢笔</span>
                  </button>
                  <button onClick={addIdentifiedInk} className="w-full bg-[var(--color-surface-inset)] text-[var(--color-text-primary)] py-2 rounded-lg font-semibold hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-center space-x-2">
                    <ColorSwatchIcon className="w-5 h-5" />
                    <span>添加为墨水</span>
                  </button>
                </div>
              </div>
               <button onClick={() => setIdentifierImage(null)} className="mt-2 text-sm font-semibold text-[var(--color-text-accent)]">识别另一张</button>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default App;