import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import GlassInput from '../components/GlassInput.jsx';
import BottomSheet from '../components/BottomSheet.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { api } from '../api.js';

const TYPE_LABELS = {
  baze_mtl: 'Báze MTL',
  baze_dl: 'Báze DL',
  booster_mtl: 'Booster MTL',
  booster_dl: 'Booster DL',
  prichut: 'Příchuť',
};
const TYPE_OPTIONS = Object.entries(TYPE_LABELS);

export default function Stock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustVal, setAdjustVal] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyStockForm());
  const [form, setForm] = useState({ name: '', type: 'baze_mtl', amount_ml: '', capacity_ml: 100, note: '' });

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await api.getStock());
    } catch (loadError) {
      setError(loadError.message || 'Nepodařilo se načíst sklad');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.name.trim()) {
      setImportStatus({ type: 'error', text: 'Název položky je povinný' });
      return;
    }

    try {
      const item = await api.createStock({
        name: form.name,
        type: form.type,
        amount_ml: parseFloat(form.amount_ml) || 0,
        capacity_ml: parseFloat(form.capacity_ml) || 100,
        note: form.note || null,
      });
      setItems((records) => [...records, item]);
      setForm({ name: '', type: 'baze_mtl', amount_ml: '', capacity_ml: 100, note: '' });
      setAdding(false);
      setImportStatus({ type: 'ok', text: 'Položka přidána' });
    } catch (addError) {
      setImportStatus({ type: 'error', text: addError.message || 'Nepodařilo se přidat položku' });
    }
  }

  async function handleAdjust(item, delta) {
    try {
      const newAmount = Math.max(0, item.amount_ml + delta);
      const updated = await api.updateStock(item.id, { ...item, amount_ml: newAmount });
      setItems((records) => records.map((record) => record.id === item.id ? updated : record));
      setAdjusting(null);
      setAdjustVal('');
      setImportStatus({ type: 'ok', text: 'Množství upraveno' });
    } catch (adjustError) {
      setImportStatus({ type: 'error', text: adjustError.message || 'Nepodařilo se upravit množství' });
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteStock(id);
      setItems((records) => records.filter((record) => record.id !== id));
      setImportStatus({ type: 'ok', text: 'Položka smazána' });
    } catch (deleteError) {
      setImportStatus({ type: 'error', text: deleteError.message || 'Mazání položky selhalo' });
    }
  }

  function startEdit(item) {
    setEditingItem(item);
    setEditForm({
      name: item.name ?? '',
      type: item.type ?? 'baze_mtl',
      amount_ml: String(item.amount_ml ?? ''),
      capacity_ml: String(item.capacity_ml ?? ''),
      note: item.note ?? '',
    });
    setImportStatus(null);
  }

  function closeEdit() {
    setEditingItem(null);
    setEditForm(emptyStockForm());
  }

  async function handleSaveEdit() {
    if (!editingItem) return;
    try {
      const updated = await api.updateStock(editingItem.id, {
        name: editForm.name,
        type: editForm.type,
        amount_ml: parseFloat(editForm.amount_ml) || 0,
        capacity_ml: parseFloat(editForm.capacity_ml) || 100,
        note: editForm.note || null,
      });
      setItems((records) => records.map((record) => record.id === editingItem.id ? updated : record));
      closeEdit();
      setImportStatus({ type: 'ok', text: 'Položka upravena' });
    } catch (saveError) {
      setImportStatus({ type: 'error', text: saveError.message || 'Nepodařilo se uložit změny' });
    }
  }

  function handleExport() {
    const data = items.map(({ name, type, amount_ml, capacity_ml, note }) => ({ name, type, amount_ml, capacity_ml, note }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapemixer-sklad-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Neplatný formát');
      let added = 0;
      for (const item of data) {
        if (!item.name || !item.type) continue;
        await api.createStock({
          name: item.name,
          type: item.type,
          amount_ml: parseFloat(item.amount_ml) || 0,
          capacity_ml: parseFloat(item.capacity_ml) || 100,
          note: item.note || null,
        });
        added++;
      }
      await load();
      setImportStatus({ type: 'ok', text: `Importováno ${added} položek` });
    } catch (importError) {
      setImportStatus({ type: 'error', text: importError.message || 'Chyba importu' });
    }
  }

  if (loading) return <div className="screen-enter"><SkeletonList count={2} /></div>;

  const grouped = TYPE_OPTIONS.map(([type, label]) => ({
    type, label, items: items.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col h-full screen-enter">
      <PullToRefresh onRefresh={load}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
          <StatusMessage status={error ? { type: 'error', text: error } : null} compact />
          <StatusMessage status={importStatus} compact />

          {grouped.map(({ type, label, items: groupItems }) => (
            <div key={type}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8 }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupItems.map((item) => {
                  const pct = item.capacity_ml > 0 ? (item.amount_ml / item.capacity_ml) * 100 : 0;
                  const isEmpty = item.amount_ml <= 0;
                  const isLow = !isEmpty && pct < 20;
                  const statusLabel = isEmpty ? 'prázdný' : isLow ? 'nízká zásoba' : null;
                  const statusBg = isEmpty ? 'rgba(255,69,58,0.12)' : 'rgba(255,159,10,0.12)';
                  const statusColor = isEmpty ? 'var(--danger)' : 'var(--accent-warm)';
                  const barColor = isEmpty ? 'var(--danger)' : isLow ? 'var(--accent-warm)' : 'var(--success)';

                  return (
                    <GlassCard key={item.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontWeight: 500, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                            {statusLabel && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                                background: statusBg, color: statusColor,
                              }}>
                                {statusLabel}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                              <div style={{
                                height: 4, borderRadius: 2,
                                width: `${Math.min(100, pct)}%`,
                                background: barColor,
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)', flexShrink: 0, minWidth: 72 }}>
                              {item.amount_ml} / {item.capacity_ml} ml
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <GlassButton onClick={() => startEdit(item)} style={{ fontSize: 12, padding: '6px 10px' }}>
                            Upravit
                          </GlassButton>
                          <GlassButton
                            onClick={() => { setAdjusting(adjusting === item.id ? null : item.id); setAdjustVal(''); }}
                            style={{ fontSize: 13, padding: '6px 10px', fontWeight: 600 }}
                          >
                            ±
                          </GlassButton>
                          <GlassButton variant="danger" onClick={() => handleDelete(item.id)} style={{ fontSize: 12, padding: '6px 10px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </GlassButton>
                        </div>
                      </div>

                      {item.note && (
                        <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '8px 0 0' }}>{item.note}</p>
                      )}

                      {adjusting === item.id && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input
                            className="app-input"
                            style={{ width: '100%', textAlign: 'center' }}
                            type="text"
                            inputMode="decimal"
                            value={adjustVal}
                            onChange={(e) => setAdjustVal(e.target.value.replace(',', '.'))}
                            onFocus={(e) => { const target = e.target; setTimeout(() => { try { target.setSelectionRange(0, target.value.length); } catch {} }, 0); }}
                            placeholder="množství v ml…"
                            autoFocus
                            autoComplete="off"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdjust(item, parseFloat(adjustVal) || 0); }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <GlassButton onClick={() => handleAdjust(item, parseFloat(adjustVal) || 0)} style={{ flex: 1, padding: '9px 0', fontSize: 13, color: 'var(--success)' }}>
                              + Přidat
                            </GlassButton>
                            <GlassButton variant="danger" onClick={() => handleAdjust(item, -(parseFloat(adjustVal) || 0))} style={{ flex: 1, padding: '9px 0', fontSize: 13 }}>
                              − Odebrat
                            </GlassButton>
                            <GlassButton onClick={() => setAdjusting(null)} style={{ padding: '9px 12px', fontSize: 13 }}>✕</GlassButton>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}

          {items.length === 0 && !adding && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 128, gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /><path d="M12 12v5M9.5 14.5h5" />
              </svg>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: 0 }}>Sklad je prázdný</p>
            </div>
          )}

          {adding ? (
            <GlassCard>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 14 }}>Nová položka</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <GlassInput label="Název" value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} placeholder="např. Báze MTL 50/50" />
                <TypeButtons value={form.type} onChange={(value) => setForm((state) => ({ ...state, type: value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <GlassInput label="Množství (ml)" value={form.amount_ml} onChange={(value) => setForm((state) => ({ ...state, amount_ml: value }))} min={0} inputMode="decimal" />
                  <GlassInput label="Kapacita (ml)" value={form.capacity_ml} onChange={(value) => setForm((state) => ({ ...state, capacity_ml: value }))} min={1} inputMode="decimal" />
                </div>
                <GlassInput label="Poznámka" value={form.note} onChange={(value) => setForm((state) => ({ ...state, note: value }))} placeholder="volitelné" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <GlassButton variant="primary" onClick={handleAdd} className="flex-1">Přidat</GlassButton>
                  <GlassButton onClick={() => setAdding(false)} style={{ padding: '0 16px' }}>Zrušit</GlassButton>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <GlassButton variant="default" onClick={() => setAdding(true)} className="w-full py-3">
                + Přidat položku
              </GlassButton>
              <div style={{ display: 'flex', gap: 8 }}>
                {items.length > 0 && (
                  <GlassButton onClick={handleExport} style={{ flex: 1, padding: '10px 0', fontSize: 12 }}>
                    Export skladu
                  </GlassButton>
                )}
                <label style={{ flex: 1 }}>
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 0', fontSize: 12, borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--fg-muted)', cursor: 'pointer', fontWeight: 500,
                  }}>
                    Import skladu
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>

      <BottomSheet open={Boolean(editingItem)} onClose={closeEdit} title="Upravit položku skladu">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassInput label="Název" value={editForm.name} onChange={(value) => setEditForm((state) => ({ ...state, name: value }))} />
          <TypeButtons value={editForm.type} onChange={(value) => setEditForm((state) => ({ ...state, type: value }))} />
          <div className="grid grid-cols-2 gap-3">
            <GlassInput label="Množství (ml)" value={editForm.amount_ml} onChange={(value) => setEditForm((state) => ({ ...state, amount_ml: value }))} />
            <GlassInput label="Kapacita (ml)" value={editForm.capacity_ml} onChange={(value) => setEditForm((state) => ({ ...state, capacity_ml: value }))} />
          </div>
          <GlassInput label="Poznámka" value={editForm.note} onChange={(value) => setEditForm((state) => ({ ...state, note: value }))} placeholder="volitelné" />
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassButton variant="primary" onClick={handleSaveEdit} className="flex-1">Uložit změny</GlassButton>
            <GlassButton onClick={closeEdit}>Zrušit</GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function TypeButtons({ value, onChange }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8 }}>Typ</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TYPE_OPTIONS.map(([type, label]) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12,
              background: value === type ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: value === type ? '#0C0C10' : 'var(--fg-muted)',
              border: '1px solid ' + (value === type ? 'var(--accent)' : 'var(--border)'),
              fontWeight: value === type ? 700 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function emptyStockForm() {
  return {
    name: '',
    type: 'baze_mtl',
    amount_ml: '',
    capacity_ml: '',
    note: '',
  };
}
