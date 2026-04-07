import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import SwipeToDelete from '../components/SwipeToDelete.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import { api } from '../api.js';

export default function Recipes({ onLoad, refreshKey }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [refreshKey]);

  async function load() {
    setLoading(true);
    try { setRecipes(await api.getRecipes()); } catch {}
    setLoading(false);
  }

  async function handleDelete(id) {
    await api.deleteRecipe(id);
    setRecipes(r => r.filter(x => x.id !== id));
  }

  async function handleDuplicate(recipe) {
    const copy = await api.createRecipe({
      name: `${recipe.name} (kopie)`,
      flavor_name: recipe.flavor_name,
      volume_ml: recipe.volume_ml,
      nicotine_mg: recipe.nicotine_mg,
      vg_ratio: recipe.vg_ratio,
      pg_ratio: recipe.pg_ratio,
      booster_strength: recipe.booster_strength,
      flavor_pct: recipe.flavor_pct,
      note: recipe.note,
    });
    setRecipes(r => [copy, ...r]);
  }

  async function handleSaveNote(recipe) {
    const updated = await api.updateRecipe(recipe.id, { ...recipe, note: noteText });
    setRecipes(r => r.map(x => x.id === recipe.id ? updated : x));
    setEditingNote(null);
  }

  function handleExport() {
    const json = JSON.stringify(recipes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapemixer-recepty-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = recipes.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.flavor_name || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="screen-enter"><SkeletonList count={3} /></div>;

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Search + export */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="app-input"
            style={{ width: '100%', paddingLeft: 32 }}
            placeholder="Hledat recept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off" autoCorrect="off" spellCheck="false"
          />
        </div>
        {recipes.length > 0 && (
          <GlassButton onClick={handleExport} style={{ padding: '0 14px', fontSize: 12, flexShrink: 0 }}>
            Export
          </GlassButton>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 192, gap: 8 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" />
          </svg>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: 0 }}>
            {search ? 'Žádný výsledek' : 'Žádné recepty'}
          </p>
          {!search && <p style={{ color: 'var(--fg-subtle)', fontSize: 12, margin: 0 }}>Ulož recept v Mixeru</p>}
        </div>
      )}

      <PullToRefresh onRefresh={load}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
          {filtered.map(recipe => (
            <SwipeToDelete key={recipe.id} onDelete={() => handleDelete(recipe.id)}>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.name}</p>
                    {recipe.flavor_name && (
                      <p style={{ fontSize: 12, marginTop: 2, color: 'var(--fg-muted)', margin: '2px 0 0' }}>{recipe.flavor_name}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <GlassButton variant="primary" onClick={() => onLoad(recipe)} style={{ fontSize: 12, padding: '6px 14px' }}>
                      Načíst
                    </GlassButton>
                    <GlassButton onClick={() => handleDuplicate(recipe)} style={{ fontSize: 12, padding: '6px 10px' }} title="Duplikovat">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </GlassButton>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
                  <Pill label="Objem" value={`${recipe.volume_ml} ml`} />
                  <Pill label="Nikotin" value={`${recipe.nicotine_mg} mg`} highlight />
                  <Pill label="Báze" value={`${recipe.vg_ratio}/${recipe.pg_ratio}`} />
                  <Pill label="Booster" value={`${recipe.booster_strength} mg`} />
                  <Pill label="Příchuť" value={`${recipe.flavor_pct}%`} />
                  <Pill label="Vytvořen" value={fmtDate(recipe.created_at)} small />
                </div>

                {editingNote === recipe.id ? (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <input
                      className="app-input"
                      style={{ flex: 1 }}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Poznámka…"
                      autoFocus
                      autoComplete="off" autoCorrect="off" spellCheck="false"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(recipe)}
                    />
                    <GlassButton onClick={() => handleSaveNote(recipe)} style={{ fontSize: 12, padding: '0 12px' }}>Uložit</GlassButton>
                    <GlassButton onClick={() => setEditingNote(null)} style={{ fontSize: 12, padding: '0 10px' }}>✕</GlassButton>
                  </div>
                ) : (
                  <button onClick={() => { setEditingNote(recipe.id); setNoteText(recipe.note ?? ''); }}
                    style={{ marginTop: 8, textAlign: 'left', width: '100%', background: 'none', border: 'none', padding: '2px 0' }}>
                    {recipe.note ? (
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>{recipe.note}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>+ přidat poznámku</p>
                    )}
                  </button>
                )}
              </GlassCard>
            </SwipeToDelete>
          ))}
        </div>
      </PullToRefresh>
    </div>
  );
}

function Pill({ label, value, highlight, small }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>{label}</span>
      <span className="mono" style={{
        fontWeight: 600,
        fontSize: small ? 11 : 13,
        color: highlight ? 'var(--accent)' : 'var(--fg)',
      }}>
        {value}
      </span>
    </div>
  );
}

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
}
