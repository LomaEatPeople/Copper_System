"use client";

import { useEffect, useState, useMemo } from "react";
import transactionService from "@/services/transactionService";
import { useRouter } from "next/navigation";

type Transaction = {
  transaction_id: number;
  transaction_date: string;
  transaction_type: string;
  total_cost: number;
  status: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions();
      // ป้องกัน Error กรณี response.data ไม่มีค่า
      const data = response.data || response;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // กรองข้อมูลและเรียงลำดับ (ล่าสุดขึ้นก่อน)
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const date = new Date(t.transaction_date);
        const monthMatch = monthFilter === "all" || date.getMonth() + 1 === Number(monthFilter);
        const dayMatch = dayFilter === "all" || date.getDate() === Number(dayFilter);
        const searchMatch = search === "" || t.transaction_id.toString().includes(search);
        return monthMatch && dayMatch && searchMatch;
      })
      .sort((a, b) => b.transaction_id - a.transaction_id);
  }, [transactions, monthFilter, dayFilter, search]);

  const handleNewBill = async () => {
    try {
      // ใช้ user_id 0 ตามที่คุณกำหนดไว้
      const response = await transactionService.createTransaction(0);
      const newId = response.data.transaction_id;
      // ไปยังหน้าจัดการบิล (ตรวจสอบว่าชื่อโฟลเดอร์คือ [id] แล้ว)
      router.push(`/transactions/${newId}`);
    } catch (error) {
      alert("ไม่สามารถสร้างบิลใหม่ได้");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700 border border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#dce8d8] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Transactions Management</h2>
          <button
            onClick={handleNewBill}
            className="bg-green-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-green-700 shadow-lg transition-all active:scale-95"
          >
            + New Bill
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <select 
            className="border-none rounded-xl px-4 py-2.5 bg-white shadow-sm outline-none focus:ring-2 focus:ring-green-500"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">ทุกเดือน</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select 
            className="border-none rounded-xl px-4 py-2.5 bg-white shadow-sm outline-none focus:ring-2 focus:ring-green-500"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="all">ทุกวันที่</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none rounded-xl px-4 py-2.5 flex-1 shadow-sm outline-none focus:ring-2 focus:ring-green-900 bg-white"
          />
        </div>

        <div className="bg-white rounded-3xl border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-5">ID</th>
                  <th className="p-5">Time & Date</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Total</th>
                  <th className="p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center p-20 text-gray-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-20 text-gray-400 font-medium italic">ไม่พบข้อมูลรายการ</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.transaction_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5 font-black text-blue-600">{t.transaction_id}</td>
                      <td className="p-5">
                        <div className="text-lg font-bold text-gray-900 leading-none mb-1">
                          {new Date(t.transaction_date.replace(" ", "T") + "Z").toLocaleTimeString("th-TH", { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            timeZone: 'Asia/Bangkok' 
                          })} น.
                        </div>
                        {/* วันที่ปรับให้เล็กลงมาหน่อยเพื่อเป็นตัวรอง */}
                        <div className="text-xs font-mono text-gray-700 uppercase">
                          {new Date(t.transaction_date.replace(" ", "T") + "Z").toLocaleDateString("th-TH", { 
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            timeZone: 'Asia/Bangkok' 
                          })}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="capitalize py-1 px-3 bg-gray-100 rounded-md text-xs font-bold text-gray-600">{t.transaction_type}</span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-gray-900 text-lg">฿{t.total_cost.toLocaleString()}</td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => router.push(`/transactions/${t.transaction_id}`)}
                          className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 shadow-md transition-all active:scale-95"
                        >
                          Open Bill
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
    </div>
  );
}