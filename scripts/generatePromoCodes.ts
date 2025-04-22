import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json'; // Your downloaded Admin SDK key

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();

async function generatePromoCodes() {
  let numCodes = 0; // Change to however many you want
  //const prefix = 'PROMO'; // Optional code prefix

  const batch = db.batch();
  const prizes = ['買一送一', '九折', '八折', '七折']; // Prize options shown on the wheel
  const prizes_en = ['buyonegetone', '10off', '20off', '30off']; // Prize options shown on the wheel in English
  const prize_numbers = [1, 70, 20, 9]; // Prize numbers for the wheel

  for (let i = 0; i <prizes.length ; i++) {
    const prize = prizes[i];
    const prize_number = prize_numbers[i];
    const prize_en = prizes_en[i];

    for (let j = 0; j < prize_number; j++) {
        const code = `${prize_en}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const docRef = db.collection('promo_codes').doc(code);
    
        batch.set(docRef, {
            code,
            prize,
            used: false,
            assignedTo: null,
        });

        numCodes++;
        }

  }

  await batch.commit();
  console.log(`✅ Successfully created ${numCodes} promo codes.`);
}



async function deleteAllPromoteCodes() {
  const snapshot = await db.collection('promo_codes').get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Deleted ${snapshot.size} promo code(s).`);
}

deleteAllPromoteCodes().catch(console.error);
generatePromoCodes().catch(console.error);
