import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import GlassInput from '../components/GlassInput.jsx';
import BottomSheet from '../components/BottomSheet.jsx';
import SwipeToDelete from '../components/SwipeToDelete.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { api } from '../api.js';

export default function Recipes({ onLoad, refreshKey }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editForm, setEditForm] = useState(emptyRecipeForm());

  useEffect(() => { load(); }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(recipe) {
    setEditingRecipe(recipe);
    setEditForm({
      name: recipe.name ?? '',
      flavor_name: recipe.flavor_name ?? '',
      volume_ml: String(recipe.volume_ml ?? ''),
      nicotine_mg: String(recipe.nicotine_mg ?? ''),
      vg_ratio: String(recipe.vg_ratio ?? ''),
      pg_ratio: String(recipe.pg_ratio ?? ''),
      booster_strength: String(recipe.booster_strength ?? ''),
      flavor_pct: String(recipe.flavor_pct ?? ''),
      note: recipe.note ?? '',
    });
    setActionStatus(null);
  }

  function closeEdit() {
    setEditingRecipe(null);
    setEditForm(emptyRecipeForm());
    setActionStatus(null);
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      setRecipes(await api.getRecipes());
    } catch (loadError) {
      setError(loadError.message || 'Nepodařilo se načíst recepty');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteRecipe(id);
      setRecipes((items) => items.filter((item) => item.id !== id));
      setActionStatus({ type: 'ok', text: 'Recept smazán' });
    } catch (deleteError) {
      setActionStatus({ type: 'error', text: deleteError.message || 'Mazání receptu selhalo' });
    }
  }

  async function handleDuplicate(recipe) {
    try {
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
      setRecipes((items) => [copy, ...items]);
      setActionStatus({ type: 'ok', text: 'Recept zduplikován' });
    } catch (duplicateError) {
      setActionStatus({ type: 'error', text: duplicateError.message || 'Duplikace receptu selhala' });
    }
  }

  async function handleSaveEdit() {
    if (!editingRecipe) return;
    try {
      const updated = await api.updateRecipe(editingRecipe.id, {
        name: editForm.name,
        flavor_name: editForm.flavor_name || null,
        volume_ml: parseFloat(editForm.volume_ml),
        nicotine_mg: parseFloat(editForm.nicotine_mg),
        vg_ratio: parseFloat(editForm.vg_ratio),
        pg_ratio: parseFloat(editForm.pg_ratio),
        booster_strength: parseFloat(editForm.booster_strength),
        flavor_pct: parseFloat(editForm.flavor_pct),
        note: editForm.note || null,
      });
      setRecipes((items) => items.map((item) => item.id === editingRecipe.id ? updated : item));
      setActionStatus({ type: 'ok', text: 'Recept upraven' });
      closeEdit();
    } catch (saveError) {
      setActionStatus({ type: 'error', text: saveError.message || 'Nepodařilo se uložit změny' });
    }
  }

  function handleExport() {
    const json = JSON.stringify(recipes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapemixer-recepty-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = recipes.filter((recipe) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return recipe.name.toLowerCase().includes(query) || (recipe.flavor_name || '').toLowerCase().includes(query);
  });

  if (loading) return <div className="screen-enter"><SkeletonList count={3} /></div>;

  return (
    <div className="flex flex-col h-full screen-enter">
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

      <StatusMessage status={error ? { type: 'error', text: error } : null} compact className="mb-3" />
      <StatusMessage status={actionStatus} compact className="mb-3" />

      {filtered.length === 0 && !error && (
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
          {filtered.map((recipe) => (
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
                    <GlassButton onClick={() => startEdit(recipe)} style={{ fontSize: 12, padding: '6px 10px' }} title="Upravit">
                      Upravit
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

                {recipe.note ? (
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '10px 0 0' }}>{recipe.note}</p>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: '10px 0 0' }}>Bez poznámky</p>
                )}
              </GlassCard>
            </SwipeToDelete>
          ))}
        </div>
      </PullToRefresh>

      <BottomSheet open={Boolean(editingRecipe)} onClose={closeEdit} title="Upravit recept">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassInput label="Název" value={editForm.name} onChange={(value) => setEditForm((form) => ({ ...form, name: value }))} />
          <GlassInput label="Příchuť" value={editForm.flavor_name} onChange={(value) => setEditForm((form) => ({ ...form, flavor_name: value }))} placeholder="volitelné" />
          <div className="grid grid-cols-2 gap-3">
            <GlassInput label="Objem" value={editForm.volume_ml} onChange={(value) => setEditForm((form) => ({ ...form, volume_ml: value }))} suffix="ml" />
            <GlassInput label="Nikotin" value={editForm.nicotine_mg} onChange={(value) => setEditForm((form) => ({ ...form, nicotine_mg: value }))} suffix="mg/ml" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GlassInput label="VG %" value={editForm.vg_ratio} onChange={(value) => setEditForm((form) => ({ ...form, vg_ratio: value }))} />
            <GlassInput label="PG %" value={editForm.pg_ratio} onChange={(value) => setEditForm((form) => ({ ...form, pg_ratio: value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GlassInput label="Booster" value={editForm.booster_strength} onChange={(value) => setEditForm((form) => ({ ...form, booster_strength: value }))} suffix="mg/ml" />
            <GlassInput label="Příchuť %" value={editForm.flavor_pct} onChange={(value) => setEditForm((form) => ({ ...form, flavor_pct: value }))} suffix="%" />
          </div>
          <GlassInput label="Poznámka" value={editForm.note} onChange={(value) => setEditForm((form) => ({ ...form, note: value }))} placeholder="volitelné" />
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassButton variant="primary" onClick={handleSaveEdit} className="flex-1">Uložit změny</GlassButton>
            <GlassButton onClick={closeEdit} className="px-5">Zrušit</GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function emptyRecipeForm() {
  return {
    name: '',
    flavor_name: '',
    volume_ml: '',
    nicotine_mg: '',
    vg_ratio: '',
    pg_ratio: '',
    booster_strength: '',
    flavor_pct: '',
    note: '',
  };
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
  const date = new Date(str);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
}
