import React from "react";

export const ReceiptTicket = React.forwardRef(({ bill, billItems, storeItems }: any, ref: any) => {
  return (
    <div ref={ref} className="p-8 text-black bg-white w-[80mm] font-mono text-sm">
      {/* ส่วนหัวใบเสร็จ */}
      <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
        <h2 className="text-lg font-bold uppercase">ปริญญาค้าเหล็กและขยะรีไซเคิล</h2>
        <p className="text-xs">ใบรับซื้อ/ขายสินค้า</p>
        <p className="text-xs">วันที่: {new Date(bill.transaction_date).toLocaleString("th-TH")}</p>
        <p className="text-xs font-bold">เลขที่บิล: #{bill.transaction_id}</p>
      </div>

      {/* รายการสินค้า */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">รายการ</th>
            <th className="py-1 text-right">กก.</th>
            <th className="py-1 text-right">รวม</th>
          </tr>
        </thead>
        <tbody>
          {billItems.map((item: any, idx: number) => {
            const master = storeItems.find((i: any) => i.item_id === item.item_id);
            return (
              <tr key={idx} className="border-b border-dashed border-gray-200">
                <td className="py-1">{master?.item_name || item.item_name}</td>
                <td className="py-1 text-right">{item.weight}</td>
                <td className="py-1 text-right">{(item.weight * item.price_per_kg).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ยอดรวมสุทธิ */}
      <div className="border-t border-black pt-2 text-right">
        <p className="text-lg font-bold">ยอดรวม: ฿{bill.total_cost.toLocaleString()}</p>
      </div>

      <div className="text-center mt-6 text-[10px]">
        <p>*** ขอบคุณที่ใช้บริการ ***</p>
      </div>
    </div>
  );
});

ReceiptTicket.displayName = "ReceiptTicket";