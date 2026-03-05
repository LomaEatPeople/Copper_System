const BASE_URL = "http://127.0.0.1:8000";

export async function fetchReceiptHistory() {
  const res = await fetch(`${BASE_URL}/receipt/history`);
  return res.json();
}

export async function cancelReceipt(receiptId) {
  const res = await fetch(
    `${BASE_URL}/receipt/${receiptId}/cancel`,
    { method: "POST" }
  );
  return res.json();
}
