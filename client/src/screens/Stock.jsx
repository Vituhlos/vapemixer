import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import GlassInput from '../components/GlassInput.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import { api } from '../api.js';

const TYPE_LABELS = {
  baze_mtl:    'Báze MTL',
  baze_dl:     'Báze DL',
  booster_mtl: 'Booster MTL',
  booster_dl:  'Booster DL',
  prichut:     'Příchuť',
};
const TYPE_OPTIONS = Object.entries(TYPE_LABELS);

export default function Stock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustVal, setAdjustVal] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'baze_mtl', amount_ml: '', capacity_ml: 100, note: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await api.getStock()); } catch {}
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    const item = await api.createStock({
      name: form.name, type: form.type,
      amount_ml: parseFloat(form.amount_ml) || 0,
      capacity_ml: parseFloat(form.capacity_ml) || 100,
      note: form.note || null,
    });
    setItems(i => [...i, item]);
    setForm({ name: '', type: 'baze_mtl', amount_ml: '', capacity_ml: 100, note: '' });
    setAdding(false);
  }

  async function handleAdjust(item, delta) {
    const newAmount = Math.max(0, item.amount_ml + delta);
    const updated = await api.updateStock(item.id, { ...item, amount_ml: newAmount });
    setItems(i => i.map(x => x.id === item.id ? updated : x));
    setAdjusting(null);
    setAdjustVal('');
  }

  async function handleDelete(id) {
    await api.deleteStock(id);
    setItems(i => i.filter(x => x.id !== id));
  }

  function handleExport() {
    const data = items.map(({ name, type, amount_ml, capacity_ml, note }) => ({ name, type, amount_ml, capacity_ml, note }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapemixer-sklad-${new Date().toISOString().slice(0,10)}.json`;
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
          name: item.name, type: item.type,
          amount_ml: parseFloat(item.amount_ml) || 0,
          capacity_ml: parseFloat(item.capacity_ml) || 100,
          note: item.note || null,
        });
        added++;
      }
      await load();
      setImportStatus(`Importováno ${added} položek`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus('Chyba importu');
      setTimeout(() => setImportStatus(null), 3000);
    }
  }

  if (loading) return <div className="screen-enter"><SkeletonList count={2} /></div>;

  const grouped = TYPE_OPTIONS.map(([type, label]) => ({
    type, label, items: items.filter(i => i.type === type)
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-full screen-enter">
      <PullToRefresh onRefresh={load}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
          {grouped.map(({ type, label, items: groupItems }) => (
            <div key={type}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8 }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupItems.map(item => {
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
                        <p style={{ fontSize: 12, marginTop: 8, color: 'var(--fg-muted)', margin: '8px 0 0' }}>{item.note}</p>
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
                            onFocus={(e) => { const t = e.target; setTimeout(() => { try { t.setSelectionRange(0, t.value.length); } catch {} }, 0); }}
                            placeholder="množství v ml…"
                            autoFocus
                            autoComplete="off"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdjust(item, parseFloat(adjustVal) || 0); }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <GlassButton
                              onClick={() => handleAdjust(item, parseFloat(adjustVal) || 0)}
                              style={{ flex: 1, padding: '9px 0', fontSize: 13, color: 'var(--success)' }}
                            >
                              + Přidat
                            </GlassButton>
                            <GlassButton
                              variant="danger"
                              onClick={() => handleAdjust(item, -(parseFloat(adjustVal) || 0))}
                              style={{ flex: 1, padding: '9px 0', fontSize: 13 }}
                            >
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

          {items.length === 0 && !adding && (
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
                <GlassInput label="Název" value={form.name}
                  onChange={(v) => setForm(f => ({ ...f, name: v }))}
                  placeholder="např. Báze MTL 50/50" />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8 }}>Typ</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TYPE_OPTIONS.map(([t, l]) => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12,
                          background: form.type === t ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                          color: form.type === t ? '#0C0C10' : 'var(--fg-muted)',
                          border: '1px solid ' + (form.type === t ? 'var(--accent)' : 'var(--border)'),
                          fontWeight: form.type === t ? 700 : 400,
                          transition: 'all 0.15s ease',
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <GlassInput label="Množství (ml)" value={form.amount_ml}
                    onChange={(v) => setForm(f => ({ ...f, amount_ml: v }))}
                    min={0} inputMode="decimal" />
                  <GlassInput label="Kapacita (ml)" value={form.capacity_ml}
                    onChange={(v) => setForm(f => ({ ...f, capacity_ml: v }))}
                    min={1} inputMode="decimal" />
                </div>
                <GlassInput label="Poznámka" value={form.note}
                  onChange={(v) => setForm(f => ({ ...f, note: v }))}
                  placeholder="volitelné" />
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
              {importStatus && (
                <p style={{ textAlign: 'center', fontSize: 12, color: importStatus.startsWith('Chyba') ? 'var(--danger)' : 'var(--success)', margin: 0 }}>
                  {importStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
