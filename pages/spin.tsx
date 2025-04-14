import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('../components/ClientWheel'), {
  ssr: false, // ✅ prevent SSR to avoid window error
});

import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const wheelData = [
  { option: 'SPRING10' },
  { option: 'SUMMER15' },
  { option: 'FALL20' },
  { option: 'WINTER25' },
  { option: 'BONUS50' },
  { option: 'NEWYEAR5' }
];

export default function SpinWheel() {
  const [handle, setHandle] = useState('');
  const [userCode, setUserCode] = useState('');
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);

  const checkUser = async () => {
    const q = query(collection(db, 'users'), where('handle', '==', handle));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      setUserCode(docData.code);
      setHasSpun(true);
    } else {
      const codesSnapshot = await getDocs(collection(db, 'promo_codes'));
      const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);

      if (unusedCodes.length === 0) {
        alert('No promo codes left!');
        return;
      }

      const randomIndex = Math.floor(Math.random() * unusedCodes.length);
      const selectedCode = unusedCodes[randomIndex].data().code;

      const wheelIndex = wheelData.findIndex(item => item.option === selectedCode);
      setPrizeIndex(wheelIndex);
      setMustSpin(true);

      await setDoc(doc(db, 'users', handle), {
        handle,
        code: selectedCode,
        createdAt: new Date()
      });

      await setDoc(doc(db, 'promo_codes', selectedCode), {
        code: selectedCode,
        used: true,
        assignedTo: handle
      });

      setUserCode(selectedCode);
      setHasSpun(true);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-rose-600 mb-6">🎡 Spin the Wheel 🎉</h1>

      {!hasSpun && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter IG Handle"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="border p-2 rounded-xl"
          />
          <button
            className="ml-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
            onClick={checkUser}
            disabled={!handle}
          >
            Spin
          </button>
        </div>
      )}

      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeIndex}
        data={wheelData}
        onStopSpinning={() => setMustSpin(false)}
        backgroundColors={['#FFEBEE', '#F8BBD0']}
        textColors={['#880E4F']}
      />

      {hasSpun && (
        <div className="mt-6 text-lg text-rose-700">
          🎁 Your promo code: <span className="font-bold">{userCode}</span>
        </div>
      )}
    </div>
  );
}
