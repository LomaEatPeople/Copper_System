"use client";

import { useCallback, useEffect, useState } from "react";
import { itemService } from "@/services/itemService";
import CategoryManager from "@/components/CategoryManager";
import DisplayNumber from "@/components/DisplayNumber";
import { categoryService } from "@/services/categoryService";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [categories, setCategories] = useState<{ category_id: number; category_name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newCatId, setNewCatId] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await itemService.getAllItems();
      const rawData = res.data || res;
      setItems(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      const data = response.data || response;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  const handleSaveItem = async () => {
    if (!newItemName || !newCatId || newCatId === "") {
      return alert("กรุณาเลือกหมวดหมู่ก่อนค่ะคุณพี่!");
    }
    try {
      await itemService.createItem(newItemName, Number(newCatId));
      setNewItemName("");
      setNewCatId("");
      setIsModalOpen(false);
      await fetchItems();
    } catch (err) {
      alert("Backend บอกว่าเพิ่มไม่ได้จ้า ลองเช็คว่าชื่อซ้ำหรือเปล่านะ!");
    }
  };

  const handleDeleteItems = async (id: number) => {
    if (!confirm("จะลบรายการนี้จริงเบ๋อ?")) return;
    try {
        await itemService.deleteItem(id);
        await fetchItems();
    } catch (err: any) {
        alert("ลบไม่ได้จ้า");
    }
  };

  return (
    // 🟢 เปลี่ยนพื้นหลังเป็น Slate 50 ให้เข้าธีม Dashboard
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Master Data Management</h1>
            <h2 className="text-4xl font-extrabold text-slate-950 tracking-tighter">รายการสินค้าในคลัง</h2>
            <div className="text-slate-400 font-bold text-xs mt-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">TOTAL</span>
              <span className="text-slate-900"><DisplayNumber index={items.length} /> ITEMS REGISTERED</span>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="flex-1 md:flex-none bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black hover:bg-slate-50 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              <span>📁</span> Categories
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-[2] md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              <span>+</span> Add New Item
            </button>
          </div>
        </div>

        {/* 🟢 Items Table: Clean Professional Look */}
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="p-8 w-24 text-center">Index</th>
                  <th className="p-8">Item Description</th>
                  <th className="p-8">Category Tag</th>
                  <th className="p-8 text-center">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-32 text-center text-slate-300 font-black animate-pulse tracking-widest">LOADING DATABASE...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="p-32 text-center text-slate-300 font-bold italic">No items found in master record.</td></tr>
                ) : (
                  items.map((item: any, index: number) => (
                    <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-8 text-center">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-blue-600 font-black">
                            <DisplayNumber index={index + 1} />
                          </div>
                        </td>
                      
                        <td className="p-8">
                          <div className="font-black text-slate-900 text-xl tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                            {item.item_name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">UUID: {item.item_id}</div>
                        </td>

                        <td className="p-8">
                          <span className={`px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm border ${
                            item.category_name 
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                              : "bg-slate-50 text-slate-400 border-slate-100 italic"
                          }`}>
                            {item.category_name || 'Uncategorized'}
                          </span>
                        </td>

                        <td className="p-8 text-center">
                          <button 
                            onClick={() => handleDeleteItems(item.item_id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center mx-auto"
                            title="Delete Item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🟢 ADD NEW MODAL: ปรับโฉมให้เหมือนแอปการเงินหรูๆ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white transition-all scale-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black tracking-tighter text-slate-950">Add New Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 text-2xl font-light">✕</button>
            </div>

            <div className="space-y-8">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-blue-600">Product Name</label>
                <input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-200" 
                  placeholder="เช่น เหล็กหนา 2.5mm..." 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Assign Category
                </label>
                <div className="relative">
                  <select 
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>-- Select Category --</option>
                    {categories.map((cat: any) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
                {categories.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-3 ml-1 font-bold italic">
                    * ไม่พบหมวดหมู่สินค้า กรุณาเพิ่มที่หน้าจัดการหมวดหมู่ก่อนนะคะ
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveItem}
                className="flex-[2] bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Register Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เรียกใช้ Component เดิมของคุณหลาน */}
      <CategoryManager 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)} 
      />
    </div>
  );
}