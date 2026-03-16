"use client";

import { useEffect, useState } from "react";
import { itemService } from "@/services/itemService";
// 🟢 นำเข้าคอมโพเนนต์ที่คุณน้องมีอยู่แล้ว
import DisplayNumber from "@/components/DisplayNumber";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    if (!newItemName || !newCatId) return alert("กรอกข้อมูลให้ครบก่อนค่ะคุณน้อง!");
    try {
      await itemService.createItem(newItemName, Number(newCatId));
      setNewItemName("");
      setNewCatId("");
      setIsModalOpen(false);
      await fetchItems();
    } catch (err) {
      alert("เพิ่มไม่สำเร็จ ลองเช็ค ID หมวดหมู่อีกทีนะจ๊ะ");
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
    <div className="min-h-screen bg-[#dce8d8] p-4 md:p-10 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Store Items</h2>
            {/* 🟢 ใช้ DisplayNumber โชว์จำนวนรวม */}
            <div className="text-gray-500 font-bold text-xs mt-1 flex items-center gap-1">
              TOTAL: <DisplayNumber index={items.length - 1} /> ITEMS
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-600 shadow-xl transition-all active:scale-95"
          >
            + ADD NEW ITEM
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                <th className="p-8 w-24 text-center">No.</th>
                <th className="p-8">Item Name</th>
                <th className="p-8">Category</th>
                <th className="p-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item: any, index: number) => (
                <tr key={item[0]} className="hover:bg-gray-50/50 transition-colors">
                  {/* 🟢 เรียกใช้คอมโพเนนต์ DisplayNumber ตรงนี้เลยจ้า! */}
                  <td className="p-8 font-black text-blue-500 text-2xl text-center">
                    <DisplayNumber index={index} />
                  </td>
                  
                  <td className="p-8 font-black text-gray-900 text-xl uppercase">{item[1]}</td>
                  <td className="p-8">
                    <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-xl font-black text-[15px] uppercase shadow-sm">
                      {item[2]}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    <button 
                      onClick={() => handleDeleteItems(item[0])} 
                      className="text-red-300 hover:text-red-500 font-black text-xs transition-colors uppercase"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL คงเดิมจ้า */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-3xl font-black mb-8 tracking-tighter">ADD NEW</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">ชื่อสินค้า</label>
                <input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="เช่น เหล็กหนา..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">ID หมวดหมู่ (เลข)</label>
                <input 
                  type="number"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="ระบุตัวเลข ID" 
                />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-gray-400">CANCEL</button>
              <button 
                onClick={handleSaveItem}
                className="flex-[2] bg-gray-900 text-white py-4 rounded-3xl font-black shadow-xl hover:bg-blue-600 transition-all"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}