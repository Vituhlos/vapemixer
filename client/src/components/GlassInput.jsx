export default function GlassInput({ label, value, onChange, type = 'text', placeholder, min, max, step, className = '', suffix, inputMode }) {
  const isNumeric = type === 'number' || inputMode === 'decimal' || inputMode === 'numeric';

  function handleChange(e) {
    let val = e.target.value;
    if (isNumeric) {
      val = val.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
      if (min != null && val !== '' && Number(val) < Number(min)) val = String(val);
      if (max != null && val !== '' && Number(val) > Number(max)) val = String(val);
    }
    onChange(val);
  }

  function handleFocus(e) {
    const t = e.target;
    setTimeout(() => { try { t.setSelectionRange(0, t.value.length); } catch {} }, 0);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="label-section">{label}</span>}
      <div className="relative flex items-center">
        <input
          type={isNumeric ? 'text' : type}
          inputMode={isNumeric ? 'decimal' : (inputMode || 'text')}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="app-input px-3 py-2.5"
          style={{ paddingRight: suffix ? '2.8rem' : undefined }}
        />
        {suffix && (
          <span className="absolute right-3 text-sm pointer-events-none text-subtle">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
