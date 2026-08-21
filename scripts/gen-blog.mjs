/**
 * Static blog generator — turns apps/web/public/blog/posts.json into a real,
 * crawlable HTML page per post at /blog/<slug>/, fully pre-rendered (no JS
 * needed to read the article) with per-post <title>, meta description,
 * canonical, Open Graph/Twitter, and BlogPosting + BreadcrumbList + FAQPage
 * JSON-LD. Also refreshes the blog URLs in sitemap.xml.
 *
 * Runs in the build chain (see apps/web package.json), so committing an updated
 * posts.json is all it takes to (re)publish crawlable article pages. The pages
 * themselves are build artifacts (gitignored); posts.json is the source of truth.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'public');
const SITE = 'https://www.studyear.com';
const BLOG = join(PUB, 'blog');
const POSTS_FILE = join(BLOG, 'posts.json');
if (!existsSync(POSTS_FILE)) { console.log('[gen-blog] no posts.json — skipping'); process.exit(0); }

let posts = [];
try { posts = JSON.parse(readFileSync(POSTS_FILE, 'utf8')) || []; } catch (e) { console.error('[gen-blog] bad posts.json', e.message); process.exit(0); }
posts = posts.filter((p) => p && p.published && (p.slug || p.id));
posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const attr = (s) => esc(s).replace(/"/g, '&quot;');
function inline(t) {
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, txt, url) => {
    const ext = /^https?:/.test(url) && url.indexOf('studyear.com') < 0;
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener nofollow"' : ''}>${txt}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return t;
}
function md(src) {
  const lines = String(src || '').split(/\n/), out = []; let li = [];
  const flush = () => { if (li.length) { out.push('<ul>' + li.join('') + '</ul>'); li = []; } };
  lines.forEach((l) => {
    l = l.replace(/\s+$/, '');
    if (!l.trim()) { flush(); return; }
    const h = l.match(/^(#{2,3})\s+(.*)/);
    if (h) { flush(); out.push(h[1].length === 2 ? `<h2>${inline(h[2])}</h2>` : `<h3>${inline(h[2])}</h3>`); return; }
    const m = l.match(/^[-*]\s+(.*)/);
    if (m) { li.push(`<li>${inline(m[1])}</li>`); return; }
    flush(); out.push(`<p>${inline(l.trim())}</p>`);
  });
  flush(); return out.join('\n');
}
function faqFromBody(body) {
  const out = [], lines = String(body || '').split(/\n/); let q = null;
  lines.forEach((l) => {
    const m = l.match(/^###?\s*(?:Q[:.]?\s*)?(.+\?)\s*$/);
    if (m) { q = { question: m[1].trim(), answer: '' }; out.push(q); }
    else if (q && l.trim() && !/^#{1,3}\s/.test(l)) { q.answer = (q.answer ? q.answer + ' ' : '') + l.trim(); }
    else if (/^#{1,3}\s/.test(l)) { q = null; }
  });
  return out.filter((x) => x.answer).slice(0, 8);
}
function relatedFor(p) {
  const mine = (p.tags || []).concat([p.keyword]).map((t) => String(t || '').toLowerCase());
  return posts.filter((q) => q !== p).map((q) => {
    const his = (q.tags || []).concat([q.keyword]).map((t) => String(t || '').toLowerCase());
    return { q, n: his.filter((t) => t && mine.indexOf(t) >= 0).length };
  }).filter((o) => o.n > 0).sort((a, b) => b.n - a.n).slice(0, 4).map((o) => o.q);
}
const slugOf = (p) => p.slug || p.id;

const STYLE = `*{margin:0;padding:0;box-sizing:border-box}body{background:#060B18;color:#EDF1F8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7}
.wrap{max-width:760px;margin:0 auto;padding:34px 22px 90px}a{color:#5FA8E0}.k{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#5FA8E0}
nav.bc{font-size:12.5px;color:#8795AE;margin:0 0 14px}nav.bc a{color:#8795AE}
h1{font-family:Georgia,serif;font-weight:500;font-size:30px;line-height:1.25;margin:8px 0 6px}
.meta{font-size:12.5px;color:#8795AE;margin-bottom:18px}
article h2{font-family:Georgia,serif;font-weight:500;font-size:22px;margin:24px 0 8px}article h3{font-size:17px;margin:18px 0 6px}
article p{margin:10px 0}article ul{margin:10px 0 10px 22px}article li{margin:4px 0}
.tags{font-size:12px;color:#8795AE;letter-spacing:.05em;margin-top:16px}
.cta{display:inline-block;margin-top:18px;background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;text-decoration:none;font-weight:600;border-radius:10px;padding:11px 20px}
.rel{margin-top:26px;border-top:1px solid rgba(77,157,224,.18);padding-top:14px}.rel b{font-size:13px}.rel ul{margin:8px 0 0 20px}
footer{max-width:760px;margin:30px auto 0;padding:18px 22px;border-top:1px solid rgba(77,157,224,.14);font-size:12.5px;color:#8795AE;display:flex;gap:14px;flex-wrap:wrap}footer a{color:#8795AE;text-decoration:none}`;

function page(p) {
  const slug = slugOf(p);
  const url = `${SITE}/blog/${slug}/`;
  const desc = p.metaDesc || p.excerpt || '';
  const faq = faqFromBody(p.body);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc,
      datePublished: p.date, dateModified: p.reviewed || p.date, keywords: (p.tags || []).join(', '),
      wordCount: String(p.body || '').split(/\s+/).length, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Organization', name: 'StudYear', url: SITE },
      publisher: { '@type': 'Organization', name: 'StudYear', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog/' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] },
  ];
  if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) });
  const rel = relatedFor(p);
  const relHtml = rel.length ? `<div class="rel"><b>Related articles</b><ul>${rel.map((q) => `<li><a href="../${esc(slugOf(q))}/">${esc(q.title)}</a></li>`).join('')}</ul></div>` : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)} — StudYear</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:title" content="${attr(p.title)}"><meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/icon-512.png"><meta property="og:site_name" content="StudYear">
<meta property="article:published_time" content="${esc(p.date)}"><meta property="article:modified_time" content="${esc(p.reviewed || p.date)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(p.title)}"><meta name="twitter:description" content="${attr(desc)}"><meta name="twitter:image" content="${SITE}/icon-512.png">
<meta name="theme-color" content="#060B18"><link rel="icon" href="../../icon.svg" type="image/svg+xml"><link rel="manifest" href="../../manifest.json">
${ld.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n')}
<style>${STYLE}</style></head><body>
<div class="wrap">
  <nav class="bc" aria-label="Breadcrumb"><a href="../../">Home</a> › <a href="../">Blog</a> › <span>${esc(p.category || 'Article')}</span></nav>
  <div class="k">${esc(p.category || 'Article')}</div>
  <h1>${esc(p.title)}</h1>
  <div class="meta">${(p.readTime || 3)} min read · Published ${esc(String(p.date || '').slice(0, 10))}${p.reviewed ? ' · Updated ' + esc(String(p.reviewed).slice(0, 10)) : ''}<span id="bviews"></span></div>
  <article>${md(p.body)}</article>
  ${p.tags && p.tags.length ? `<div class="tags">${p.tags.map((t) => '#' + esc(t)).join(' ')}</div>` : ''}
  <a class="cta" href="../../study/">Start a free assessment →</a>
  ${relHtml}
</div>
<footer>
  <a href="../../">Home</a><a href="../">Blog</a><a href="../../about/">About</a><a href="../../how-it-works/">How it works</a>
  <a href="../../tutors/">Tutors</a><a href="../../contact/">Contact</a><a href="../../privacy/">Privacy</a>
</footer>
<script>(function(){var s=${JSON.stringify(slug)},el=document.getElementById('bviews');
  fetch('../../firebase-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){
    var b=(c&&c.apiBase||'').replace(/\\/$/,'');if(!b)return;
    var once=false;try{once=sessionStorage.getItem('bv:'+s)==='1'}catch(e){}
    if(!once){try{sessionStorage.setItem('bv:'+s,'1')}catch(e){}}
    fetch(b+'/blogView?slug='+encodeURIComponent(s),once?{}:{method:'POST'}).then(function(r){return r.json()}).then(function(j){
      if(j&&j.ok&&el&&j.count>0)el.textContent=' · '+j.count.toLocaleString()+' view'+(j.count===1?'':'s');
    }).catch(function(){});
  }).catch(function(){});
})();</script>
</body></html>`;
}

let n = 0;
for (const p of posts) {
  const dir = join(BLOG, slugOf(p));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(p));
  n++;
}

/* refresh blog URLs in sitemap.xml between markers (added if missing) */
const smFile = join(PUB, 'sitemap.xml');
try {
  let sm = readFileSync(smFile, 'utf8');
  const entries = posts.map((p) => `  <url><loc>${SITE}/blog/${slugOf(p)}/</loc><lastmod>${String(p.reviewed || p.date || '').slice(0, 10)}</lastmod><priority>0.6</priority></url>`).join('\n');
  const block = `<!-- BLOG:START -->\n${entries}\n  <!-- BLOG:END -->`;
  if (sm.indexOf('<!-- BLOG:START -->') >= 0) {
    sm = sm.replace(/<!-- BLOG:START -->[\s\S]*?<!-- BLOG:END -->/, block);
  } else {
    sm = sm.replace('</urlset>', `  ${block}\n</urlset>`);
  }
  writeFileSync(smFile, sm);
} catch (e) { console.error('[gen-blog] sitemap update skipped:', e.message); }

console.log(`[gen-blog] generated ${n} static post page(s) + sitemap`);
