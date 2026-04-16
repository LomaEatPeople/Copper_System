"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { billService } from "@/services/billService";
import { itemService } from "@/services/itemService";
import { useReactToPrint } from "react-to-print";
import { ReceiptTicket } from "@/components/Reciept";

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
  
  // 🟢 เพิ่ม Ref แค่จุดเดียว
  const componentRef = useRef<HTMLDivElement>(null);

  // 🔵 Tablet Specific States
  const [isTabletMode, setIsTabletMode] = useState(false);
  const [tempItems, setTempItems] = useState<any[]>([]);
  const [submittingTablet, setSubmittingTablet] = useState(false);

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
    const checkSize = () => setIsTabletMode(window.innerWidth <= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [fetchData, fetchImages]);

  // 🟢 เพิ่มฟังก์ชัน Print ตรงๆ ตามคู่มือ Library
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Bill-${transactionId}`,
  });

  const handleAddItem = async () => {
    if (!selectedItemId || !weight) return alert("กรุณาเลือกสินค้าและระบุน้ำหนัก");
    
    if (isTabletMode) {
      const masterItem = storeItems.find(i => i.item_id === Number(selectedItemId));
      const newItem = {
        item_id: Number(selectedItemId),
        item_name: masterItem?.item_name || "Unknown",
        weight: Number(weight)
      };
      setTempItems([...tempItems, newItem]);
      setSelectedItemId("");
      setWeight("");
      showToast("พักรายการไว้แล้ว", "success");
    } else {
      try {
        await billService.addItemToTransaction(transactionId, Number(selectedItemId), Number(weight));
        setSelectedItemId("");
        setWeight("");
        fetchData(); 
      } catch (error) {
        alert("เพิ่มสินค้าไม่สำเร็จ");
      }
    }
  };

  const handleTabletSubmit = async () => {
    if (tempItems.length === 0) return;
    try {
      setSubmittingTablet(true);
      for (const item of tempItems) {
        await billService.addItemToTransaction(transactionId, item.item_id, item.weight);
      }
      setTempItems([]);
      showToast("บันทึกลงระบบสำเร็จ!", "success");
      fetchData();
    } catch (error) {
      alert("การส่งข้อมูลขัดข้อง!");
    } finally {
      setSubmittingTablet(false);
    }
  };

  const handleUpdatePrice = async (itemId: number, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;
    try {
      await billService.updateItemPrice(transactionId, itemId, price);
      fetchData(); 
    } catch (error) { alert("ไม่สามารถอัปเดตราคาได้"); }
  };

  const handleConfirm = async () => {
    try {
      await billService.confirmTransaction(transactionId);
      showToast("ยืนยันบิลสำเร็จ!", "success");
      fetchData(); 
    } catch (error) { alert("ยืนยันบิลไม่ได้จ้า"); }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      setDeletingImageId(imageId);
      await billService.deleteTransactionImage(transactionId, imageId);
      fetchImages();
    } catch (error: any) { alert("ลบไม่ได้จ้า!"); } finally { setDeletingImageId(null); }
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
    } catch (error) { showToast("อัปโหลดรูปไม่สำเร็จ", "error"); } finally { setUploading(false); }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await billService.deleteTransactionItem(transactionId, itemId);
      showToast("ลบเรียบร้อย", "success");
      fetchData();
    } catch (err: any) { showToast("ลบไม่ได้จ้า", "error"); }
  };

  const isImageRequired = billItems.some((item) => {
    const masterItem = storeItems.find((i: any) => i.item_id === item.item_id);
    return masterItem && masterItem.require_image === 1; 
  });

  const isLocked = isImageRequired && images.length === 0;

  if (loading && !bill) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse font-black text-slate-300 tracking-[0.3em] uppercase text-xs">Loading...</div>
    </div>
  );

  if (!bill) return <div className="p-20 text-center font-bold text-slate-300">ไม่พบข้อมูลบิล</div>;

  const isSell = bill.transaction_type?.toUpperCase() === 'SELL';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-800 font-sans">
      
      {/* 🟢 ส่วนที่ซ่อนไว้สำหรับ Print (ห้ามลบ) */}
      <div className="hidden">
        <ReceiptTicket 
          ref={componentRef} 
          bill={bill} 
          billItems={billItems} 
          storeItems={storeItems} 
        />
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push('/transactions')} className="font-black text-[10px] uppercase tracking-widest text-slate-400">← กลับไปรายการบิล</button>
          
          {/* 🟢 เพิ่มปุ่ม Print ไว้ข้างๆ สถานะบิล */}
          <div className="flex items-center gap-3">
            {bill.status === "confirmed" && (
              <button 
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all"
              >
                🖨️ พิมพ์บิล
              </button>
            )}
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              bill.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {bill.status === 'confirmed' ? 'ยืนยันบิลแล้ว' : 'ฉบับร่าง'}
            </div>
          </div>
        </div>

        {/* ... ส่วนที่เหลือคงเดิมตามโค้ดของคุณหลานทุกประการ ... */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm mb-6 border border-slate-200 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${isSell ? 'bg-blue-500' : 'bg-orange-500'}`} />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-950 italic">บิลที่ {transactionId}</h1>
              <p className="text-slate-400 font-bold text-xs mt-1">🗓️ {new Date(bill.transaction_date).toLocaleString("th-TH")}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-1">ยอดรวม</p>
                <div className="text-4xl font-black text-slate-950 tracking-tighter italic">
                    <span className="text-lg text-slate-300 mr-1 not-italic">฿</span>
                    {bill.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
          </div>
        </div>

        {/* 🟡 1. รวมร่าง Input และ Queue (ลบความรก) */}
        {bill.status === "draft" && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-950 overflow-hidden mb-8">
            {/* Input Area */}
            <div className="bg-slate-950 p-4 md:p-6 flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <select 
                  className="w-full bg-slate-800 text-white border-none rounded-2xl px-6 py-4 outline-none font-bold text-lg"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="">เลือกสินค้า...</option>
                  {storeItems.map((item: any) => (
                    <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-36">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full bg-slate-800 text-white border-none p-4 rounded-2xl outline-none font-black text-center text-xl"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddItem} 
                className={`px-10 py-4 rounded-2xl font-black text-white transition-all active:scale-95 uppercase tracking-widest ${
                  isSell ? 'bg-blue-600' : 'bg-orange-500'
                }`}
              >
                + พักไว้
              </button>
            </div>

            {/* Queue List (เฉพาะตอนมีของ) */}
            {tempItems.length > 0 ? (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายการที่รอการบันทึก ({tempItems.length})</span>
                </div>
                <div className="space-y-2 mb-6">
                  {tempItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                      <span className="text-slate-900 font-black uppercase italic">{item.item_name}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-orange-500 font-black text-2xl italic">{item.weight} <small className="text-xs text-slate-300 not-italic">KG</small></span>
                        <button onClick={() => setTempItems(tempItems.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 font-bold px-2">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleTabletSubmit}
                  disabled={submittingTablet}
                  className="w-full py-6 bg-emerald-500 text-white rounded-3xl font-black text-2xl shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                >
                  {submittingTablet ? "กำลังบันทึก..." : "ยืนยันลงระบบทั้งชุด"}
                </button>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-300 font-bold italic bg-slate-50/50">
                เพิ่มสินค้าเพื่อพักรายการไว้ที่นี่...
              </div>
            )}
          </div>
        )}

        {/* 🔵 2. ตารางหลัก (แสดงเมื่อมีของใน DB เท่านั้น) */}
        {billItems.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200 mb-8 animate-in fade-in duration-500">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">สินค้า</th>
                  <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">น้ำหนัก</th>
                  <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">ราคา</th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">รวม</th>
                  {bill.status === "draft" && <th className="p-6"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {billItems.map((item: any) => {
                  const master = storeItems.find((i: any) => i.item_id === item.item_id);
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/30">
                      <td className="p-6 font-black text-slate-900 text-lg uppercase italic">{master?.item_name || item.item_name}</td>
                      <td className="p-6 text-center font-black text-xl italic">{item.weight}</td>
                      <td className="p-6 text-center">
                        <input
                          type="number"
                          disabled={bill.status !== "draft"}
                          defaultValue={item.price_per_kg || ""}
                          className="w-16 text-center bg-slate-50 rounded-lg py-1 font-black text-slate-900 outline-none focus:ring-1 focus:ring-blue-400"
                          onBlur={(e) => handleUpdatePrice(item.item_id, e.target.value)}
                        />
                      </td>
                      <td className="p-6 text-right font-black text-xl italic tracking-tighter">
                        {(item.weight * (item.price_per_kg || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {bill.status === "draft" && (
                        <td className="p-6 text-center">
                          <button onClick={() => handleDeleteItem(item.item_id)} className="text-red-200 hover:text-red-500 font-bold">✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 📸 Photos & Final Confirm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="md:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">รูปถ่ายสินค้า ({images.length})</p>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.image_id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                  <img src={`${billService.getAPIclient().defaults.baseURL}${img.image_url}`} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeleteImage(img.image_id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}

              {bill.status === "draft" && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all active:scale-95">
                  <span className="text-3xl text-slate-300">+</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    {isTabletMode ? "ถ่ายรูป / คลัง" : "เพิ่มรูป"}
                  </span>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUploadImage}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between border border-slate-800">
            <div>
              <p className="text-slate-500 font-black uppercase text-[10px] mb-1">ยอดสุทธิ</p>
              <div className="text-4xl font-black text-white italic tracking-tighter mb-8">
                ฿{bill.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {bill.status === "draft" && billItems.length > 0 ? (
              <button 
                onClick={handleConfirm}
                disabled={isLocked}
                className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isLocked ? "bg-slate-800 text-slate-600" : "bg-emerald-500 text-white shadow-xl shadow-emerald-900/40"
                }`}
              >
                {isLocked ? "กรุณาถ่ายรูปก่อน" : "ยืนยันทำรายการ"}
              </button>
            ) : (
              <div className="text-[10px] font-black text-slate-600 text-center py-4 rounded-2xl border border-slate-800 italic">
                {bill.status === "confirmed" ? "บิลสมบูรณ์แล้ว" : "รอการเพิ่มสินค้า"}
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