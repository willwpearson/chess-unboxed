export function Footer() {
  return (
    <footer style={{ 
      background: 'var(--gaming-bg-secondary)', 
      borderTop: '2px solid var(--gaming-border)' 
    }}>
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm" style={{ color: 'var(--gaming-text-secondary)' }}>
          <p>&copy; 2025 Chess Unboxed. Experience chess beyond boundaries.</p>
        </div>
      </div>
    </footer>
  );
}
