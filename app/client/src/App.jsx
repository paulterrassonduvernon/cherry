// Layout racine : sidebar de navigation + zone de contenu.
// Aucune donnée réelle pour l'instant — les écrans (liste d'espaces, vue
// d'espace, capture, vue transversale, paramètres) arrivent en Phase 2+.
// Voir docs/architecture.md pour le découpage par phases.

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          borderRight: "1px solid var(--border)",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>🍒 Cherry</h1>
        {/* TODO (Phase 2): liste des espaces + lien vue transversale */}
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>
        <p style={{ color: "var(--text-muted)" }}>
          Squelette du projet — aucune fonctionnalité pour l'instant.
        </p>
      </main>
    </div>
  );
}
