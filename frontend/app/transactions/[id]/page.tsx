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
    setTimeout(() => setToast(null), 10000);
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
      // เพิ่มสินค้า (ราคาจะยังเป็น NULL หรือ 0 ตาม Backend จนกว่าจะไปกรอกในตาราง)
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
  // ถ้าเป็นค่าว่าง หรือไม่ใช่ตัวเลข ไม่ต้องส่ง
  if (isNaN(price)) return;

  try {
    // ยิง PATCH ไปที่ /transaction-items/price
    await billService.updateItemPrice(transactionId, itemId, price);
    
    // สำคัญมาก: ต้องดึงข้อมูลใหม่เพื่อให้อัปเดต Total Cost ในหน้าจอ
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
    console.log("กำลังจะลบรูป ID:", imageId, "ของบิลเลขที่:", transactionId);
    try {
      const res = await billService.deleteTransactionImage(transactionId, imageId);
      console.log("Backend ตอบกลับมาว่า:", res.data);
      fetchImages(); // ดึงใหม่
    } catch (error: any) {
      console.error("Error ตอนลบ:", error.response?.data || error.message);
      alert("ลบไม่ได้จ้า! ดูที่ Console นะ");
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
    fetchImages(); // อัปโหลดเสร็จ ดึงรายการรูปใหม่มาโชว์
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
    const masterItem = storeItems.find((i: any) => i[0] === itemInBill.item_id);
    return {
      name: masterItem ? masterItem[1] : (itemInBill.item_name || `สินค้า #${itemInBill.item_id}`)
    };
  };

  if (loading && !bill) return <div className="p-20 text-center font-bold">กำลังโหลด...</div>;
  if (!bill) return <div className="p-20 text-center">ไม่พบข้อมูลบิล #{transactionId}</div>;

  return (
    <div className="min-h-screen bg-[#dce8d8] p-4 md:p-10 text-gray-800 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm mb-6 flex justify-between items-center">
          <div>
            <button onClick={() => router.push('/transactions')} className="text-blue-600 font-bold mb-2 block hover:underline">← กลับหน้ารวม</button>
            <h1 className="text-4xl font-black tracking-tight">Billz</h1>
            <p className="text-gray-400 font-medium text-2xl">{new Date(bill.transaction_date).toLocaleString("th-TH")}</p>
          </div>
          <div className={`px-6 py-2 rounded-full font-black uppercase shadow-sm ${bill.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {bill.status}
          </div>
        </div>
        {bill.status === "draft" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">รายการสินค้า</label>
              <select 
                className="w-full border-none bg-gray-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">เลือกสินค้า...</option>
                {storeItems.map((item: any) => (
                  <option key={item[0]} value={item[0]}>{item[1]}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">น้ำหนัก (กก.)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full border-none bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-center"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAddItem} 
              className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all active:scale-95 h-[60px]"
            >
              ADD
            </button>
          </div>
        )}

        {/* ตารางรายการสินค้า */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">รายการ</th>
                <th className="p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">น้ำหนัก</th>
                <th className="p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">ราคา/กก.</th>
                <th className="p-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">รวม</th>
                {bill.status === "draft" && <th className="p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {billItems.map((item: any) => {
                const display = getItemDisplay(item);
                const itemPrice = item.price_per_kg || 0;
                return (
                  <tr key={item.item_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-black text-gray-800 text-lg uppercase">{display.name}</td>
                    <td className="p-6 text-center font-mono text-2xl font-bold text-gray-600">
                      {item.weight} <span className="text-[10px] font-black text-gray-300">KG</span>
                    </td>
                    
                    {/* แก้ไขราคาได้ในตาราง */}
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center bg-gray-50 rounded-xl px-3 py-1 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <span className="text-blue-300 font-black mr-1">฿</span>
                        <input
                          type="number"
                          defaultValue={item.price_per_kg || ""}
                          placeholder="0"
                          className="w-20 text-center bg-transparent outline-none font-black text-blue-600 text-xl"
                          onBlur={(e) => handleUpdatePrice(item.item_id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                    </td>

                    <td className="p-6 text-right font-black text-gray-900 text-2xl">
                      ฿{(item.weight * itemPrice).toLocaleString()}
                    </td>
                    
                    {bill.status === "draft" && (
                      <td className="p-6 text-center">
                        <button onClick={() => handleDeleteItem(item.item_id)} className="text-red-300 hover:text-red-500 transition-colors font-bold text-sm">ลบออก</button>
                      </td>
                    )}
                    <td></td>
                  </tr>
                );
              })}
              {billItems.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-bold italic tracking-widest uppercase">No Items Found</td></tr>
              )}
            </tbody>
          </table>
          
          {/* Footer สรุปยอด */}
          <div className="p-8 bg-gray-50/50 text-right border-t border-gray-100 shadow-[inner_0_2px_4px_rgba(0,0,0,0.02)]">
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">ยอดรวมสุทธิ</p>
            <div className="text-6xl font-black text-gray-900 mb-8 tracking-tighter">
              ฿{bill.total_cost.toLocaleString()}
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm mb-6 border border-white">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic">Evidence Photos</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {isImageRequired ? "⚠️ Required for controlled items" : "Optional for this bill"}
                  </p>
                </div>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-500">
                  {images.length} PHOTOS
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {images.map((img, idx) => (
                  <div key={img.image_id || idx} className="group relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-blue-500 transition-all shadow-sm">
                    <img
                      src={`${billService.getAPIclient().defaults.baseURL}${img.image_url}`}
                      alt="evidence" 
                      className="w-full h-full object-cover" 
                      // กรณีรูปโหลดไม่ขึ้น ให้โชว์สีเทาแทน
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a 
                        href={`${billService.getAPIclient().defaults.baseURL}${img.image_url}`} 
                        target="_blank" 
                        className="text-white text-[10px] font-black uppercase bg-white/20 backdrop-blur-md px-3 py-1 rounded-full"
                      >
                        View Full
                      </a>
                    </div>
                    {bill.status === "draft" && (
                    <button 
                      onClick={() => handleDeleteImage(img.image_id)}
                      disabled={deletingImageId === img.image_id}
                      // 🟢 CSS: สีขุ่นๆ (bg-white/40), ลอยมุมขวาบน (top-2 right-2), โชว์ชัดขึ้นตอน Hover group
                      className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-sm text-gray-500 opacity-80 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all z-10 ${
                        deletingImageId === img.image_id ? "animate-pulse" : ""
                      }`}
                      title="ลบรูปภาพ"
                    >
                      {deletingImageId === img.image_id ? (
                        <span className="text-[9px]">...</span>
                      ) : (
                        <span className="text-xl font-light">×</span> // ใช้เครื่องหมายคูณสวยๆ
                      )}
                    </button>
                    )}
                  </div>
                ))}

                {/* ปุ่มอัปโหลดรูปใหม่ (Input แบบซ่อน) */}
                {bill.status === "draft" && (
                  <label className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isLocked ? "border-red-200 bg-red-50/50 text-red-400 hover:bg-red-50" : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:border-blue-300"
                  }`}>
                    {uploading ? (
                      <div className="animate-spin text-2xl font-black">...</div>
                    ) : (
                      <>
                        <span className="text-3xl mb-1">+</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-center px-2">
                          Add Photo
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} />
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
              {bill.status === "draft" && billItems.length > 0 && (
              <button 
                onClick={handleConfirm}
                disabled={isLocked} // 🟢 ล็อคปุ่มถ้ายังไม่ถ่ายรูป
                className={`px-16 py-5 rounded-3xl text-2xl font-black transition-all shadow-xl ${
                  isLocked 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                    : "bg-green-600 text-white hover:bg-green-700 hover:-translate-y-1 shadow-green-200"
                }`}
              >
                {isLocked ? "PHOTO REQUIRED" : "CONFIRM PAYMENT"}
              </button>
                )}
          </div>
        </div>
      </div>
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] px-8 py-4 rounded-2xl shadow-2xl font-black text-white animate-bounce ${
          toast.type === "error" ? "bg-red-500" : "bg-green-600"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}