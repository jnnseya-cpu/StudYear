/**
 * 404 for both deploy targets: Vercel serves it for unknown routes, and the
 * static export emits 404.html which GitHub Pages picks up automatically.
 * Landing footer routes (about, blog, legal pages) land here until those
 * pages ship — so it stays on-brand and routes people back into the OS.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        padding: 24,
      }}
    >
      <div>
        <p style={{ letterSpacing: '.3em', fontSize: 12, color: '#3D8FD1', fontFamily: 'system-ui, sans-serif' }}>
          STUDYEAR OS
        </p>
        <h1 style={{ fontWeight: 500, fontSize: 40, margin: '10px 0' }}>This page hasn’t shipped yet.</h1>
        <p style={{ color: '#AAB6CC', fontFamily: 'system-ui, sans-serif', fontWeight: 300 }}>
          The OS is live though — pick a door:
        </p>
        <p style={{ display: 'flex', gap: 14, justifyContent: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
          <a style={{ color: '#A9CFF2' }} href={`${BASE}/`}>Home</a>
          <a style={{ color: '#A9CFF2' }} href={`${BASE}/app/`}>Open the OS</a>
          <a style={{ color: '#A9CFF2' }} href={`${BASE}/study/`}>Study workspace</a>
          <a style={{ color: '#A9CFF2' }} href={`${BASE}/dashboards/`}>Analytics</a>
        </p>
      </div>
    </main>
  );
}
