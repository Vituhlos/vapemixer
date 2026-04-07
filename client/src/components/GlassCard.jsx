export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div className={`card p-4 ${hover ? 'card-hover' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
