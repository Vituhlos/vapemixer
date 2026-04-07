import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import SwipeToDelete from '../components/SwipeToDelete.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import { api } from '../api.js';

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await api.getHistory()); } catch {}
    setLoading(false);
  }

  async function handleDelete(id) {
    await api.deleteHistory(id);
    setItems(i => i.filter(x => x.id !== id));
  }

  if (loading) return <div className="screen-enter"><SkeletonList count={3} /></div>;

  if (items.length === 0) {
    return (
      <div className="screen-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 192, gap: 8 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
          {items.map(item => (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item.id)}>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
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
                    </div>
                    <p style={{ fontSize: 12, marginTop: 3, color: 'var(--fg-subtle)', margin: '3px 0 0' }}>
                      {fmtDateTime(item.created_at)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
                  <MiniPill label="Objem" value={`${item.volume_ml} ml`} />
                  <MiniPill label="Nikotin" value={`${item.nicotine_mg} mg`} highlight />
                  <MiniPill label="Báze" value={`${item.vg_ratio}/${item.pg_ratio}`} />
                  <MiniPill label="Báze ml" value={`${fmt1(item.base_ml)} ml`} />
                  <MiniPill label="Booster ml" value={`${fmt1(item.booster_ml)} ml`} />
                  <MiniPill label="Příchuť ml" value={`${fmt1(item.flavor_ml)} ml`} />
                </div>

                {item.note && (
                  <p style={{ fontSize: 12, marginTop: 8, color: 'var(--fg-muted)', margin: '8px 0 0' }}>{item.note}</p>
                )}
              </GlassCard>
            </SwipeToDelete>
          ))}
        </div>
      </PullToRefresh>
    </div>
  );
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
  const d = new Date(str);
  return d.toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
