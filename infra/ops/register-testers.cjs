/**
 * Ops task: register the tester accounts' roles in Firestore.
 * Runs on the Ops workflow runner with the FIREBASE_SERVICE_ACCOUNT
 * credentials (GOOGLE_APPLICATION_CREDENTIALS) — the accounts themselves
 * already exist in Firebase Auth; this stamps their role + plan so the
 * new-device sign-in flow can restore them onto any browser.
 * No passwords are needed or stored here.
 */
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'revision-rocket-4nuir' });
const db = admin.firestore();
const auth = admin.auth();

const TESTERS = [
  ['student.tester@studyear.com', 'student', 'Tess Carter'],
  ['parent.tester@studyear.com', 'parent', 'Paul Carter'],
  ['teacher.tester@studyear.com', 'teacher', 'Tara Mensah'],
  ['school.tester@studyear.com', 'school', 'Sam Sharma'],
  ['tutor.tester@studyear.com', 'tutor', 'Toni Okafor'],
  ['authority.tester@studyear.com', 'authority', 'Ava Whitmore'],
];

(async () => {
  let fails = 0;
  for (const [email, role, name] of TESTERS) {
    try {
      const u = await auth.getUserByEmail(email);
      await db.doc('users/' + u.uid).set({
        email, name,
        roles: admin.firestore.FieldValue.arrayUnion(role),
        plan: 'child_free',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('OK  ' + role.padEnd(10) + email + '  uid=' + u.uid);
    } catch (e) {
      fails++; console.log('FAIL ' + role.padEnd(10) + email + '  ' + e.message);
    }
  }
  console.log(fails ? 'DONE WITH ' + fails + ' FAILURE(S)' : 'ALL TESTERS REGISTERED');
  process.exit(fails ? 1 : 0);
})();
