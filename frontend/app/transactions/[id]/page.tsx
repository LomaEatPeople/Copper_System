"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { billService } from "@/services/billService";
import { itemService } from "@/services/itemService";

export default function BillManagementPage() {
  const { id } = useParams();
  const router = useRouter();
  const transactionId = Number(id);

  const [bill, setBill] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!transactionId) return;
    try {
      setLoading(true);
      const [billRes, billItemsRes, storeItemsRes] = await Promise.all([
        billService.getTransactionById(transactionId),
        billService.getTransactionItems(transactionId),
        itemService.getAllItems()
      ]);
      
      setBill(billRes.data);
      const bItems = billItemsRes.data?.items || billItemsRes.data || [];
      setBillItems(Array.isArray(bItems) ? bItems : []);
      const sItems = storeItemsRes.data || storeItemsRes;
      setStoreItems(Array.isArray(sItems) ? sItems : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  const fetchImages = useCallback(async () => {
    try {
      const res = await billService.getTransactionImages(transactionId);
      setImages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Fetch images failed:", error);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchData();
    fetchImages();
  }, [fetchData, fetchImages]);

  const handleAddItem = async () => {
    if (!selectedItemId || !weight) return alert("กรุณาเลือกสินค้าและระบุน้ำหนัก");
    try {
      await billService.addItemToTransaction(transactionId, Number(selectedItemId), Number(weight));
      setSelectedItemId("");
      setWeight("");
      fetchData(); 
    } catch (error) {
      alert("เพิ่มสินค้าไม่สำเร็จ");
    }
  };

  const handleUpdatePrice = async (itemId: number, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;
    try {
      await billService.updateItemPrice(transactionId, itemId, price);
      fetchData(); 
    } catch (error) {
      console.error("Update price failed:", error);
      alert("ไม่สามารถอัปเดตราคาได้");
    }
  };

  const handleConfirm = async () => {
    try {
      await billService.confirmTransaction(transactionId);
      showToast("ยืนยันบิลสำเร็จ!", "success");
      fetchData(); 
    } catch (error) {
      console.error("Confirm failed:", error);
      alert("ไม่สามารถยืนยันบิลได้");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      setDeletingImageId(imageId);
      await billService.deleteTransactionImage(transactionId, imageId);
      fetchImages();
    } catch (error: any) {
      alert("ลบไม่ได้จ้า!");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      await billService.uploadTransactionImage(transactionId, formData);
      showToast("อัปโหลดรูปสำเร็จ!", "success");
      fetchImages();
    } catch (error) {
      showToast("อัปโหลดรูปไม่สำเร็จ", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await billService.deleteTransactionItem(transactionId, itemId);
      showToast("ลบเรียบร้อยแล้วจ้าาา", "success");
      fetchData();
    } catch (err: any) {
      showToast("Backend บอกว่าลบไม่ได้จ้า!", "error");
    }
  };

  const isImageRequired = billItems.some((item) => {
    const masterItem = storeItems.find((i: any) => i[0] === item.item_id);
    return masterItem && masterItem[4] === 1; 
  });

  const isLocked = isImageRequired && images.length === 0;

  const getItemDisplay = (itemInBill: any) => {
    const masterItem = storeItems.find((i: any) => i.item_id === itemInBill.item_id);
    return {
      name: masterItem ? masterItem.item_name : (itemInBill.item_name || `สินค้า #${itemInBill.item_id}`)
    };
  };

  if (loading && !bill) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse font-black text-slate-300 tracking-[0.3em] uppercase">Loading Billy...</div>
    </div>
  );

  if (!bill) return <div className="p-20 text-center">ไม่พบข้อมูลบิล #{transactionId}</div>;

  const isSell = bill.transaction_type?.toUpperCase() === 'SELL';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* 🟢 Navigation & Status Bar */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => router.push('/transactions')} 
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Back to Transactions
          </button>
          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
            bill.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            Status: {bill.status}
          </div>
        </div>

        {/* 🟢 Bill Header Card */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm mb-8 border border-slate-200 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${isSell ? 'bg-blue-500' : 'bg-orange-500'}`} />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-5xl font-black tracking-tighter text-slate-950">Billy ที่ {transactionId.toString().padStart(4, '0')}</h1>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  isSell ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
                }`}>
                  {isSell ? '📤 SELL BILL' : '📥 BUY BILL'}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                <span>🗓️</span> {new Date(bill.transaction_date).toLocaleString("th-TH", { dateStyle: 'long', timeStyle: 'short' })} น.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Balance</p>
              <div className="text-5xl font-black text-slate-950 tracking-tighter">
                <span className="text-xl mr-1 text-slate-300 italic font-bold text-2xl tracking-normal">฿</span>
                {bill.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 Input Form: Styled as a clean control panel */}
        {bill.status === "draft" && (
          <div className="bg-slate-900 p-2 rounded-[2rem] shadow-2xl mb-8 flex flex-col md:flex-row gap-2 items-center">
            <div className="flex-1 w-full">
              <select 
                className="w-full bg-slate-800 text-white border-none rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all appearance-none cursor-pointer"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">Select Item...</option>
                {storeItems.map((item: any) => (
                  <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48 relative">
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full bg-slate-800 text-white border-none p-4 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500 font-black text-center text-xl"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">KG</span>
            </div>
            <button 
              onClick={handleAddItem} 
              className={`w-full md:w-auto px-12 py-4 rounded-[1.5rem] font-black text-white transition-all active:scale-95 h-full min-h-[60px] uppercase tracking-widest ${
                isSell ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              Add Item
            </button>
          </div>
        )}

        {/* 🟢 Items Table: High-End Look */}
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200 mb-8">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product</th>
                <th className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</th>
                <th className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Price</th>
                <th className="p-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subtotal</th>
                {bill.status === "draft" && <th className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {billItems.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic">No items added yet.</td></tr>
              ) : (
                billItems.map((item: any) => {
                  const display = getItemDisplay(item);
                  const itemPrice = item.price_per_kg || 0;
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-8 font-extrabold text-slate-900 text-xl tracking-tight uppercase">{display.name}</td>
                      <td className="p-8 text-center">
                        <span className="text-2xl font-black text-slate-700">{item.weight.toLocaleString()}</span>
                        <span className="ml-1 text-[10px] font-black text-slate-300 uppercase">kg</span>
                      </td>
                      <td className="p-8 text-center">
                        <div className={`inline-flex items-center rounded-xl px-4 py-2 border transition-all ${
                          bill.status === "draft" ? "bg-slate-50 border-slate-100 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100" : "bg-transparent border-transparent"
                        }`}>
                          <span className="text-slate-300 font-black mr-2 text-xs italic">฿</span>
                          <input
                            type="number"
                            disabled={bill.status !== "draft"}
                            defaultValue={item.price_per_kg || ""}
                            className="w-24 text-center bg-transparent outline-none font-black text-slate-900 text-xl disabled:text-slate-400"
                            onBlur={(e) => handleUpdatePrice(item.item_id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="p-8 text-right font-black text-slate-950 text-2xl tracking-tighter">
                        <span className="text-xs text-slate-300 mr-1 italic">฿</span>
                        {(item.weight * itemPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {bill.status === "draft" && (
                        <td className="p-8 text-center">
                          <button onClick={() => handleDeleteItem(item.item_id)} className="w-10 h-10 flex items-center justify-center rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all font-bold">✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🟢 Evidence & Confirmation Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          {/* Left: Evidence Photos */}
          <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evidence Required</h3>
                <p className="text-lg font-extrabold text-slate-900 tracking-tight">Transaction Photos</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black ${isImageRequired ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                {isImageRequired ? "REQUIRED" : "OPTIONAL"}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.image_id} className="group relative aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100">
                  <img src={`${billService.getAPIclient().defaults.baseURL}${img.image_url}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  {bill.status === "draft" && (
                    <button 
                      onClick={() => handleDeleteImage(img.image_id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-red-500 font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  )}
                </div>
              ))}
              {bill.status === "draft" && (
                <label className={`aspect-square rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 ${isLocked ? "border-rose-200 bg-rose-50/30" : "border-slate-200"}`}>
                  <span className="text-3xl text-slate-300 font-light">+</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase mt-1">Upload</span>
                  <input type="file" className="hidden" onChange={handleUploadImage} />
                </label>
              )}
            </div>
          </div>

          {/* Right: Confirmation Box */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between border border-slate-800">
            <div>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-2">Grand Total</p>
              <div className="text-4xl font-black text-white tracking-tighter mb-8 leading-none">
                <span className="text-lg text-slate-600 mr-1 italic">฿</span>
                {bill.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {bill.status === "draft" && billItems.length > 0 ? (
              <button 
                onClick={handleConfirm}
                disabled={isLocked}
                className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                  isLocked 
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700" 
                    : isSell
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40"
                      : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-900/40"
                }`}
              >
                {isLocked ? "Upload Photo First" : "Confirm Bill"}
              </button>
            ) : (
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-800 py-4 rounded-2xl italic">
                {bill.status === "confirmed" ? "✓ Bill Confirmed" : "Add items to confirm"}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] px-10 py-5 rounded-[2rem] shadow-2xl font-black text-white transition-all animate-bounce flex items-center gap-3 ${
          toast.type === "error" ? "bg-rose-500" : "bg-emerald-600"
        }`}>
          <span>{toast.type === "error" ? "❌" : "✅"}</span> {toast.msg}
        </div>
      )}
    </div>
  );
}