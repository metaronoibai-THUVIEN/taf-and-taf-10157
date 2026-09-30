import React from 'react';
import { Shield, Info } from 'lucide-react';

export default function CriteriaPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-full overflow-y-auto hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">📋 TIÊU CHÍ ĐÁNH GIÁ (ICAO)</h2>
      </div>

      <div className="space-y-5 text-xs text-slate-600 leading-relaxed font-sans">
        <div>
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            A. GIÓ (DD - FF)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li><strong>Hướng (DD)</strong>: Sai lệch ≤ 20° (🟢). Sai lệch 21°-59° (🟡). Sai lệch ≥ 60° (🔴 - khi tốc độ ≥ 10 kt).</li>
            <li><strong>Đặc biệt</strong>: Không kiểm tra hướng (mặc định 🟢) nếu tốc độ dự báo và thực tế đều ≤ 7 kt, hoặc dự báo VRB với tốc độ ≤ 6 kt.</li>
            <li><strong>Tốc độ (FF)</strong>: Sai lệch ≤ 5 kt (🟢), 6-9 kt (🟡), ≥ 10 kt (🔴) cho tốc độ ≤ 25 kt. Với tốc độ &gt; 25 kt, sai lệch cho phép là ±20% (🟢).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            B. TẦM NHÌN (VV)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li><strong>Sai lệch cho phép</strong>: ≤ 200m (khi tầm nhìn ≤ 800m) hoặc ≤ 30% (khi tầm nhìn 800m - 10km) (🟢).</li>
            <li><strong>Vượt mốc đột biến</strong>: 150, 350, 600, 800, 1500, 3000, 5000, 10000m không có BECMG/TEMPO tương ứng (🔴).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            C. MÂY (CC - HH)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li><strong>Lượng mây (CC)</strong>: Đúng hạng mục (🟢). FEW ↔ SCT, BKN ↔ OVC (🟡). Thay đổi giữa các nhóm FEW/SCT ↔ BKN/OVC (🔴).</li>
            <li><strong>Đặc biệt</strong>: CAVOK/NSC tương đương FEW.</li>
            <li><strong>Độ cao mây (HH)</strong>: Sai lệch ≤ 100ft (khi ≤ 1000ft) hoặc ≤ 30% (khi 1000ft - 10000ft) (🟢).</li>
            <li><strong>Mốc đột biến</strong>: 100, 200, 500, 1000, 1500ft không có BECMG/TEMPO tương ứng (🔴). METAR ghi /// coi như đạt.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            D. THỜI TIẾT (WW)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li><strong>Mưa & Giông</strong>: Xuất hiện hoặc mất đi của mưa (RA/SHRA/TSRA/DZ) hay giông (TS/VCTS/CB) phải trùng khớp giữa TAF và thực tế (🟢). Sai lệch sự có/không là 🔴.</li>
            <li>Không phân biệt cường độ (ví dụ -RA, RA, +RA đều tính là "có mưa").</li>
          </ul>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 mt-4 text-[11px] leading-relaxed">
          <div className="flex gap-2.5 items-start text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-indigo-950 mb-1">CÁCH XẾP HẠNG CHẤT LƯỢNG TAF:</p>
              <p>• <strong>0.90 - 1.00</strong>: Xuất sắc (🟢)</p>
              <p>• <strong>0.70 - 0.89</strong>: Tốt (🟢)</p>
              <p>• <strong>0.50 - 0.69</strong>: Trung bình (🟡)</p>
              <p>• <strong>0.30 - 0.49</strong>: Kém (🟠)</p>
              <p>• <strong>0.00 - 0.29</strong>: Rất kém (🔴)</p>
              <p className="mt-2.5 font-bold text-indigo-950 uppercase text-[10px] tracking-wider">ĐẠT/KHÔNG ĐẠT:</p>
              <p>• Đạt nếu điểm trung bình ngày &gt; 84% và không có lỗi 🔴 nghiêm trọng (vi phạm quy trình).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
