// SPDX-License-Identifier: CC-BY-4.0
// This file is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)

import { useState, useRef } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const ringOptions = [
  {
    id: 'ring1',
    icon: '/images/ring1.png',
    worn: '/images/ring1_worn.png',
    style: 'absolute top-[198px] left-[86px] w-12 h-12', // index finger
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
  },
  {
    id: 'ring4',
    icon: '/images/ring4.png',
    worn: '/images/ring4_worn.png',
    style: 'absolute top-[191.5px] left-[63px] w-12 h-12', // pinky finger
    width: 29,
    height: 20,
  },
];

export default function HandRingGame() {
  const [placedRingIds, setPlacedRingIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [igHandle, setIgHandle] = useState('');
  const gameRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePlaceRing = (ringId: string) => {
    if (!placedRingIds.includes(ringId)) {
      setPlacedRingIds([...placedRingIds, ringId]);
    }
  };

  const handleFinish = async () => {
    const trimmedHandle = igHandle.trim();
    if (!trimmedHandle) return alert('請輸入您的 ig 帳號');

    const userRef = doc(db, 'users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setPromoCode(userSnap.data().code);
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'promo_codes'));
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

    await setDoc(doc(db, 'promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle,
    });

    setPromoCode(selectedCode);
    setShowPopup(true);

    // capture screenshot
    if (gameRef.current) {
        html2canvas(gameRef.current).then(canvas => {
          const dataUrl = canvas.toDataURL('image/png');
          setPreviewImage(dataUrl); // Show it instead of downloading
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-8 relative overflow-hidden">
      <h1 className="text-2xl font-bold text-pink-600 mb-4">Ring Styling Game</h1>

      <div className="mb-2">
        <input
          type="text"
          placeholder="請輸入 IG 帳號"
          value={igHandle}
          onChange={(e) => setIgHandle(e.target.value)}
          className="px-4 py-2 border rounded shadow"
        />
      </div>

      {/* Ring Selector */}
      <div className="flex space-x-3 mb-4 z-20">
        {ringOptions.map((ring) => (
          <button
            key={ring.id}
            onClick={() => handlePlaceRing(ring.id)}
            className="w-16 h-16 border rounded-full overflow-hidden shadow-md hover:scale-105 transition"
          >
            <Image src={ring.icon} alt={`Ring ${ring.id}`} width={64} height={64} />
          </button>
        ))}
      </div>

      {/* Hand background with placed rings */}
      <div ref={gameRef} className="relative w-[320px] h-[480px] rounded-lg shadow-lg" style={{ backgroundColor: '#D6EA95' }}>
        <Image src="/images/hands.png" alt="hands" layout="fill" objectFit="contain" />

        {/* Render selected rings on hand */}
        {ringOptions.map(
            (ring) =>
                placedRingIds.includes(ring.id) && (
                <div
                    key={ring.id}
                    className={`${ring.style} cursor-pointer`}
                    onClick={() =>
                    setPlacedRingIds((prev) => prev.filter((id) => id !== ring.id))
                    }
                    title="點擊卸下這枚戒指"
                >
                    <Image
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
        <div className="fixed top-20 bg-white p-4 rounded shadow-lg text-center z-30">
          <h2 className="text-xl font-bold text-pink-600 mb-2">🎁 恭喜！</h2>
          <p>帳號 {igHandle} 的折扣碼：</p>
          <p className="text-lg font-mono text-gray-800 mt-1">{promoCode}</p>
          {previewImage && (
            <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">長按下方圖片即可儲存或分享到 IG：</p>
                <img src={previewImage} alt="ring preview" className="w-full rounded shadow" />
            </div>
          )}
          <button
            className="mt-3 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setShowPopup(false)}
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
}
