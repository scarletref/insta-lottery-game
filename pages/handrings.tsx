// SPDX-License-Identifier: CC-BY-4.0
// This file is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)

import { useState, useRef } from 'react';
import Image from 'next/image';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import Sparkle from '../components/Sparkle'; // if you created it as a separate file

const ringOptions = [
  {
    id: 'ring4',
    icon: '/images/ring4.png',
    worn: '/images/ring4_worn.png',
    style: 'absolute top-[191.5px] left-[63px] w-12 h-12', // pinky finger
    width: 29,
    height: 20,
  },
  {
    id: 'ring1',
    icon: '/images/ring1.png',
    worn: '/images/ring1_worn.png',
    style: 'absolute top-[198px] left-[86px] w-12 h-12 z-20', // index finger
    width: 32,
    height: 30,
  },
  {
    id: 'ring2',
    icon: '/images/ring2.png',
    worn: '/images/ring2_worn.png',
    style: 'absolute top-[199px] left-[201px] w-12 h-12', // middle finger
    width: 32,
    height: 27,
  },
  {
    id: 'ring3',
    icon: '/images/ring3.png',
    worn: '/images/ring3_worn.png',
    style: 'absolute top-[186px] left-[249px] w-12 h-12', // ring finger
    width: 33,
    height: 19,
  }

];

const backgroundOptions = [
    '#DEB8FF',
    '#D6EA95',
    '#B8DFFF',
  ];


  function isValidInstagramHandle(handle: string): boolean {
    const regex = /^(?!.*\.\.)(?!\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/;
    return regex.test(handle);
}
export default function HandRingGame() {
  const [placedRingIds, setPlacedRingIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [igHandle, setIgHandle] = useState('');
  //const gameRef = useRef<HTMLDivElement>(null);
  //const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cardBg, setCardBg] = useState<string | null>('#D6EA95');


  const handlePlaceRing = (ringId: string) => {
    if (!placedRingIds.includes(ringId)) {
      setPlacedRingIds([...placedRingIds, ringId]);
    }
  };

  const handleFinish = async () => {
    const trimmedHandle = igHandle.trim();
    if (!trimmedHandle) return alert('請輸入您的 ig 帳號');

    if (!isValidInstagramHandle(trimmedHandle)) {
      alert('請輸入有效的 ig 帳號（僅限英數、底線、句點，不能開頭或結尾為句點）');
      return;
    }

    const userRef = doc(db, 'handrings_users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setPromoCode(userSnap.data().code);
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'handrings_promo_codes'));
    const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);

    if (unusedCodes.length === 0) {
      alert('所有折扣碼已領完');
      return;
    }

    const selectedCode = unusedCodes[Math.floor(Math.random() * unusedCodes.length)].data().code;

    await setDoc(userRef, {
      handle: trimmedHandle,
      code: selectedCode,
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'handrings_promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle,
    });

    setPromoCode(selectedCode);
    setShowPopup(true);


  };
  const changeCardBackground = () => {
    if (backgroundOptions.length <= 1) return;
  
    let newBg = cardBg;
    while (newBg === cardBg) {
      newBg = backgroundOptions[Math.floor(Math.random() * backgroundOptions.length)];
    }
    setCardBg(newBg);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-8 relative overflow-hidden">
      <h1 className="text-2xl font-bold text-pink-600 mb-4">♦️Ring Styling♠️</h1>

      <div className="mb-2">
        <input
          type="text"
          placeholder="請輸入您的ig帳號"
          value={igHandle}
          onChange={(e) => setIgHandle(e.target.value)}
          className="px-4 py-2 border rounded shadow"
        />
      </div>

      {/* Ring Selector */}
      <div className="flex space-x-3 mb-4 z-20 flex-wrap justify-center">
    
        {ringOptions.map((ring, index) =>
            placedRingIds.includes(ring.id) ? (
            // Worn → show empty space
            <div
                key={ring.id}
                className="w-16 h-16 rounded-full opacity-30"
            />
            ) : (
            // Not worn → show button
            <button
                key={ring.id}
                onClick={() => handlePlaceRing(ring.id)}
                className={`w-16 h-16 overflow-hidden transform transition hover:rotate-10 animate-float-up`}
                style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
                }}
            >
                <Image src={ring.icon} alt={`Ring ${ring.id}`} width={64} height={64} />
            </button>
            )
        )}
        </div>


        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />

      {/* Hand background with placed rings */}

      <div
  onClick={changeCardBackground}
  className="relative w-[320px] h-[480px] rounded-lg shadow  overflow-hidden cursor-pointer transition-all duration-300"
  style={{
    background: cardBg?.startsWith('#') ? cardBg : `url(${cardBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
        {/* Logo #1 - top left corner */}
        <img
        src="/images/misty.png"
        alt="logo1"
        className="absolute top-2 left-2 w-12 h-12 opacity-80"
        />

        {/* Logo #2 - bottom right corner */}
        <img
        src="/images/fog.png"
        alt="logo2"
        className="absolute bottom-2 right-2 w-12 h-12 opacity-80"
        />
        <img src="/images/hands.png" alt="hands" className="absolute w-full h-full object-contain" />

        {/* Render selected rings on hand */}
        {ringOptions.map(
        (ring) =>
            placedRingIds.includes(ring.id) && (
            <div
                key={ring.id}
                className={`${ring.style} cursor-pointer animate-pop-in animate-sparkle`}
                onClick={() =>
                setPlacedRingIds((prev) => prev.filter((id) => id !== ring.id))
                }
                title="點擊卸下這枚戒指"
            >
                <Sparkle />
                <img
                src={ring.worn}
                alt="ring"
                width={ring.width}
                height={ring.height}
                />
            </div>
            )
        )}

      </div>

      <button
        className="mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        onClick={handleFinish}
      >
        完成設計並獲得折扣碼
      </button>

      {showPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
    <div className="bg-white p-4 rounded-lg shadow-lg text-center max-w-sm w-full">
      <h2 className="text-xl font-bold text-pink-600 mb-2">迷霧指尖魔法卡</h2>

      {/* Screenshot-ready card */}
      <div className="relative w-full aspect-[2/3] max-w-[320px] bg-[#D6EA95] rounded-lg shadow mx-auto mb-4 overflow-hidden" 
      style={{
    background: cardBg?.startsWith('#') ? cardBg : `url(${cardBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
  >
        {/* Logo #1 - top left corner */}
        <img
        src="/images/misty.png"
        alt="logo1"
        className="absolute top-2 left-2 w-12 h-12 opacity-80"
        />

        {/* Logo #2 - bottom right corner */}
        <img
        src="/images/fog.png"
        alt="logo2"
        className="absolute bottom-2 right-2 w-12 h-12 opacity-80"
        />
        <img
          src="/images/hands.png"
          alt="hands"
          className="absolute w-full h-full object-contain"
        />
        {ringOptions.map(
          (ring) =>
            placedRingIds.includes(ring.id) && (
              <div
                key={ring.id}
                className={`${ring.style} absolute`}
                style={{ width: `${ring.width}px`, height: `${ring.height}px` }}
              >
                <img
                  src={ring.worn}
                  alt="ring"
                  width={ring.width}
                  height={ring.height}
                />
              </div>
            )
        )}
        {/* Text overlay */}
        <div className="absolute bottom-4 w-full text-center text-xs font-medium text-gray-800">
          IG: @{igHandle} · 折扣碼: {promoCode}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">請截圖此卡片並分享至ig即可使用折扣碼唷</p>

      <button
        className="mt-2 px-4 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
        onClick={() => setShowPopup(false)}
      >
        關閉
      </button>
    </div>
  </div>
)}


    </div>
  );
}
