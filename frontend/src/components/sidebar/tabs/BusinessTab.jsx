'use client';
import { useState, useEffect } from 'react';
import useBusinessStore from '@/store/businessStore';
import useAuthStore from '@/store/authStore';

export default function BusinessTab() {
  const { user } = useAuthStore();
  const { catalog, isLoading, fetchCatalog, addProduct, deleteProduct, updateBusinessProfile } = useBusinessStore();

  const [isBusiness, setIsBusiness] = useState(user?.isBusiness || false);
  const [businessHours, setBusinessHours] = useState(user?.businessHours || '9:00 AM - 5:00 PM');
  
  // Quick reply arrays
  const [quickReplies, setQuickReplies] = useState(user?.quickReplies || []);
  const [newTrigger, setNewTrigger] = useState('');
  const [newReply, setNewReply] = useState('');

  // Catalog item creation
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchCatalog(user._id);
    }
  }, [user?._id, fetchCatalog]);

  const handleSaveProfile = async () => {
    await updateBusinessProfile({
      isBusiness,
      businessHours,
      quickReplies,
    });
  };

  const handleAddQuickReply = () => {
    if (!newTrigger.trim() || !newReply.trim()) return;
    const updated = [...quickReplies, { trigger: newTrigger.trim(), reply: newReply.trim() }];
    setQuickReplies(updated);
    setNewTrigger('');
    setNewReply('');
  };

  const handleRemoveQuickReply = (idx) => {
    const updated = quickReplies.filter((_, i) => i !== idx);
    setQuickReplies(updated);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('price', prodPrice);
    formData.append('description', prodDesc);
    if (prodImage) {
      formData.append('image', prodImage);
    }

    const res = await addProduct(formData);
    if (res.success) {
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdImage(null);
      setShowCatalogModal(false);
      if (user?._id) fetchCatalog(user._id);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
        {/* Toggle Mode */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Business Platform</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isBusiness}
              onChange={(e) => setIsBusiness(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {isBusiness ? (
          <div className="space-y-6">
            {/* Working Hours */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Working Hours</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM - 5:00 PM"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="flex-1 bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-primary-500/50"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-xl text-xs font-semibold transition"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Quick Replies templates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Quick Replies (type `/` in chat)</label>
                <button
                  onClick={handleSaveProfile}
                  className="text-[10px] text-primary-400 font-semibold hover:text-white"
                >
                  Save Templates
                </button>
              </div>

              {/* Input for quick reply */}
              <div className="p-3 rounded-2xl glass border border-white/5 space-y-2">
                <input
                  type="text"
                  placeholder="Trigger word (e.g. hello)"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-white/5 text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs focus:outline-none"
                />
                <textarea
                  placeholder="Reply text template..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="w-full bg-white/5 text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs focus:outline-none resize-none h-12"
                />
                <button
                  onClick={handleAddQuickReply}
                  className="w-full py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-white rounded-lg text-xs font-bold transition"
                >
                  Add Quick Reply
                </button>
              </div>

              {/* List replies */}
              <div className="space-y-1.5">
                {quickReplies.map((q, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div>
                      <span className="font-bold text-primary-400">/{q.trigger}</span>
                      <p className="text-gray-300 mt-0.5">{q.reply}</p>
                    </div>
                    <button onClick={() => handleRemoveQuickReply(idx)} className="text-red-400 hover:text-red-300 p-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Catalog */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Product Catalog</label>
                <button
                  onClick={() => setShowCatalogModal(true)}
                  className="text-xs text-primary-400 font-semibold flex items-center gap-0.5 hover:text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Product
                </button>
              </div>

              {catalog.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No products added. Build your catalog!</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {catalog.map((prod) => (
                    <div key={prod._id} className="flex gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition relative group">
                      <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex items-center justify-center border border-white/5 flex-shrink-0">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h5 className="text-xs font-bold text-white truncate leading-tight">{prod.name}</h5>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{prod.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary-400">₹{prod.price.toFixed(2)}</span>
                      </div>
                      {/* Delete icon */}
                      <button
                        onClick={() => deleteProduct(prod._id)}
                        className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white opacity-0 group-hover:opacity-100 transition duration-200"
                        title="Delete product"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-xs px-2 space-y-4">
            <svg className="w-12 h-12 text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p>Toggle Business Mode above to configure quick responses, schedule working hours, and share catalog details.</p>
          </div>
        )}
      </div>

      {/* ── CREATE CATALOG PRODUCT MODAL ────────────────────────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form onSubmit={handleAddProduct} className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-white font-bold text-base">Add Product to Catalog</span>
              <button type="button" onClick={() => setShowCatalogModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Product Image</label>
              <input type="file" accept="image/*" onChange={(e) => setProdImage(e.target.files[0])} className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="Premium Widget"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Price (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="299.00"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Product description, features, and details..."
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition resize-none h-20"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCatalogModal(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
