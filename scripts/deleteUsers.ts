// scripts/deleteUsers.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json'; // download from Firebase Console

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();

async function deleteAllUsers() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Deleted ${snapshot.size} user(s).`);
}

deleteAllUsers().catch(console.error);
