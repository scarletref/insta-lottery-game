import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('../components/ClientWheel'), {
  ssr: false, // ✅ prevent SSR to avoid window error
});

import { collection, getDocs, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
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
  const [showPopup, setShowPopup] = useState(false);
  const [returningUserInfo, setReturningUserInfo] = useState<{ code: string; createdAt: string } | null>(null);

  const resetState = () => {
    setUserCode('');
    setMustSpin(false);
    setPrizeIndex(0);
    setHasSpun(false);
    setShowPopup(false);
    setReturningUserInfo(null);
  };

  const checkUser = async () => {
    resetState();
    const trimmedHandle = handle.trim();
    const userRef = doc(db, 'users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const docData = userSnap.data();
      setReturningUserInfo({
        code: docData.code,
        createdAt: new Date(docData.createdAt.seconds * 1000).toLocaleString()
      });
      setShowPopup(true);
      return;
    }

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

    await setDoc(doc(db, 'users', trimmedHandle), {
      handle: trimmedHandle,
      code: selectedCode,
      createdAt: new Date()
    });

    await setDoc(doc(db, 'promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle
    });

    setUserCode(selectedCode);
    setHasSpun(true);
  };

  useEffect(() => {
    if (!mustSpin && hasSpun && userCode) {
      setShowPopup(true);
    }
  }, [mustSpin, hasSpun, userCode]);

  return (
    <div className="min-h-screen bg-[url('/images/light-paper-texture.png')] bg-cover bg-center flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-rose-600 mb-6">迷霧抽獎活動</h1>

      {!returningUserInfo && !mustSpin && (
        <div className="relative z-20 mb-6 text-center">
          <input
            type="text"
            placeholder="請輸入您的ig帳號"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="border p-2 rounded-xl"
          />
          <button
            className="ml-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
            onClick={checkUser}
            disabled={!handle.trim()}
          >
            轉
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

      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-white bg-opacity-20 rounded-xl shadow-xl p-6 text-center max-w-sm pointer-events-auto">
            {returningUserInfo ? (
              <>
                <h2 className="text-2xl font-bold text-rose-600 mb-4">📌 您抽過獎了</h2>
                <p className="text-lg mb-2">親愛的 {handle} ，您轉過一次了喔：</p>
                <p className="text-rose-700 font-semibold mb-2">{returningUserInfo.createdAt}</p>
                <p className="text-sm text-gray-600 mb-4">獎項是：<span className="font-bold">{returningUserInfo.code}</span></p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-rose-600 mb-4">🎉 恭喜！</h2>
                <p className="text-lg mb-2">親愛的 {handle} ，您得到：<span className="font-bold">{userCode}</span></p>
                <p className="text-sm text-gray-600 mb-4">請截圖傳給迷霧主人喔</p>
              </>
            )}
            <button
              className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
              onClick={() => setShowPopup(false)}
            >
              了解!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
