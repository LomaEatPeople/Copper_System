# PARINYA — Scrap Shop Management System
ระบบจัดการร้านรับซื้อของเก่า (ทองแดง / อะลูมิเนียม / เหล็ก ฯลฯ)

**Stack:** FastAPI + SQLite (backend) · Next.js 16 + Tailwind (frontend)  
**No authentication required** — designed for single-location shop use on a local network.

---

## Features

| Feature | Description |
|---|---|
| **บิลซื้อ (BUY)** | รับซื้อของเก่าจากลูกค้า — เพิ่มรายการสินค้า, น้ำหนัก, ราคา/กก., แนบรูปถ่ายสินค้า |
| **บิลขาย (SELL)** | บันทึกการขายของให้พ่อค้าคนกลาง/โรงงาน |
| **Dashboard** | ยอดซื้อ / ยอดขาย / กำไร รายวัน-รายเดือน พร้อมเปรียบเทียบกับวันก่อน |
| **สต็อก** | ติดตามน้ำหนักสินค้าคงเหลือแต่ละประเภท |
| **จัดการสินค้า** | เพิ่ม/แก้ไขประเภทและรายการสินค้า |
| **Tablet Mode** | UI ปรับอัตโนมัติสำหรับหน้าเคาน์เตอร์ (หน้าจอ ≤ 1024px) |
| **พิมพ์ใบเสร็จ** | พิมพ์ receipt โดยตรงจากระบบ |

---

## Requirements

| | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Setup (ติดตั้งครั้งแรก)

### 1. Clone / Copy โปรเจกต์

```bash
git clone <repo-url>
cd Copper_System
```

### 2. Backend Setup

```bash
cd backend

# สร้าง virtual environment
python3 -m venv venv

# เปิดใช้งาน venv
source venv/bin/activate          # Linux / macOS
# venv\Scripts\activate           # Windows

# ติดตั้ง dependencies
pip install -r requirements.txt

# สร้างฐานข้อมูล (ครั้งแรกเท่านั้น)
python init_db.py
```

### 3. Frontend Setup

```bash
cd ../frontend

# คัดลอก env file
cp .env.example .env.local

# แก้ไข .env.local ถ้า backend อยู่คนละเครื่อง
# NEXT_PUBLIC_API_URL=http://192.168.x.x:8000

# ติดตั้ง dependencies
npm install

# Build สำหรับ production
npm run build
```

---

## Run (รันระบบ)

### วิธีง่าย — รันด้วย script เดียว

```bash
# Production
./start.sh

# Development (hot reload)
./start-dev.sh
```

### วิธี Manual

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run start      # production
# npm run dev      # development
```

เปิดเบราว์เซอร์: **http://localhost:3000**

---

## ใช้งานบนเครือข่าย LAN (หลายอุปกรณ์)

ถ้าต้องการให้แท็บเล็ตที่เคาน์เตอร์เชื่อมต่อมาที่คอมพิวเตอร์หลัก:

1. หา IP ของเครื่อง server: `ip addr show` หรือ `hostname -I`
2. แก้ `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://192.168.x.x:8000
   ```
3. Build frontend ใหม่: `npm run build && npm run start`
4. เปิดแท็บเล็ต: `http://192.168.x.x:3000`

> Backend ใช้ `--host 0.0.0.0` อยู่แล้ว รับ connection จาก LAN ได้ทันที

---

## Use Cases — ร้านรับซื้อของเก่า

### หน้าเคาน์เตอร์ (แท็บเล็ต/จอเล็ก)
1. กด **"สร้างบิลซื้อของ"**
2. เพิ่มรายการสินค้า (ทองแดง / อะลูมิเนียม / ฯลฯ) พร้อมน้ำหนัก
3. ถ่ายรูปสินค้า (บังคับสำหรับหมวดหมู่ที่ตั้งค่าไว้)
4. ใส่ราคา/กก.
5. กด **"ยืนยันบิล"** → ระบบคำนวณยอดรวมอัตโนมัติ
6. พิมพ์ใบเสร็จ

### เจ้าของร้าน (Desktop)
- ดู Dashboard ยอดซื้อ-ขาย-กำไรรายวัน / รายเดือน
- บันทึกบิลขาย (SELL) เมื่อขายของให้โรงงาน
- จัดการประเภทสินค้าและราคา
- ตรวจสอบสต็อกคงเหลือ

---

## File Structure

```
Copper_System/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── init_db.py           # สร้าง DB (รันครั้งแรก)
│   ├── requirements.txt     # Python dependencies
│   ├── parinya.db           # SQLite database (auto-created)
│   ├── uploads/             # รูปภาพสินค้าที่อัปโหลด
│   ├── routers/             # API endpoints
│   ├── services/            # Business logic
│   └── schemas/             # Pydantic models
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # UI components
│   ├── services/            # API calls
│   ├── api/apiClient.ts     # Axios instance
│   ├── .env.example         # ตัวอย่าง env file
│   └── public/              # Static assets
├── start.sh                 # Production startup
├── start-dev.sh             # Dev startup
└── README.md
```

---

## Backup ฐานข้อมูล

```bash
# สำรองข้อมูล
cp backend/parinya.db backup/parinya_$(date +%Y%m%d).db

# กู้คืนข้อมูล
cp backup/parinya_YYYYMMDD.db backend/parinya.db
```

> ย้ายร้าน / เปลี่ยนเครื่อง: copy ไฟล์ `parinya.db` และโฟลเดอร์ `uploads/` ไปด้วย

---

## Troubleshooting

**Frontend ติดต่อ backend ไม่ได้**
- ตรวจ `NEXT_PUBLIC_API_URL` ใน `.env.local` ถูกต้องหรือไม่
- ตรวจ backend รันอยู่: `curl http://localhost:8000/`

**หน้าจอขาว / error**
- `cd frontend && npm run build` ดูว่า build error อะไร

**รูปภาพไม่แสดง**
- ตรวจว่าโฟลเดอร์ `backend/uploads/` มีอยู่และมีไฟล์
- Backend ต้องรันจาก directory `backend/` เท่านั้น
