/**
 * 404 for both deploy targets: Vercel serves it for unknown routes, and the
 * static export emits 404.html which GitHub Pages picks up automatically.
 * Landing footer routes (about, blog, legal pages) land here until those
 * pages ship — so it stays on-brand and routes people back into the OS.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Legacy paths from the retired React admin console (and old bookmarks/history)
 * — forward them to the real page instead of dead-ending. Keys are matched
 * against the last path segments so both / and /StudYear/ deployments work.
 */
const RESCUE: Record<string, string> = {
  support: 'admin/', profile: 'account/me/', gateway: 'admin/gateway/',
  comms: 'admin/comms/', users: 'admin/', billing: 'account/topup/',
  analytics: 'dashboards/', settings: 'account/me/', login: 'auth/',
  signin: 'auth/', signup: 'auth/?signup=1', register: 'auth/?signup=1',
  dashboard: 'app/', account: 'account/me/', me: 'account/me/',
};

const RESCUE_JS = `(function(){
  var map=${JSON.stringify(RESCUE)};
  var parts=location.pathname.replace(/\\/+$/,'').split('/');
  var last=(parts[parts.length-1]||'').toLowerCase();
  if(map[last]){
    var base=location.pathname.indexOf('/StudYear/')===0?'/StudYear/':'/';
    location.replace(base+map[last]);
  }
})();`;

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
      <script dangerouslySetInnerHTML={{ __html: RESCUE_JS }} />
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
