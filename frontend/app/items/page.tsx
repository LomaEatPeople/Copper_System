"use client";

import { useEffect, useState } from "react";
import { itemService } from "@/services/itemService";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- States สำหรับการ Add ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newCatId, setNewCatId] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
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
  };

  const handleSaveItem = async () => {
    if (!newItemName || !newCatId) return alert("กรุณากรอกข้อมูลให้ครบค่ะคุณน้อง!");

    try {
      console.log("🚀 Sending Data:", { newItemName, newCatId });
      await itemService.createItem(newItemName, Number(newCatId));
      
      // ล้างค่าและปิด Modal
      setNewItemName("");
      setNewCatId("");
      setIsModalOpen(false);
      
      // รีเฟรชข้อมูล
      await fetchItems();
    } catch (err) {
      console.error("Add error:", err);
      alert("เพิ่มไม่ได้ค่ะ ลองเช็ค Backend ดูนะ");
    }
  };
  const handleDeleteItems = async (id: number) => {
    console.log("🎬 Start Deleting ID:", id); // เช็คว่าฟังก์ชันเริ่มทำงานไหม
    
    try {
        const res = await itemService.deleteItem(id);
        console.log("✅ Delete Success:", res.data);
        await fetchItems(); // รีเฟรชข้อมูล
    } catch (err: any) {
        console.error("❌ Delete Error Detail:", err.response?.data || err.message);
        alert("ลบไม่ได้ค่ะคุณน้อง: " + (err.response?.data?.message || "Error"));
        }
    };

  return (
    <div className="min-h-screen bg-[#dce8d8] p-4 md:p-10 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black tracking-tight">Store Items</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-lg active:scale-95"
          >
            + ADD NEW ITEM
          </button>
        </div>

        {/* ตารางแสดงข้อมูล (เหมือนเดิมที่คุณแก้ไว้) */}
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase border-b">
                <th className="p-6">ID</th>
                <th className="p-6">Item Name</th>
                <th className="p-6">Category</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item[0]} className="hover:bg-blue-50/30 border-b">
                  <td className="p-6 font-black text-blue-600">#{item[0]}</td>
                  <td className="p-6 font-black text-gray-900">{item[1]}</td>
                  <td className="p-6 font-bold text-gray-400">CAT: {item[2]}</td>
                  <td className="p-6 text-center">
                    <button onClick={() => handleDeleteItems(item[0])} className="text-red-500 font-black">DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- คุณพี่แถม: Modal สวยๆ สำหรับ ADD --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-6">เพิ่มสินค้าใหม่</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">ชื่อสินค้า</label>
                <input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="เช่น กล้วยปิ้ง..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">ID หมวดหมู่ (เลข)</label>
                <input 
                  type="number"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="0, 1, 2..." 
                />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-gray-400">ยกเลิก</button>
              <button 
                onClick={handleSaveItem}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                บันทึกสินค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}