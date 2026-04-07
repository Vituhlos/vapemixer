import { useState, useEffect, useCallback } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Calculator from './screens/Calculator.jsx';
import Recipes from './screens/Recipes.jsx';
import Stock from './screens/Stock.jsx';
import History from './screens/History.jsx';
import PWABanner from './components/PWABanner.jsx';
import SettingsSheet from './components/SettingsSheet.jsx';
import { useCalculator } from './hooks/useCalculator.js';
import { usePreferences } from './hooks/usePreferences.js';
import { api } from './api.js';

const TAB_ORDER = ['calculator', 'recipes', 'stock', 'history'];

function hasStockAlert(items) {
  return items.some(i => i.amount_ml <= 0 || (i.capacity_ml > 0 && (i.amount_ml / i.capacity_ml) < 0.2));
}

export default function App() {
  const [tab, setTab] = useState('calculator');
  const [animDir, setAnimDir] = useState(1);
  const [recipesKey, setRecipesKey] = useState(0);
  const [stockBadge, setStockBadge] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { prefs, updatePref } = usePreferences();
  const calc = useCalculator(prefs);

  const checkStock = useCallback(async () => {
    try {
      const items = await api.getStock();
      setStockBadge(hasStockAlert(items));
    } catch {}
  }, []);

  useEffect(() => { checkStock(); }, [checkStock]);

  function changeTab(next) {
    if (next === tab) return;
    // Clear badge when navigating to stock
    if (next === 'stock') setStockBadge(false);
    // Re-check when leaving stock (user may have restocked)
    if (tab === 'stock') checkStock();
    setAnimDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1);
    setTab(next);
  }

  function handleLoadRecipe(recipe) {
    calc.loadRecipe(recipe);
    changeTab('calculator');
  }

  function handleLoadHistory(entry) {
    calc.loadHistory(entry);
    changeTab('calculator');
  }

  return (
    <div className="app-shell" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        flexShrink: 0,
        padding: '14px 20px 10px',
        paddingTop: `max(14px, env(safe-area-inset-top))`,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0C10" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v4M12 3v6M16 3v4" />
              <path d="M5 10h14l-2 9H7L5 10z" />
              <path d="M9 14h6" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.1 }}>VapeMixer</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-muted)' }}>DIY e-liquid kalkulačka</p>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            background: 'none', border: 'none', padding: 6, borderRadius: 8,
            color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
          aria-label="Nastavení"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* PWA banner */}
      <div style={{ flexShrink: 0, paddingTop: 8 }}>
        <PWABanner />
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <main
          key={tab}
          className="scrollable"
          style={{
            height: '100%',
            padding: '16px 16px 24px',
            overflowY: 'auto',
            animation: `tabSlideIn${animDir > 0 ? 'Right' : 'Left'} 0.2s var(--easing)`,
          }}
          onTouchStart={(e) => {
            const tag = e.target.tagName.toLowerCase();
            if (!['input', 'textarea', 'select'].includes(tag) && !e.target.closest('button')) {
              document.activeElement?.blur();
            }
          }}
        >
          {tab === 'calculator' && (
            <Calculator
              calc={calc}
              onSaved={() => setRecipesKey(k => k + 1)}
              onStockChange={checkStock}
            />
          )}
          {tab === 'recipes'    && <Recipes onLoad={handleLoadRecipe} refreshKey={recipesKey} />}
          {tab === 'stock'      && <Stock />}
          {tab === 'history'    && <History onLoad={handleLoadHistory} />}
        </main>

        {/* Fade na spodu */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Bottom Nav */}
      <div style={{ flexShrink: 0 }}>
        <BottomNav active={tab} onChange={changeTab} badges={{ stock: stockBadge }} />
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} prefs={prefs} updatePref={updatePref} />
    </div>
  );
}
