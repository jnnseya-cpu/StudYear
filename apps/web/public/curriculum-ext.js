/* StudYear verified-curriculum extension (window.SYCURRIC_EXT).
 *
 * Adds hand-authored, specification-grounded outlines on top of the inline
 * CURRICULUM in study/index.html, WITHOUT touching that stable object:
 *
 *   • alevel  — A-level structures for subjects that had a verified GCSE outline
 *               but no A-level one (grounded in the current AQA specifications).
 *   • primary — Key Stage 1 & Key Stage 2 knowledge curricula for the national-
 *               curriculum core (English, Maths, Science), so a primary learner
 *               is grounded on the real DfE programmes of study instead of the
 *               GCSE spec or an honest-but-empty card.
 *
 * curricFor() in study/index.html consults this object as a fallback: the inline
 * CURRICULUM always wins where it already has a structure, so nothing regresses.
 *
 * OWNER REVIEW: these outlines are drafted from the published specifications
 * (AQA A-level; DfE national curriculum) and should be checked for accuracy
 * before being presented as a school's single source of truth. Board-specific
 * divergence (Edexcel/OCR/WJEC/CIE/SQA) and more subjects are the next stage.
 */
(function () {
  'use strict';

  /* ---------------------------------------------- A-level (AQA-grounded) ---- */
  var alevel = {
    // AQA Chemistry 7405 — Physical, Inorganic, Organic
    chemistry: [
      { t: 'Physical Chemistry 1', topics: [
        'Atomic structure — mass spectrometry, electron configuration, ionisation energies',
        'Amount of substance — the mole, ideal gas equation, empirical & molecular formulae',
        'Bonding — ionic/covalent/metallic, shapes of molecules, electronegativity & intermolecular forces' ] },
      { t: 'Physical Chemistry 2', topics: [
        'Energetics — enthalpy changes, Hess’s law, bond enthalpies, calorimetry (required practical)',
        'Kinetics — collision theory, Maxwell–Boltzmann, catalysts, measuring rates',
        'Chemical equilibria, Kc and Le Chatelier; redox and oxidation states' ] },
      { t: 'Physical Chemistry 3 (A2)', topics: [
        'Thermodynamics — Born–Haber cycles, entropy and Gibbs free energy',
        'Rate equations, orders of reaction, rate-determining step and the Arrhenius equation',
        'Equilibrium constant Kp; electrode potentials and electrochemical cells',
        'Acids and bases — pH, strong/weak, buffers and titration curves (required practical)' ] },
      { t: 'Inorganic Chemistry', topics: [
        'Periodicity — trends across Period 3',
        'Group 2, the alkaline earth metals; Group 7, the halogens',
        'Period 3 oxides; transition metals — complex ions, colour, catalysis, redox titrations (A2)',
        'Reactions of ions in aqueous solution (A2)' ] },
      { t: 'Organic Chemistry 1', topics: [
        'Introduction — nomenclature, isomerism (structural & stereo), reaction mechanisms',
        'Alkanes, halogenoalkanes and alkenes',
        'Alcohols; organic analysis — infrared and mass spectrometry' ] },
      { t: 'Organic Chemistry 2 (A2)', topics: [
        'Optical isomerism; aldehydes & ketones; carboxylic acids and derivatives',
        'Aromatic chemistry; amines; polymers',
        'Amino acids, proteins & DNA; organic synthesis',
        'NMR spectroscopy and chromatography' ] } ],

    // AQA History 7042 — option-based: breadth + depth + Historical Investigation (NEA)
    history: [
      { t: 'Component 1 — Breadth study (choose one option)', topics: [
        'A broad period of ~100+ years assessing change, continuity, cause & consequence',
        'Popular options: 1C The Tudors 1485–1603 · 1H Britain 1851–1964 · 2K Making of modern Britain 1951–2007',
        'Exam skill: evaluating three contemporary primary sources' ] },
      { t: 'Component 2 — Depth study (choose one option)', topics: [
        'A substantial depth study of a shorter period',
        'Popular options: 2N Revolution & dictatorship: Russia 1917–1953 · 2R The Cold War 1945–1991 · 1L Quest for political stability: Germany 1871–1991',
        'Exam skill: evaluating historians’ extracts and interpretations' ] },
      { t: 'Component 3 — Historical Investigation (NEA)', topics: [
        'A personal study on a question spanning ~100 years, not covered by Components 1 & 2',
        '3,500–4,500 word essay using primary sources and historians’ interpretations',
        'Independent research, referencing and evaluation of evidence' ] },
      { t: 'Historical skills (across all components)', topics: [
        'Analysing provenance, tone and context of primary sources',
        'Comparing and evaluating competing interpretations',
        'Constructing substantiated, balanced judgements' ] } ],

    // AQA English Literature A 7712
    english_literature: [
      { t: 'Paper 1 — Love through the ages', topics: [
        'Shakespeare play — close study and critical interpretation',
        'Comparison of poetry (an anthology or pre/post-1900 set poems)',
        'Unseen prose comparison; reading across time and AO3 contexts' ] },
      { t: 'Paper 2 — Texts in shared contexts', topics: [
        'Option 2A Modern times (1945–present) OR 2B Elizabethan era 1558–1603',
        'A prose, a poetry and a drama text studied through the chosen context',
        'Unseen extract and the “writing about” of contextual influence (AO3)' ] },
      { t: 'Non-exam assessment — comparative critical study', topics: [
        'An independent comparison of two texts (at least one poetry)',
        'Application of a chosen critical lens / theory (AO5)',
        'Academic essay with referencing (~2,500 words)' ] },
      { t: 'Literary skills (across the course)', topics: [
        'Close reading of language, form and structure (AO1/AO2)',
        'Situating texts in their literary and historical context (AO3)',
        'Engaging with different critical readings and debate (AO5)' ] } ],

    // AQA Computer Science 7517
    computer_science: [
      { t: 'Programming & data structures', topics: [
        'Data types, programming constructs, subroutines and object-oriented programming',
        'Arrays, records, lists, stacks, queues, trees, graphs and hash tables',
        'Abstract data types and their uses' ] },
      { t: 'Algorithms', topics: [
        'Graph & tree traversal; searching (linear, binary) and sorting (bubble, merge)',
        'Dijkstra’s shortest path; optimisation algorithms',
        'Comparing algorithms — Big-O time and space complexity' ] },
      { t: 'Theory of computation', topics: [
        'Abstraction, decomposition and finite state machines',
        'Regular and context-free languages; Backus–Naur Form',
        'Turing machines, computability and the halting problem' ] },
      { t: 'Data representation & computer systems', topics: [
        'Number systems, binary arithmetic, floating point; character, image & sound encoding; compression',
        'Hardware & software, Boolean algebra and logic gates',
        'Processor architecture (Von Neumann), the fetch–execute cycle and instruction sets' ] },
      { t: 'Networking, databases & Big Data', topics: [
        'Networking — TCP/IP stack, protocols, security and the internet',
        'Databases — entity modelling, normalisation and SQL',
        'Functional programming and processing Big Data' ] },
      { t: 'Consequences & the NEA project', topics: [
        'Moral, ethical, legal and cultural consequences of computing',
        'The programming project — analysis, design, implementation, testing and evaluation' ] } ],

    // AQA Business 7132
    business: [
      { t: 'What is business?', topics: [
        'Nature and purpose of business; mission and objectives',
        'Stakeholders and business forms; the external environment',
        'Business and the market — revenue, costs, profit and break-even' ] },
      { t: 'Managers, leadership & decision making', topics: [
        'Management and leadership styles',
        'Decision making — scientific vs intuition, decision trees',
        'Influences of stakeholders and the role of managers' ] },
      { t: 'Decision making to improve marketing performance', topics: [
        'Market research, segmentation, targeting and positioning',
        'The marketing mix and price/income elasticity of demand',
        'Marketing strategy and data-driven decisions' ] },
      { t: 'Decision making to improve operational & financial performance', topics: [
        'Operations — capacity, quality, inventory and supply-chain management',
        'Finance — budgets, cash flow, profitability ratios and investment appraisal',
        'Human resources — organisational structure, motivation and performance' ] },
      { t: 'Analysing the strategic position (A2)', topics: [
        'Mission, objectives and strategy; financial ratio analysis',
        'Core competences, SWOT and the competitive environment',
        'Investment appraisal and assessing a changing environment (PESTLE)' ] },
      { t: 'Strategic direction, methods & change (A2)', topics: [
        'Ansoff’s matrix — market and product strategies',
        'Strategic methods — growth, economies of scale, globalisation and multinationals',
        'Managing strategic change — scenario planning, culture, resistance and contingency' ] } ],

    // AQA French 7652 (themes mirror AQA Spanish 7692)
    french: [
      { t: 'Aspects of French-speaking society — current trends', topics: [
        'The changing nature of family (la famille)',
        'The “cyber-society” (la « cyber-société »)',
        'The place of voluntary work (le bénévolat)' ] },
      { t: 'Artistic culture in the French-speaking world', topics: [
        'A culture proud of its heritage (une culture fière de son patrimoine)',
        'Contemporary francophone music (la musique francophone contemporaine)',
        'Cinema — the 7th art form (le cinéma, le septième art)' ] },
      { t: 'Aspects of French-speaking society — current issues (A2)', topics: [
        'The positive features of a diverse society',
        'Life for the marginalised (les misérables, les exclus)',
        'How criminals are treated (la justice et la criminalité)' ] },
      { t: 'Aspects of political life in the French-speaking world (A2)', topics: [
        'Teenagers, the right to vote and political commitment',
        'Demonstrations and strikes — who holds the power?',
        'Politics and immigration' ] },
      { t: 'Literature, film and the research project', topics: [
        'Study of one literary text and one film (or two texts)',
        'Grammar developed across both years (tenses, subjunctive, complex structures)',
        'Individual research project (IRP) for the speaking assessment' ] } ],

    spanish: [
      { t: 'Aspects of Hispanic society', topics: [
        'Modern and traditional values (los valores tradicionales y modernos)',
        'Cyberspace (el ciberespacio)',
        'Equal rights (la igualdad de los sexos)' ] },
      { t: 'Artistic culture in the Hispanic world', topics: [
        'Modern-day idols (la influencia de los ídolos)',
        'Spanish regional identity (la identidad regional en España)',
        'Cultural heritage — past and present (el patrimonio cultural)' ] },
      { t: 'Multiculturalism in Hispanic society (A2)', topics: [
        'Immigration (la inmigración)',
        'Racism (el racismo)',
        'Integration (la convivencia)' ] },
      { t: 'Aspects of political life in the Hispanic world (A2)', topics: [
        'Today’s youth, tomorrow’s citizens (jóvenes de hoy, ciudadanos del mañana)',
        'Monarchies and dictatorships (las monarquías y las dictaduras)',
        'Popular movements (los movimientos populares)' ] },
      { t: 'Literature, film and the research project', topics: [
        'Study of one literary text and one film (or two texts)',
        'Grammar developed across both years (tenses, subjunctive, complex structures)',
        'Individual research project (IRP) for the speaking assessment' ] } ],

    // AQA Religious Studies 7062
    religious_studies: [
      { t: 'Philosophy of religion', topics: [
        'Arguments for the existence of God — ontological, cosmological, teleological',
        'Evil and suffering; religious experience; miracles',
        'Religious language; the self, death and the afterlife' ] },
      { t: 'Ethics and religion', topics: [
        'Normative theories — natural moral law, situation ethics, virtue ethics, Kant, utilitarianism',
        'Applied ethics and the application of theories to issues',
        'Meta-ethics; free will & moral responsibility; conscience' ] },
      { t: 'Study of religion (e.g. Christianity)', topics: [
        'Sources of wisdom and authority; the nature of God',
        'Self, death and the afterlife; good conduct and key moral principles',
        'Expression of religious identity; gender, science, secularisation and pluralism' ] },
      { t: 'Dialogues', topics: [
        'How religion is influenced by, and has influenced, philosophy of religion',
        'How religion is influenced by, and has influenced, ethical studies' ] } ],

    // AQA Sociology 7192
    sociology: [
      { t: 'Education with methods in context', topics: [
        'Role and functions of the education system; differential achievement by class, gender and ethnicity',
        'Relationships and processes within schools; the significance of educational policies',
        'Applying research methods to the study of education (methods in context)' ] },
      { t: 'Topics in Sociology — Families & households (option)', topics: [
        'Couples, the domestic division of labour and power relationships',
        'Childhood, demography and changing family patterns',
        'The relationship of the family to the social structure and social change' ] },
      { t: 'Topics in Sociology — Beliefs in society (option)', topics: [
        'Ideology, science and religion; religious organisations and movements',
        'The relationship between social groups and religiosity',
        'The significance of religion and secularisation in a global context' ] },
      { t: 'Crime and deviance', topics: [
        'Theories of crime, deviance, social order and control',
        'Patterns by class, gender, ethnicity, locality; globalisation and green crime',
        'Crime control, prevention, punishment, victims and the role of the state' ] },
      { t: 'Theory and methods', topics: [
        'Consensus, conflict, structural and social action theories',
        'Is sociology a science? Objectivity and values in research',
        'Quantitative/qualitative methods, sources of data and sociology & social policy' ] } ]
  };

  /* ------------------------------ Primary — DfE national curriculum --------- */
  var primary = {
    ks1: {
      english_language: [
        { t: 'Reading', topics: [
          'Word reading — phonics, decoding and blending',
          'Comprehension — familiar stories, poems; vocabulary and simple inference' ] },
        { t: 'Writing', topics: [
          'Transcription — spelling (grapheme–phoneme correspondences), common exception words',
          'Composition — writing sentences, sequencing ideas, reading work aloud',
          'Handwriting — correct letter formation and sizing' ] },
        { t: 'Grammar, punctuation & vocabulary', topics: [
          'Capital letters, full stops, question and exclamation marks',
          'Joining words and clauses (and); the terminology for Year 1/2' ] },
        { t: 'Spoken language', topics: [
          'Listening and responding; articulating clearly',
          'Participating in discussions, role-play and performance' ] } ],
      mathematics: [
        { t: 'Number & place value', topics: [
          'Counting, reading and writing numbers to 100',
          'Tens and ones; comparing and ordering numbers' ] },
        { t: 'Addition & subtraction', topics: [
          'Number bonds and facts within 20',
          'Solving one-step problems with objects and pictures' ] },
        { t: 'Multiplication & division', topics: [
          'The 2, 5 and 10 times tables',
          'Grouping and sharing; arrays and equal groups' ] },
        { t: 'Fractions', topics: [
          'Recognising a half and a quarter of a shape or quantity' ] },
        { t: 'Measurement', topics: [
          'Length, mass, capacity, temperature; money; telling the time' ] },
        { t: 'Geometry & statistics', topics: [
          'Properties of 2-D and 3-D shapes; position, direction and turns',
          'Simple tally charts and pictograms (Year 2)' ] } ],
      science: [
        { t: 'Plants', topics: [
          'Identify and name common plants; structure of a plant',
          'What plants need to grow and stay healthy' ] },
        { t: 'Animals, including humans', topics: [
          'Common animal groups; what animals (and humans) need to survive',
          'The human body and the senses' ] },
        { t: 'Everyday materials', topics: [
          'Identify and name materials; compare their properties and uses' ] },
        { t: 'Seasonal changes & habitats', topics: [
          'The four seasons, weather and day length',
          'Living things and their habitats; simple food chains (Year 2)' ] },
        { t: 'Working scientifically', topics: [
          'Observing closely, asking questions and performing simple tests',
          'Identifying, grouping and recording findings' ] } ]
    },
    ks2: {
      english_language: [
        { t: 'Reading', topics: [
          'Word reading — morphology and etymology to decode unfamiliar words',
          'Comprehension — retrieval, inference, prediction, themes and the author’s intent' ] },
        { t: 'Writing — composition', topics: [
          'Planning, drafting, editing and proofreading',
          'Organising writing for purpose and audience; cohesion across paragraphs' ] },
        { t: 'Writing — transcription & handwriting', topics: [
          'Spelling patterns, prefixes/suffixes and homophones',
          'Fluent, joined and legible handwriting' ] },
        { t: 'Grammar, punctuation & vocabulary', topics: [
          'Word classes, clauses, phrases and tense consistency',
          'Commas, apostrophes, inverted commas, colons and the Year 5/6 terminology' ] },
        { t: 'Spoken language', topics: [
          'Debating, presenting and performing; using Standard English',
          'Building vocabulary and reasoning out loud' ] } ],
      mathematics: [
        { t: 'Number & place value', topics: [
          'Numbers to 10,000,000; negative numbers and rounding',
          'Roman numerals; ordering and comparing large numbers' ] },
        { t: 'Calculation (+ − × ÷)', topics: [
          'Formal written methods for all four operations',
          'Factors, multiples, primes, squares and cubes; order of operations' ] },
        { t: 'Fractions, decimals & percentages', topics: [
          'Equivalent fractions; adding, subtracting, multiplying and dividing fractions',
          'Converting between fractions, decimals and percentages' ] },
        { t: 'Ratio, proportion & algebra (Year 6)', topics: [
          'Scaling, percentages and unequal sharing',
          'Simple formulae, linear sequences and finding unknowns' ] },
        { t: 'Measurement', topics: [
          'Units and conversions; perimeter, area and volume',
          'Money, time and solving multi-step problems' ] },
        { t: 'Geometry & statistics', topics: [
          'Angles, properties of 2-D/3-D shapes and circles; coordinates, translation and reflection',
          'Bar charts, time graphs, pie charts, line graphs and the mean (Year 6)' ] } ],
      science: [
        { t: 'Plants & living things', topics: [
          'Plant life cycle, reproduction and water transport',
          'Classification of living things (Linnaean); life cycles and reproduction',
          'Evolution and inheritance; adaptation (Year 6)' ] },
        { t: 'Animals, including humans', topics: [
          'Nutrition, skeletons and muscles; the digestive system and teeth',
          'The circulatory system and the impact of diet, exercise and drugs (Year 6)' ] },
        { t: 'Materials — rocks & states of matter', topics: [
          'Rocks, soils and fossils (Year 3)',
          'States of matter, evaporation, condensation and the water cycle (Year 4)',
          'Properties and changes of materials; reversible & irreversible change (Year 5)' ] },
        { t: 'Physical processes', topics: [
          'Light — how we see, shadows and reflection (Year 3/6)',
          'Sound — vibrations, pitch and volume (Year 4)',
          'Forces and magnets; gravity, air/water resistance, levers and gears (Year 3/5)',
          'Electricity — circuits, components and symbols (Year 4/6)' ] },
        { t: 'Earth & space', topics: [
          'The movement of the Earth, Moon and planets; day and night (Year 5)' ] },
        { t: 'Working scientifically', topics: [
          'Planning fair tests and controlling variables',
          'Taking accurate measurements, recording data and drawing conclusions' ] } ]
    }
  };

  window.SYCURRIC_EXT = { alevel: alevel, primary: primary, boards: {} };
})();
