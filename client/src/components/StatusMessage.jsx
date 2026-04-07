export default function StatusMessage({ status, className = '', compact = false }) {
  if (!status?.text) return null;

  const tone = status.type === 'error'
    ? {
        color: 'var(--danger)',
        background: 'rgba(255,69,58,0.08)',
        border: '1px solid rgba(255,69,58,0.2)',
      }
    : status.type === 'warning'
      ? {
          color: 'var(--accent-warm)',
          background: 'rgba(255,159,10,0.08)',
          border: '1px solid rgba(255,159,10,0.2)',
        }
      : {
          color: 'var(--success)',
          background: 'rgba(50,215,75,0.08)',
          border: '1px solid rgba(50,215,75,0.2)',
        };

  return (
    <div
      className={className}
      style={{
        ...tone,
        borderRadius: compact ? 8 : 10,
        padding: compact ? '8px 10px' : '10px 12px',
        fontSize: compact ? 12 : 13,
        lineHeight: 1.35,
      }}
    >
      {status.text}
    </div>
  );
}
