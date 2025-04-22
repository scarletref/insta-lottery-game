import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Wheel component (client-side only)
const Wheel = dynamic(() => import('../components/ClientWheel'), {
  ssr: false,
});

import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Prize options shown on the wheel
const wheelData = [
  { option: '買一送一', style: { textColor: '#C1A400' }, image: { uri: '/images/dancing_in_the_loop.png' } },
  { option: '九折', style: { textColor: '#0C1F36' } },
  { option: '八折', style: { textColor: '#00A8BD' } },
  { option: '七折', style: { textColor: '#9531BD' } },
  { option: '九折', style: { textColor: '#005100' } },
  { option: '八折', style: { textColor: '#0E208D' } }
];


const fontFamily = "Noto Serif TC";

function isValidInstagramHandle(handle: string): boolean {
  const regex = /^(?!.*\.\.)(?!\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/;
  return regex.test(handle);
}


export default function SpinWheel() {
  // State variables for game logic and UI
  const [handle, setHandle] = useState(''); // IG handle
  const [userCode, setUserCode] = useState(''); // Prize code
  const [mustSpin, setMustSpin] = useState(false); // Trigger wheel spin
  const [prizeIndex, setPrizeIndex] = useState(0); // Index of selected prize
  const [hasSpun, setHasSpun] = useState(false); // Track if wheel has spun
  const [showPopup, setShowPopup] = useState(false); // Show popup result
  const [returningUserInfo, setReturningUserInfo] = useState<{ code: string; createdAt: string; prize: string } | null>(null);

  // Reset all local states
  const resetState = () => {
    setUserCode('');
    setMustSpin(false);
    setPrizeIndex(0);
    setHasSpun(false);
    setShowPopup(false);
    setReturningUserInfo(null);
  };

  // Check Firestore to see if  playedthis user has already
  const checkUser = async () => {
    resetState();
    const trimmedHandle = handle.trim();
    if (!isValidInstagramHandle(trimmedHandle)) {
      alert('請輸入有效的 IG 帳號（僅限英數、底線、句點，不能開頭或結尾為句點）');
      return;
    }
    const userRef = doc(db, 'users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const docData = userSnap.data();
      setReturningUserInfo({
        code: docData.code,
        prize: docData.prize,
        createdAt: new Date(docData.createdAt.seconds * 1000).toLocaleString(),
      });
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'promo_codes'));
    //const codes = codesSnapshot.docs;

    const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);
    console.log('Unused codes:', unusedCodes.map(doc => doc.data().code)); // Log unused codes

    if (unusedCodes.length === 0) {
      alert('No promo codes left!');
      return;
    }


    const randomIndex = Math.floor(Math.random() * unusedCodes.length);
    const selectedCode = unusedCodes[randomIndex].data().code;
    const selectedPrizedName = unusedCodes[randomIndex].data().prize;
    console.log('Selected code:', selectedCode); // Log selected code

    const wheelIndex = wheelData.findIndex(item => item.option === selectedPrizedName);

    setPrizeIndex(wheelIndex);
    setMustSpin(true);

    await setDoc(doc(db, 'users', trimmedHandle), {
      handle: trimmedHandle,
      code: selectedCode,
      prize: selectedPrizedName,
      createdAt: new Date(),
    });


    await setDoc(doc(db, 'promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle,
    });


    setUserCode(selectedPrizedName);
    setHasSpun(true);
  };

  // Trigger popup when spin is done and prize is assigned
  useEffect(() => {
    if (!mustSpin && hasSpun && userCode) {
      setShowPopup(true);
    }
  }, [mustSpin, hasSpun, userCode]);

  return (
    <div className="min-h-screen bg-[url('/images/light-paper-texture.png')] bg-cover bg-center flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full flex items-center justify-center mb-6">
        <img
          src="/images/misty.png"
          alt="fog"
          className="absolute left-[calc(50%-180px)] top-[-30px] w-32 opacity-60 animate-float-slow z-10"
        />
        <img
          src="/images/fog.png"
          alt="misty"
          className="absolute right-[calc(50%-180px)] top-[-30px] w-32 opacity-60 animate-float-slower z-10"
        />
        <h1 className="text-3xl font-bold text-rose-600 mb-6">Loop & Win</h1>
      </div>


      {/* IG帳號輸入欄位 */}
      {!returningUserInfo && !mustSpin && (
        <div className="relative z-20 mb-6 text-center">
          <input
            type="text"
            placeholder="請輸入您的ig帳號"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="border p-2 rounded-xl"
          />
          <button
            className="ml-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
            onClick={checkUser}
            disabled={!handle.trim()}
          >
            轉動抽獎
          </button>
        </div>
      )}

      {/* 抽獎輪盤 */}
      <div className="relative w-[300px] sm:w-[400px] md:w-[500px]">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeIndex}
          data={wheelData}
          onStopSpinning={() => setMustSpin(false)}
          backgroundColors={["#0E208D", "#005100", "#9531BD", "#00A8BD", "#0C1F36", "#C1A400"]}
          textColors={["#880E4F"]}
          outerBorderWidth={0}
          radiusLineWidth={5}
          radiusLineColor='#000000'
          innerRadius={0}
          innerBorderWidth={0}
          fontSize={30}
          fontFamily={fontFamily}
          textDistance={50}
          pointerProps={{
            src: '/images/arrow.png',
            style: {
              position: 'absolute',
              left: '80%',
              width: '80px',
              height: 'auto',
              zIndex: 50,
              animation: mustSpin ? 'bounce 0.5s infinite' : 'pointer-fly 5s infinite',
            },
          }}
        />
      </div>

      {/* 輪盤背景圖 */}
      <div
        className={`absolute inset-0 bg-center bg-contain bg-no-repeat z-0 ${mustSpin ? 'animate-zoom-spin' : 'animate-spin-slow'}`}
        style={{ backgroundImage: "url('/images/dancing_in_the_loop.png')" }}
      />

      {/* 中獎結果或重複參加提示 */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-white/80 bg-opacity-20 rounded-xl shadow-xl p-6 text-center max-w-sm pointer-events-auto">
            {returningUserInfo ? (
              <>
                <h2 className="text-2xl font-bold text-rose-600 mb-4">📌 您抽過獎了</h2>
                <p className="text-lg mb-2">親愛的 {handle} ，您轉過一次了喔：</p>
                <p className="text-rose-700 font-semibold mb-2">{returningUserInfo.createdAt}</p>
                <p className="text-sm text-gray-600 mb-4">
                  獎項是：<span className="font-bold">{returningUserInfo.prize} ({returningUserInfo.code})</span>
                </p>
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