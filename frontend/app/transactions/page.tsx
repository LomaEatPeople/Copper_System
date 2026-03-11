"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/services/transactionService";

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

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await getTransactions();
      setTransactions(data);
    };

    fetchTransactions();
  }, []);

  const sortedTransactions = [...transactions].sort(
    (a, b) => b.transaction_id - a.transaction_id
  );

  const statusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredTransactions = sortedTransactions.filter((t) => {

  const date = new Date(t.transaction_date);

  const monthMatch =
    monthFilter === "all" ||
    date.getMonth() + 1 === Number(monthFilter);

  const dayMatch =
    dayFilter === "all" ||
    date.getDate() === Number(dayFilter);

  const searchMatch =
    search === "" ||
    t.transaction_id.toString().includes(search);

  return monthMatch && dayMatch && searchMatch;

});

  return (
    <div className="min-h-screen bg-[#dce8d8] flex">

      {/* Main Content */}
      <div className="flex-1 p-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">

          <h2 className="text-3xl font-semibold text-gray-800">
            Transactions Management
          </h2>

          <button className="bg-green-600 text-white px-5 py-2 rounded-full">
            + New Bill
          </button>

        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 items-center text-gray-700">

          <select className="border rounded-lg px-3 py-2 bg-white"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="all">All Month</option>
              <option value="1">มกราคม</option>
              <option value="2">กุมภาพันธ์</option>
              <option value="3">มีนาคม</option>
              <option value="4">เมษายน</option>
              <option value="5">พฤษภาคม</option>
              <option value="6">มิถุนายน</option>
              <option value="7">กรกฎาคม</option>
              <option value="8">สิงหาคม</option>
              <option value="9">กันยายน</option>
              <option value="10">ตุลาคม</option>
              <option value="11">พฤศจิกายน</option>
              <option value="12">ธันวาคม</option>
          </select>
          <select className="border rounded-lg px-3 py-2 bg-white"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}>
            <option value="all">All Days</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="15">15</option>
              <option value="16">16</option>
              <option value="17">17</option>
              <option value="18">18</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
              <option value="23">23</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="26">26</option>
              <option value="27">27</option>
              <option value="28">28</option>
              <option value="29">29</option>
              <option value="30">30</option>
              <option value="31">31</option>
          </select>

          <input
            type="text"
            placeholder="Search Transactions ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1"
          />

        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 text-gray-600">
              <tr>

                <th className="p-4 text-left">Transaction ID</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Time</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Actions</th>

              </tr>
            </thead>
            <tbody className="text-gray-700">

              {filteredTransactions.length === 0 ? (

              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500">
                  No transactions found
                </td>
              </tr>

              ) : (

              filteredTransactions.map((t) => (

                <tr key={t.transaction_id} className="border-t">

                  <td className="p-4 font-medium">
                    {t.transaction_id}
                  </td>

                  <td className="p-4 text-gray-600">
                    <div>
                      {new Date(t.transaction_date).toLocaleDateString("Th", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric"
                      })}
                    </div>
                  </td>

                  <td className="p-4 text-gray-600">
                    <div className="text-xs">
                      {new Date(t.transaction_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </td>

                  <td className="p-4 capitalize">
                    {t.transaction_type}
                  </td>

                  <td className="p-4">

                    <span className={`px-2 py-1 rounded-full text-xs ${statusStyle(t.status)}`}>

                      {t.status}

                    </span>

                  </td>

                  <td className="p-4 font-medium">
                    ${t.total_cost.toFixed(2)}
                  </td>

                  <td className="p-4 space-x-2">

                    <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition">
                      Edit
                    </button>

                    <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition">
                      Delete
                    </button>

                  </td>

                </tr>
              ))
              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}
        <div className="flex justify-between mt-4 text-sm text-gray-600">

          <div>
            Total Transactions: {transactions.length}
          </div>

          <div className="space-x-2">

            <button className="border px-3 py-1 rounded">
              1
            </button>

            <button className="border px-3 py-1 rounded">
              2
            </button>

            <button className="border px-3 py-1 rounded">
              Next
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}