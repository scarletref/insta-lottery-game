import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('../components/ClientWheel'), {
  ssr: false, // ✅ prevent SSR to avoid window error
});

import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const wheelData = [
  { option: '買一送一' },
  { option: '九折' },
  { option: '八折' },
  { option: '七折' },
  { option: '九折' },
  { option: '八折' }
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
        <div className="relative z-20 mb-6 text-center">
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
            backgroundColors={['#0E208D', '#005100', '#9531BD', '#00A8BD', '#0C1F36', '#C1A400']}
            textColors={['#880E4F']} 
            outerBorderWidth={0}  
            radiusLineWidth={1} 
            pointerProps={{
            src: '/images/arrow.png',
                style: {
                    width: '400px',
                    height: '400px',
                    top: '-50px',
                    left: '150px',
                },
            }}
            innerRadius={0}
        /> 
        {/* ✅ Background image div */}
        <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat z-0"
            style={{ backgroundImage: "url('/images/dancing_in_the_loop.png')" }}
        />
    </div>
  );
}
