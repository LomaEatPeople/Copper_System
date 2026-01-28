# สมมติว่ามีการ import สิ่งที่จำเป็นมาจากแต่ละ service
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.copper_service import add_copper_type, add_copper_price
from services.weigh_service import add_weigh_record
from services.receipt_service import create_receipt, cancel_receipt

# 1. เพิ่มประเภททองแดง
add_copper_type("สายปอก")
add_copper_type("ทองแดงเส้น")

# 2. เพิ่มราคาทองแดง (ระบุวันที่)
# สมมติโครงสร้าง: add_copper_price(type_id, price, date)
add_copper_price(1, 180, "2026-01-01")
add_copper_price(1, 185, "2026-02-01")

# 3. บันทึกการชั่งน้ำหนัก
# ระบุชื่อ parameter ให้ชัดเจนตามที่ฟังก์ชันกำหนดไว้
add_weigh_record(copper_type_id=1, weight_kg=10)

# 4. ออกใบเสร็จ
create_receipt(weigh_record_id=1)

# 5. อัปเดตราคาใหม่ (กรณีไม่ได้ระบุวันที่ ระบบน่าจะใช้ current date)
add_copper_price(1, 200)

# 6. บันทึกการชั่งน้ำหนักเพิ่มอีกรายการ
add_weigh_record(copper_type_id=1, weight_kg=10)

# 7. ยกเลิกใบเสร็จ (Void Receipt)
cancel_receipt(receipt_id=1)