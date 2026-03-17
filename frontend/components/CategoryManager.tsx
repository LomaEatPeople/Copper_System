"use client";

import { useEffect, useState } from "react";
import { categoryService } from "@/services/categoryService";

interface Category {
  category_id: number;
  name: string;
  require_image: number;
}

export default function CategoryManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const fetchCategories = async () => {
    const res = await categoryService.getAll();
    setCategories(res.data || res);
  };

  const handleAdd = async () => {
    if (!newCatName) return;
    await categoryService.create({ name: newCatName, require_image: 0 });
    setNewCatName("");
    fetchCategories();
  };

  const toggleRequireImage = async (cat: Category) => {
    const newStatus = cat.require_image === 1 ? 0 : 1;
    
    await categoryService.update(cat.category_id, { 
      name: cat.name, // 🟢 ส่งชื่อเดิมแนบไปด้วย Backend จะได้ไม่ด่า
      require_image: newStatus 
    });
    
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    console.log("กำลังจะลบ ID:", id);
    try {
      await categoryService.delete(id);
      fetchCategories();
    } catch (err) {
      console.log("Error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black italic">MANAGE CATEGORIES</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black font-bold">CLOSE</button>
        </div>

        {/* ส่วนเพิ่ม Category */}
        <div className="flex gap-2 mb-6">
          <input 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-gray-100 border-none rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ชื่อหมวดหมู่ใหม่..."
          />
          <button onClick={handleAdd} className="bg-blue-600 text-white px-6 rounded-xl font-black shadow-md hover:bg-blue-700">
            ADD
          </button>
        </div>

        {/* ตารางรายการ */}
        <div className="overflow-y-auto flex-1 pr-2">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase border-b">
                <th className="py-3 pl-5">Name</th>
                <th className="py-3 text-center">Require Image</th>
                <th className="py-3 text-right pr-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-gray-50">
                  <td className="py-4 font-black text-gray-800 uppercase pl-4">{cat.name}</td>
                  <td className="py-4 text-center">
                    <button 
                      onClick={() => toggleRequireImage(cat)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                        cat.require_image === 1 
                        ? "bg-red-100 text-red-600 border border-red-200" 
                        : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {cat.require_image === 1 ? "⚠️ REQUIRED" : "NOT REQUIRED"}
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleDelete(cat.category_id)}
                      className="text-red-300 hover:text-red-500 font-bold text-xs pr-4 transition-colors uppercase"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}