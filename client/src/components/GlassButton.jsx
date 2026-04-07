export default function GlassButton({ children, onClick, variant = 'default', className = '', disabled = false, type = 'button' }) {
  const cls = {
    default: 'btn',
    primary: 'btn btn-primary',
    danger:  'btn btn-danger',
  }[variant] || 'btn';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${cls} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
