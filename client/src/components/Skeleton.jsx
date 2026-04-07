function SkeletonBlock({ style = {} }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,0.04) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.4s infinite',
      borderRadius: 8,
      ...style,
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4">
      <SkeletonBlock style={{ height: 10, width: '35%', marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 10 }}>
            <SkeletonBlock style={{ height: 8, width: '45%', marginBottom: 8 }} />
            <SkeletonBlock style={{ height: 18, width: '65%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
