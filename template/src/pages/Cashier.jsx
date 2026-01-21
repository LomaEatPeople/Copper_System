import { useState } from "react";

export default function Cashier() {
  const [billNo, setBillNo] = useState("");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>ช่องรับเงิน</h2>

      <input
        placeholder="กรอกเลขบิล"
        value={billNo}
        onChange={(e) => setBillNo(e.target.value)}
      />

      <div style={{ marginTop: "1rem" }}>
        <button>ค้นหาบิล</button>
        <button style={{ marginLeft: "1rem" }}>
          รับเงิน
        </button>
      </div>
    </div>
  );
}