"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { billService } from "@/services/billService";
import { getItems } from "@/services/itemService";

export default function BillManagementPage() {
  const { id } = useParams();
  const router = useRouter();
  const transactionId = Number(id);

  const [bill, setBill] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!transactionId) return;
    try {
      setLoading(true);
      const [billRes, billItemsRes, storeItemsRes] = await Promise.all([
        billService.getTransactionById(transactionId),
        billService.getTransactionItems(transactionId),
        getItems()
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (!confirm("ยืนยันการชำระเงินและปิดบิลนี้?")) return;
    try {
      await billService.confirmTransaction(transactionId);
      fetchData();
    } catch (error) {
      alert("ยืนยันบิลไม่สำเร็จ");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    try {
      await billService.deleteTransactionItem(transactionId, itemId);
      fetchData();
    } catch (error) {
      alert("ลบไม่สำเร็จ");
    }
  };

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
            <h1 className="text-4xl font-black tracking-tight">Bill #{bill.transaction_id}</h1>
            <p className="text-gray-400 font-medium">{new Date(bill.transaction_date).toLocaleString("th-TH")}</p>
          </div>
          <div className={`px-6 py-2 rounded-full font-black uppercase shadow-sm ${bill.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {bill.status}
          </div>
        </div>

        {/* ฟอร์มเพิ่มสินค้า (เน้นแค่เลือกของกับน้ำหนัก) */}
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
            
            {bill.status === "draft" && billItems.length > 0 && (
              <button 
                onClick={handleConfirm}
                className="bg-green-600 text-white px-16 py-5 rounded-3xl text-2xl font-black shadow-xl shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0"
              >
                CONFIRM PAYMENT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}