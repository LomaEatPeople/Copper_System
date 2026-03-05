import { useEffect, useState } from "react";
import {
  fetchReceiptHistory,
  cancelReceipt
} from "../api/receiptAPI";

export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const data = await fetchReceiptHistory();
    setReceipts(data);
    setLoading(false);
  }

  async function handleCancel(id) {
    if (!confirm("ยืนยันยกเลิกบิลนี้?")) return;
    await cancelReceipt(id);
    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Receipt History</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Weigh</th>
            <th>Total</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {receipts.map(r => (
            <tr key={r.receipt_id}>
              <td>{r.receipt_id}</td>
              <td>{r.weigh_record_id}</td>
              <td>{r.total_price}</td>
              <td>{r.status}</td>
              <td>{r.created_at}</td>
              <td>
                {r.status === "ACTIVE" && (
                  <button onClick={() => handleCancel(r.receipt_id)}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
