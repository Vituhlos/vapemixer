import GlassCard from '../GlassCard.jsx';
import GlassButton from '../GlassButton.jsx';
import StatusMessage from '../StatusMessage.jsx';

export default function SaveRecipeCard({ recipeName, setRecipeName, handleSaveRecipe, saveStatus, selectAll }) {
  return (
    <GlassCard>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', display: 'block', marginBottom: 12 }}>Uložit recept</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="app-input"
          style={{ flex: 1 }}
          placeholder="Název receptu…"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveRecipe()}
          onFocus={selectAll}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <GlassButton variant="primary" onClick={handleSaveRecipe} disabled={!recipeName.trim()}>
          Uložit
        </GlassButton>
      </div>
      <StatusMessage status={saveStatus} compact className="mt-2" />
    </GlassCard>
  );
}
