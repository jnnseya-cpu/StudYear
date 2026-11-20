/* ============================================================================
 * StudYear — canonical UK qualifications & subjects vocabulary (single source
 * of truth for the public pages). Every page should prefer window.SYVOCAB over
 * its own hardcoded arrays, keeping its old array only as an offline fallback.
 *
 * Covers the full ladder of UK qualifications: Primary → KS3 → Entry Level /
 * Functional Skills → GCSE → Level 1/2 vocational → A-level / T-Level / BTEC /
 * IB / Access to HE / NVQ (L3) → Apprenticeships → HNC/HND / Foundation degree
 * → University (Foundation, Undergraduate, Master's, PhD) → adult & lifelong.
 *
 * NOTE: individual universities and specific named courses are NOT enumerated
 * here — there are 160+ UK universities and thousands of courses, and StudYear
 * generates course content for any (level × subject) on demand. What IS curated
 * is the LEVEL, the SUBJECT, and, for vocational routes, the sector/route list.
 * ==========================================================================*/
(function (w) {
  var V = {};

  /* ---- Levels / qualifications (stage order; existing labels kept verbatim so
         saved profiles still match, with the full UK set added around them) ---- */
  V.levels = [
    // Primary
    'Reception (EYFS · age 4–5)',
    'Key Stage 1 (Years 1–2 · age 5–7)',
    'Key Stage 2 (Years 3–6 · age 7–11)',
    '11+ Exam',
    // Lower secondary
    'Years 7-9 (KS3)',
    // Entry / functional
    'Entry Level',
    'Functional Skills',
    // Level 1/2
    'GCSE',
    'IGCSE',
    'GCSE resit',
    'BTEC Tech Award (Level 1/2)',
    'Cambridge National (Level 1/2)',
    'National 4',
    'National 5',
    // Level 3 — academic
    'AS',
    'A2/A-level',
    'Core Maths (Level 3)',
    'EPQ (Extended Project)',
    'International Baccalaureate',
    'Welsh Baccalaureate',
    'Pre-U',
    'Scottish Highers',
    'Scottish Advanced Highers',
    // Level 3 — vocational / technical
    'T-Level',
    'BTEC National',
    'Cambridge Technical (Level 3)',
    'Access to HE Diploma',
    'NVQ',
    'Level 2 Engineering',
    // Apprenticeships (intermediate → degree)
    'Apprenticeship',
    // Higher education (L4–L8)
    'HNC (Level 4)',
    'HND (Level 5)',
    'Foundation degree',
    'University · Foundation year',
    'University · Undergraduate Year 1',
    'University · Undergraduate Year 2',
    'University · Undergraduate Year 3 / Final',
    "University · Master's / Postgraduate",
    'University · PhD / Doctorate',
    // Adult / other
    'NEET · Return to learning (16–26)',
    'Lifelong learning · Adult autodidact',
    'Fun',
    'Other',
  ];
  /* a trailing "All Levels" is used by some creator/search dropdowns */
  V.levelsWithAll = V.levels.concat(['All Levels']);

  /* ---- Subjects (comprehensive UK academic + widely-taught vocational) ---- */
  V.subjects = [
    'Accounting', 'Ancient History', 'Arabic', 'Art & Design', 'Astronomy',
    'Biology', 'Business', 'Business Studies', 'Chemistry', 'Childcare & Early Years',
    'Chinese (Mandarin)', 'Citizenship', 'Classical Civilisation', 'Combined Science',
    'Computer Science', 'Computing', 'Construction', 'Criminology', 'Dance',
    'Design & Technology', 'Drama', 'Economics', 'Electrical Engineering (Level 2)',
    'Electrical Wiring and Testing', 'Electronics', 'Engineering', 'English',
    'English Language', 'English Literature', 'Environmental Science', 'Film Studies',
    'Finance', 'Food Preparation & Nutrition', 'French', 'Further Mathematics',
    'Geography', 'Geology', 'German', 'Government & Politics', 'Graphic Design',
    'Hairdressing & Beauty', 'Health & Social Care', 'History', 'Hospitality & Catering',
    'ICT', 'Italian', 'Latin', 'Law', 'Marine Science', 'Mathematics', 'Media Studies',
    'Motor Vehicle', 'Music', 'Music Technology', 'Nursing & Healthcare', 'Philosophy',
    'Photography', 'Physical Education', 'Physics', 'Polish', 'Portuguese',
    'Product Design', 'Psychology', 'Public Services',
    'Religious Studies', 'Russian', 'Science', 'Sociology', 'Spanish', 'Statistics',
    'Textiles', 'Travel & Tourism', 'Urdu', 'Welsh',
    'Fun', 'Other',
  ];

  /* ---- Per-qualification "extended courses" / routes (what a learner on that
         qualification actually studies). Keyed by a substring of the level. ---- */
  V.routes = {
    'T-Level': [
      'Agriculture, Environmental & Animal Care', 'Business & Administration',
      'Catering', 'Construction', 'Creative & Design', 'Digital',
      'Education & Early Years', 'Engineering & Manufacturing',
      'Hair, Beauty & Aesthetics', 'Health & Science', 'Legal, Finance & Accounting',
    ],
    'BTEC': [
      'Applied Science', 'Art & Design', 'Business', 'Children’s Play & Early Years',
      'Construction & the Built Environment', 'Creative Digital Media Production',
      'Engineering', 'Health & Social Care', 'Hospitality', 'Information Technology',
      'Music / Music Technology', 'Performing Arts', 'Public & Uniformed Services',
      'Sport', 'Travel & Tourism', 'Animal Management', 'Agriculture',
      'Applied Law', 'Enterprise & Entrepreneurship', 'Aviation',
    ],
    'NVQ': [
      'Business Administration', 'Customer Service', 'Management & Team Leading',
      'Health & Social Care', 'Children & Young People (Childcare)',
      'Supporting Teaching & Learning', 'Electrotechnical / Electrical Installation',
      'Plumbing & Heating', 'Bricklaying', 'Carpentry & Joinery', 'Plastering',
      'Painting & Decorating', 'Hairdressing', 'Beauty Therapy',
      'Hospitality & Catering', 'Retail', 'Warehousing & Storage',
      'Engineering', 'Motor Vehicle / Automotive', 'Accounting (AAT)', 'IT User Skills',
    ],
    'Apprenticeship': [
      'Accountancy', 'Business Administration', 'Software Development',
      'Data Analyst', 'Cyber Security', 'Network Engineer', 'Engineering',
      'Electrical', 'Construction', 'Plumbing', 'Motor Vehicle',
      'Health & Social Care', 'Nursing Associate', 'Dental Nursing',
      'Teaching Assistant', 'Early Years Educator', 'Hospitality',
      'Customer Service', 'Marketing', 'Team Leader / Management', 'Legal', 'Hairdressing',
    ],
    'HNC': ['Business', 'Computing', 'Engineering', 'Construction & the Built Environment', 'Health & Social Care', 'Applied Sciences', 'Art & Design', 'Sport'],
    'HND': ['Business', 'Computing', 'Engineering', 'Construction & the Built Environment', 'Health & Social Care', 'Applied Sciences', 'Art & Design', 'Hospitality Management', 'Music Production', 'Film & TV'],
    'Functional Skills': ['English', 'Mathematics', 'Digital / ICT'],
    'Access to HE': ['Nursing & Midwifery', 'Health Professions', 'Social Work', 'Business', 'Law', 'Computing', 'Science', 'Humanities', 'Education'],
    // University degree AREAS (not named universities) — content generated on demand
    'University': [
      'Medicine', 'Dentistry', 'Veterinary Science', 'Nursing & Midwifery',
      'Pharmacy', 'Allied Health (Physiotherapy, Radiography)', 'Law',
      'Business & Management', 'Economics', 'Accounting & Finance',
      'Computer Science', 'Software Engineering / AI', 'Data Science',
      'Cyber Security', 'Mechanical Engineering', 'Electrical & Electronic Engineering',
      'Civil Engineering', 'Aerospace Engineering', 'Chemical Engineering',
      'Mathematics', 'Physics', 'Chemistry', 'Biology / Biological Sciences',
      'Biomedical Science', 'Natural Sciences', 'Psychology', 'Sociology',
      'Politics & International Relations', 'History', 'English', 'Modern Languages',
      'Philosophy', 'Geography', 'Environmental Science', 'Architecture',
      'Art & Design', 'Media & Communications', 'Education / Teaching (PGCE)',
      'Social Work', 'Criminology', 'Sports Science',
    ],
  };

  /* Return the extended course/route list for a given level label, or null. */
  V.coursesForLevel = function (level) {
    var L = String(level || '');
    var keys = ['T-Level', 'Functional Skills', 'Access to HE', 'BTEC', 'NVQ', 'Apprenticeship', 'HND', 'HNC', 'University', 'Foundation degree'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (L.toLowerCase().indexOf(k.toLowerCase()) >= 0) {
        if (k === 'Foundation degree') return V.routes['HND'];
        return V.routes[k] || null;
      }
    }
    return null;
  };

  w.SYVOCAB = V;
})(window);
