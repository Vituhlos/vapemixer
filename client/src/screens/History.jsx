import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import BottomSheet from '../components/BottomSheet.jsx';
import SwipeToDelete from '../components/SwipeToDelete.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { api } from '../api.js';

export default function History({ onLoad }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [search, setSearch] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setStatus(null);
    try {
      setItems(await api.getHistory());
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Nepodařilo se načíst historii' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteHistory(id);
      setItems((records) => records.filter((record) => record.id !== id));
      setStatus({ type: 'ok', text: 'Záznam odstraněn' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Mazání záznamu selhalo' });
    }
  }

  async function handleRevert(id) {
    try {
      await api.revertMix(id);
      setItems((records) => records.map((r) => r.id === id ? { ...r, stock_deducted: 0 } : r));
      setStatus({ type: 'ok', text: 'Odečet skladu byl vrácen' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Vrácení odečtu selhalo' });
    }
  }

  async function handleClearAll() {
    try {
      await api.clearHistory();
      setItems([]);
      setConfirmClear(false);
      setStatus({ type: 'ok', text: 'Historie vymazána' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Vymazání historie selhalo' });
    }
  }

  if (loading) return <div className="screen-enter"><SkeletonList count={3} /></div>;

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [item.recipe_name, item.flavor_name, item.note]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));

    const matchesDate = !todayOnly || isToday(item.created_at);
    return matchesQuery && matchesDate;
  });

  if (items.length === 0) {
    return (
      <div className="screen-enter panel-surface" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 192, gap: 8, padding: 16 }}>
        <StatusMessage status={status} compact />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: 0 }}>Žádná historie</p>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 12, margin: 0 }}>Zaznamenej míchání v Mixeru</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full screen-enter">
      <PullToRefresh onRefresh={load}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <div className="panel-surface" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="section-kicker">Historie</div>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 0' }}>Log míchání i skladový doklad</p>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                Hledej podle receptu nebo příchutě, vrať odečet skladu a načti starší mix zpět do kalkulačky.
              </p>
            </div>
            <div className="toolbar-row">
            <input
              className="app-input"
              style={{ flex: '1 1 220px' }}
              placeholder="Hledat v historii…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
              <GlassButton
                onClick={() => setTodayOnly((value) => !value)}
                style={{
                  fontSize: 12,
                  padding: '8px 12px',
                background: todayOnly ? 'var(--accent)' : undefined,
                color: todayOnly ? '#0C0C10' : undefined,
                borderColor: todayOnly ? 'var(--accent)' : undefined,
              }}
              >
                Dnes
              </GlassButton>
              <GlassButton variant="danger" onClick={() => setConfirmClear(true)} style={{ fontSize: 12, padding: '8px 12px' }}>
                Vymazat historii
              </GlassButton>
            </div>
          </div>
          <StatusMessage status={status} compact />
          {filteredItems.length === 0 ? (
            <div className="panel-surface" style={{ display: 'flex', justifyContent: 'center', padding: '28px 16px' }}>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: 0 }}>
                Žádné záznamy pro aktuální filtr
              </p>
            </div>
          ) : filteredItems.map((item) => (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item.id)}>
              <GlassCard className="panel-surface">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {item.recipe_name && (
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.recipe_name}</span>
                      )}
                      {item.flavor_name && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 6,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          color: 'var(--fg-muted)',
                        }}>
                          {item.flavor_name}
                        </span>
                      )}
                      {!item.recipe_name && !item.flavor_name && (
                        <span style={{ fontSize: 14, color: 'var(--fg-muted)' }}>bez receptu</span>
                      )}
                      {item.stock_deducted === 1 && (
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 6,
                          background: 'rgba(50,215,75,0.12)', border: '1px solid rgba(50,215,75,0.3)',
                          color: 'var(--success)',
                        }}>
                          sklad odečten
                        </span>
                      )}
                      {item.cost_czk != null && (
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 6,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          color: 'var(--fg-muted)', fontFamily: 'monospace',
                        }}>
                          ~{item.cost_czk.toFixed(1)} Kč
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: '3px 0 0' }}>
                      {fmtDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="toolbar-row" style={{ flexShrink: 0 }}>
                    {item.stock_deducted === 1 && (
                      <GlassButton onClick={() => handleRevert(item.id)} style={{ fontSize: 12, padding: '6px 10px' }}>
                        Vrátit
                      </GlassButton>
                    )}
                    <GlassButton onClick={() => onLoad?.(item)} style={{ fontSize: 12, padding: '6px 12px' }}>
                      Načíst
                    </GlassButton>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 6, marginTop: 12 }}>
                  <MiniPill label="Objem" value={`${item.volume_ml} ml`} />
                  <MiniPill label="Nikotin" value={`${item.nicotine_mg} mg`} highlight />
                  <MiniPill label="Báze" value={`${item.vg_ratio}/${item.pg_ratio}`} />
                  <MiniPill label="Báze ml" value={`${fmt1(item.base_ml)} ml`} />
                  <MiniPill label="Booster ml" value={`${fmt1(item.booster_ml)} ml`} />
                  <MiniPill label="Příchuť ml" value={`${fmt1(item.flavor_ml)} ml`} />
                </div>

                {item.note && (
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>{item.note}</p>
                )}

                {item.used_stock_items?.length > 0 && (
                  <div style={{
                    marginTop: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-subtle)', margin: 0 }}>
                      Použité položky skladu
                    </p>
                    {item.used_stock_items.map((used) => (
                      <div
                        key={`${item.id}-${used.stock_id}-${used.type}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, color: 'var(--fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {used.name}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--fg-subtle)', margin: '2px 0 0' }}>
                            {labelForType(used.type)}
                            {used.bottle_ml != null ? ` • lahvička ${fmt1(used.bottle_ml)} ml` : ''}
                          </p>
                        </div>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)', flexShrink: 0 }}>
                          −{fmt1(used.deducted_ml)} ml
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {item.used_stock_summary?.length > 0 && (
                  <div style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-subtle)', margin: 0 }}>
                      Cena po složkách
                    </p>
                    {item.used_stock_summary.map((part) => (
                      <div
                        key={`${item.id}-summary-${part.key}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--fg)' }}>
                          {part.label}
                        </span>
                        <span className="mono" style={{ fontSize: 12, color: part.total_cost_czk != null ? 'var(--fg-muted)' : 'var(--fg-subtle)' }}>
                          {part.total_cost_czk != null ? `~${part.total_cost_czk.toFixed(2)} Kč` : 'bez ceny'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </SwipeToDelete>
          ))}
        </div>
      </PullToRefresh>

      <BottomSheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Vymazat celou historii?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0 }}>
            Tohle smaže všechny záznamy míchání. Akci nepůjde vrátit.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassButton variant="danger" onClick={handleClearAll} className="flex-1">Vymazat vše</GlassButton>
            <GlassButton onClick={() => setConfirmClear(false)} className="flex-1">Zrušit</GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function isToday(str) {
  if (!str) return false;
  const date = new Date(str);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function MiniPill({ label, value, highlight }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>{label}</span>
      <span className="mono" style={{
        fontSize: 13, fontWeight: 600,
        color: highlight ? 'var(--accent)' : 'var(--fg)',
      }}>
        {value}
      </span>
    </div>
  );
}

function fmt1(v) { return (Math.round((v ?? 0) * 10) / 10).toFixed(1); }

function fmtDateTime(str) {
  if (!str) return '';
  const date = new Date(str);
  return date.toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function labelForType(type) {
  return ({
    baze_mtl: 'Báze MTL',
    baze_dl: 'Báze DL',
    booster_mtl: 'Booster MTL',
    booster_dl: 'Booster DL',
    prichut: 'Příchuť',
  })[type] || type;
}
