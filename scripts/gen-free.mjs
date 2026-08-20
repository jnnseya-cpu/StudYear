/**
 * Programmatic-SEO generator for the free grade+plan tool.
 * Turns the single /free/ tool into dozens of ranking pages — one per subject —
 * at /free/<level>-<subject>/, each with unique title/meta/H1/intro/FAQ targeting
 * "free <subject> revision plan / predicted grade", the SAME working tool
 * (single source of truth, extracted from /free/index.html), and internal
 * cross-links. Also refreshes the free URLs in sitemap.xml.
 *
 * Runs in the build chain; pages are build artifacts (gitignored). The tool
 * lives only in /free/index.html — edit it there and every page inherits.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'public');
const SITE = 'https://www.studyear.com';
const FREE = join(PUB, 'free');
const TPL = readFileSync(join(FREE, 'index.html'), 'utf8');

/* extract the single source of truth from the template */
const style = (TPL.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const card = (TPL.match(/<!--TOOL:CARD-->([\s\S]*?)<!--\/TOOL:CARD-->/) || [, ''])[1].replace(/\.\.\/app\//g, '/app/');
const scripts = TPL.match(/<script>([\s\S]*?)<\/script>/g) || [];
const toolScript = (scripts.find((s) => /g-grade|bandOf/.test(s)) || '<script></script>');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* subject catalogue — unique blurb/topics/FAQ per page so content isn't thin */
const G = 'gcse', A = 'alevel';
const SUBJECTS = [
  { s: 'Maths', l: G, boards: 'AQA, Edexcel, OCR', topics: 'algebra, ratio and proportion, geometry, trigonometry and probability', faq: 'Focus your reds first — usually algebra and problem-solving — then bank marks with timed past papers.' },
  { s: 'English Language', l: G, boards: 'AQA, Edexcel', topics: 'reading analysis, language techniques, and the writing tasks', faq: 'Grades move fastest by drilling the mark scheme for the reading questions and planning writing answers to time.' },
  { s: 'English Literature', l: G, boards: 'AQA, Edexcel', topics: 'your set texts, quotations, themes and context', faq: 'Learn a bank of short quotations per theme and practise essay plans — examiners reward analysis, not retelling.' },
  { s: 'Biology', l: G, boards: 'AQA, Edexcel, OCR', topics: 'cells, organisation, infection, bioenergetics, homeostasis and ecology', faq: 'Nail the required practicals and the 6-mark questions — they carry disproportionate marks.' },
  { s: 'Chemistry', l: G, boards: 'AQA, Edexcel, OCR', topics: 'atomic structure, bonding, quantitative chemistry, rates and organic chemistry', faq: 'Practise calculations (moles, yields) until automatic — they are the most reliable marks to gain.' },
  { s: 'Physics', l: G, boards: 'AQA, Edexcel, OCR', topics: 'energy, electricity, particle model, forces and waves', faq: 'Master the equations and unit conversions, then drill the required practicals and graph questions.' },
  { s: 'Combined Science', l: G, boards: 'AQA, Edexcel, OCR', topics: 'the biology, chemistry and physics content across both papers', faq: 'Spread revision evenly across the three sciences and prioritise the required practicals and maths skills.' },
  { s: 'History', l: G, boards: 'AQA, Edexcel, OCR', topics: 'your studied periods, key dates, causes and consequences', faq: 'Build timelines and practise the exam question types — source analysis and extended essays — under time.' },
  { s: 'Geography', l: G, boards: 'AQA, Edexcel, OCR', topics: 'physical and human geography, case studies and fieldwork', faq: 'Learn two solid case studies per topic and practise the 6- and 9-mark structured answers.' },
  { s: 'French', l: G, boards: 'AQA, Edexcel', topics: 'vocabulary, tenses, listening, reading, speaking and writing', faq: 'Little-and-often vocab plus tense practice, then rehearse the speaking photo card and role play out loud.' },
  { s: 'Spanish', l: G, boards: 'AQA, Edexcel', topics: 'vocabulary, tenses, and the four skills', faq: 'Drill high-frequency vocab and verb tables daily, then practise speaking and translation to time.' },
  { s: 'Computer Science', l: G, boards: 'AQA, OCR', topics: 'algorithms, programming, data representation, networks and systems', faq: 'Practise writing and tracing algorithms by hand — the exam rewards clear pseudocode and logic.' },
  { s: 'Business', l: G, boards: 'AQA, Edexcel, OCR', topics: 'marketing, finance, operations and human resources', faq: 'Learn the key formulas and practise applying case-study data to structured and evaluation questions.' },
  { s: 'Religious Studies', l: G, boards: 'AQA, Edexcel', topics: 'beliefs, teachings and ethical arguments', faq: 'Memorise short scriptural quotes per theme and practise the evaluate ("to what extent") answers.' },
  { s: 'Psychology', l: G, boards: 'AQA, Edexcel', topics: 'the core studies, approaches and research methods', faq: 'Learn studies as AIM–METHOD–RESULTS–CONCLUSION and drill the research-methods maths.' },
  { s: 'Sociology', l: G, boards: 'AQA, Edexcel', topics: 'families, education, and research methods', faq: 'Bank named studies and sociologists per topic and practise the longer evaluation answers.' },
  { s: 'Maths', l: A, boards: 'AQA, Edexcel, OCR', topics: 'pure, statistics and mechanics', faq: 'Keep pure fluent with daily short sets, then alternate stats and mechanics past papers to time.' },
  { s: 'Biology', l: A, boards: 'AQA, Edexcel, OCR', topics: 'biological molecules, cells, exchange, genetics and ecology', faq: 'Prioritise the required practicals, the maths (statistics) skills and the extended-response questions.' },
  { s: 'Chemistry', l: A, boards: 'AQA, Edexcel, OCR', topics: 'physical, inorganic and organic chemistry', faq: 'Drill mechanisms and calculations relentlessly and practise full past papers under exam conditions.' },
  { s: 'Physics', l: A, boards: 'AQA, Edexcel, OCR', topics: 'mechanics, fields, electricity and nuclear physics', faq: 'Master the derivations and unit work, then focus on the longer multi-step problem questions.' },
  { s: 'Psychology', l: A, boards: 'AQA, Edexcel', topics: 'approaches, research methods and the applied options', faq: 'Learn studies precisely, drill research-methods maths, and practise the 16-mark essays to a plan.' },
  { s: 'Economics', l: A, boards: 'AQA, Edexcel', topics: 'micro and macroeconomics, diagrams and evaluation', faq: 'Practise drawing and explaining diagrams fast, then structure evaluation with clear chains of reasoning.' },
];
const levelName = (l) => (l === A ? 'A-Level' : l === 'ks3' ? 'KS3' : 'GCSE');
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const slugOf = (x) => `${x.l}-${slugify(x.s)}`;

function faqLd(x) {
  const lv = levelName(x.l);
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
    { '@type': 'Question', name: `How do I get a predicted ${lv} ${x.s} grade for free?`, acceptedAnswer: { '@type': 'Answer', text: `Enter your most recent ${x.s} mark, your exam date and weekly revision hours above. It maps your mark to the grade bands and projects a reachable grade with a plan — free, no sign-up.` } },
    { '@type': 'Question', name: `What should I focus on for ${lv} ${x.s}?`, acceptedAnswer: { '@type': 'Answer', text: `${x.faq} Your plan targets ${x.topics}.` } },
    { '@type': 'Question', name: 'Is it really free with no account?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — your grade and plan are worked out on this page with no sign-up and no card. Save and track them with a free StudYear account.' } },
  ] };
}
function faqHtml(x) {
  const lv = levelName(x.l);
  return `<div class="faq">
    <details open><summary>How do I get a predicted ${esc(lv)} ${esc(x.s)} grade for free?</summary><p>Enter your most recent ${esc(x.s)} mark, exam date and weekly hours above — it maps your mark to the grade bands and projects a reachable grade with a plan. Free, no sign-up.</p></details>
    <details><summary>What should I focus on for ${esc(lv)} ${esc(x.s)}?</summary><p>${esc(x.faq)} Your plan targets ${esc(x.topics)} (${esc(x.boards)}).</p></details>
    <details><summary>Is it really free with no account?</summary><p>Yes — everything is worked out on this page with no sign-up and no card. Create a free StudYear account to save your plan and get an AI tutor, exam practice and early alerts.</p></details>
  </div>`;
}

function page(x, all) {
  const lv = levelName(x.l), slug = slugOf(x), url = `${SITE}/free/${slug}/`;
  const title = `Free ${lv} ${x.s} Revision Plan & Predicted Grade — StudYear`;
  const desc = `Get your predicted ${lv} ${x.s} grade and a free, personalised revision plan in 60 seconds — no sign-up, no card (${x.boards}). Then keep it free with StudYear.`;
  const h1 = `Free ${lv} ${x.s} predicted grade &amp; revision plan.`;
  const lede = `Answer three quick questions and get an honest ${lv} ${x.s} predicted grade and a week-by-week revision plan — free, no account, no card. ${x.faq}`;
  const rel = all.filter((y) => slugOf(y) !== slug).slice(0, 8).map((y) => `<a href="/free/${slugOf(y)}/">${esc(levelName(y.l))} ${esc(y.s)}</a>`).join('');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: `StudYear ${lv} ${x.s} Predicted Grade & Revision Plan`, applicationCategory: 'EducationalApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' }, url, description: desc },
    faqLd(x),
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Free tools', item: SITE + '/free/' },
      { '@type': 'ListItem', position: 3, name: `${lv} ${x.s}`, item: url } ] },
  ];
  const tool = card.replace(/https:\/\/www\.studyear\.com\/free\//g, url); // (card has no such ref, safe)
  const toolJs = toolScript.replace(/https:\/\/www\.studyear\.com\/free\//g, url);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/icon-512.png"><meta property="og:site_name" content="StudYear">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/icon-512.png">
<link rel="manifest" href="../../manifest.json"><link rel="icon" href="../../icon.svg" type="image/svg+xml"><meta name="theme-color" content="#060B18">
${ld.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n')}
<style>${style}
.rel{margin-top:26px;border-top:1px solid var(--line);padding-top:14px}.rel b{font-size:13px;color:var(--ink2);display:block;margin-bottom:8px}.rel a{display:inline-block;color:var(--blue4);text-decoration:none;font-size:13px;margin:0 14px 8px 0}</style>
</head><body>
<div class="wrap">
  <nav><a class="logo" href="/"><b>StudYear</b></a><span class="sp"><a class="chip" href="/how-it-works/">How it works</a><a class="chip cta" href="/app/">Start free</a></span></nav>
  <div class="k">Free · No sign-up · 60 seconds · ${esc(x.boards)}</div>
  <h1>${h1}</h1>
  <p class="lede">${esc(lede)}</p>
  <span class="free-pill">● 100% free — nothing to pay, ever</span>
${tool}
  <div class="proof">
    <span><b>Why trust it?</b> Grades are estimated from real marks, never invented.</span>
    <span><b>Private.</b> Nothing you enter leaves your device on this page.</span>
    <span><b>No card.</b> The full app has a genuinely free tier.</span>
  </div>
  <div class="rel"><b>Free predicted grade &amp; plan for other subjects</b>${rel}<a href="/free/">All subjects →</a></div>
  ${faqHtml(x)}
  <footer><a href="/">Home</a><a href="/free/">Free tools</a><a href="/how-it-works/">How it works</a><a href="/blog/">Blog</a><a href="/app/">Start free</a><a href="/privacy/">Privacy</a></footer>
</div>
<script>${toolJs.replace(/^<script>|<\/script>$/g, '')}</script>
<script>(function(){try{var s=document.getElementById('subject');if(s)s.value=${JSON.stringify(x.s)};var l=document.getElementById('level');if(l)l.value=${JSON.stringify(x.l)};}catch(e){}})();</script>
</body></html>`;
}

let n = 0;
for (const x of SUBJECTS) {
  const dir = join(FREE, slugOf(x));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(x, SUBJECTS));
  n++;
}

/* refresh free URLs in sitemap.xml between markers */
const smFile = join(PUB, 'sitemap.xml');
try {
  let sm = readFileSync(smFile, 'utf8');
  const entries = SUBJECTS.map((x) => `  <url><loc>${SITE}/free/${slugOf(x)}/</loc><priority>0.7</priority></url>`).join('\n');
  const block = `<!-- FREE:START -->\n${entries}\n  <!-- FREE:END -->`;
  if (sm.indexOf('<!-- FREE:START -->') >= 0) sm = sm.replace(/<!-- FREE:START -->[\s\S]*?<!-- FREE:END -->/, block);
  else sm = sm.replace('</urlset>', `  ${block}\n</urlset>`);
  writeFileSync(smFile, sm);
} catch (e) { console.error('[gen-free] sitemap update skipped:', e.message); }

console.log(`[gen-free] generated ${n} free subject page(s) + sitemap`);
