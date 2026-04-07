import StatusMessage from './StatusMessage.jsx';

export default function StatusStack({ items = [], compact = false, className = '' }) {
  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {visibleItems.map((item, index) => (
        <StatusMessage key={`${item.type || 'info'}-${index}-${item.text}`} status={item} compact={compact} />
      ))}
    </div>
  );
}
