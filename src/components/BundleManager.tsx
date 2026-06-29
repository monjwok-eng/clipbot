import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Bundle, ClipData } from '../types';
import { User } from 'firebase/auth';

interface BundleManagerProps {
  user: User;
  tier: 'free' | 'pro' | 'promax';
  allUserClips: ClipData[];
  activeBundleId: string | null;
  setActiveBundleId: (id: string | null) => void;
}

export const BundleManager: React.FC<BundleManagerProps> = ({ user, tier, allUserClips, activeBundleId, setActiveBundleId }) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [newBundleName, setNewBundleName] = useState('');

  useEffect(() => {
    const fetchBundles = async () => {
      const q = query(collection(db, 'bundles'), where('ownerUid', '==', user.uid));
      const snapshot = await getDocs(q);
      const bundlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
      setBundles(bundlesData);
    };
    fetchBundles();
  }, [user.uid]);

  const handleCreateBundle = async () => {
    const name = newBundleName.trim() || `Bundle ${new Date().toLocaleString()}`;
    
    try {
      const docRef = await addDoc(collection(db, 'bundles'), {
        name: name,
        clipIds: [],
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setActiveBundleId(docRef.id);
      setNewBundleName('');
      
      const q = query(collection(db, 'bundles'), where('ownerUid', '==', user.uid));
      const snapshot = await getDocs(q);
      const bundlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
      setBundles(bundlesData);
    } catch (error) {
      console.error("Error creating bundle:", error);
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      await deleteDoc(doc(db, 'bundles', bundleId));
      setBundles(prev => prev.filter(b => b.id !== bundleId));
    } catch (error) {
      console.error("Error deleting bundle:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Your Bundles</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newBundleName}
          onChange={(e) => setNewBundleName(e.target.value)}
          placeholder="New Bundle Name"
          className="border p-2 rounded flex-grow"
        />
        <button onClick={handleCreateBundle} className="bg-black text-white p-2 rounded">
          Create
        </button>
      </div>
      {activeBundleId && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-800 rounded">
          Bundle active: {bundles.find(b => b.id === activeBundleId)?.name}
          <button onClick={() => setActiveBundleId(null)} className="ml-2 font-bold underline">Send Bundle</button>
        </div>
      )}
      <div>
        {bundles.length > 0 ? (
          bundles.map(bundle => (
            <div key={bundle.id} className="border-b py-2 flex justify-between items-center">
              <div>
                <div className="font-semibold">{bundle.name}</div>
                <div className="text-sm opacity-70">{bundle.clipIds.length} clips</div>
                <div className="text-xs text-blue-600 mt-1 break-all">
                  Share: {window.location.origin}/bundle/{bundle.id}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteBundle(bundle.id)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-50">No bundles created yet.</p>
        )}
      </div>
    </div>
  );
};
