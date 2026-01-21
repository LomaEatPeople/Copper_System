import { useState } from "react";

export default function Weigh() {
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState(320);

  const total = weight ? weight * price : 0;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>จุดชั่งทองแดง</h2>

      <label>น้ำหนัก (kg)</label><br />
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />

      <p>ราคา / kg: {price} บาท</p>
      <h3>รวม: {total} บาท</h3>

      <button>ออกบิล</button>
    </div>
  );
}
