import React, { useState } from 'react';
import { TafEvaluationResult } from '../types';
import { HelpCircle, ToggleLeft, ToggleRight, AlertCircle, FileText } from 'lucide-react';

interface DetailTabProps {
  evaluationResults: TafEvaluationResult[];
}

export default function DetailTab({ evaluationResults }: DetailTabProps) {
  const [selectedTafIndex, setSelectedTafIndex] = useState(0);
  const [isColorMode, setIsColorMode] = useState(true);

  if (evaluationResults.length === 0) {
    return (
      <div className="bg-white border-2 border-[#141414] rounded-none p-12 text-center text-gray-500 font-sans flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <p className="font-semibold text-gray-700 font-mono">Chưa có kết quả đánh giá</p>
        <p className="text-xs text-gray-400 mt-1 font-mono">Hãy tải lên file dữ liệu hoặc chọn bản tin mẫu ở bảng bên trái để xem chi tiết.</p>
      </div>
    );
  }

  const result = evaluationResults[selectedTafIndex];
  const { taf, evaluations, elementAccuracy, overallAccuracy } = result;

  // Render a cell with score styling (completely neutral, no background colors as requested)
  const getCellClassName = () => {
    return "px-2 py-1.5 border-r border-b border-slate-200 text-center font-mono text-xs text-slate-700 bg-white";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* TAF Selector if multiple exist */}
      {evaluationResults.length > 1 && (
        <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-xs font-semibold">
          <span className="text-slate-700">CHỌN BẢN TIN TAF ĐỂ XEM:</span>
          <select
            id="taf-select"
            value={selectedTafIndex}
            onChange={(e) => setSelectedTafIndex(parseInt(e.target.value, 10))}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-2xs"
          >
            {evaluationResults.map((r, idx) => (
              <option key={idx} value={idx}>
                {r.taf.station} - Valid: {String(r.taf.validStartDay).padStart(2, '0')}{String(r.taf.validStartHour).padStart(2, '0')}z to {String(r.taf.validEndDay).padStart(2, '0')}{String(r.taf.validEndHour).padStart(2, '0')}z ({r.taf.raw.slice(0, 30)}...)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5 flex-wrap">
            <span>BẢN TIN TAF: {taf.station} - NGÀY {String(taf.validStartDay).padStart(2, '0')}</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case italic font-mono">(Tham chiếu từ tệp dữ liệu đã nạp)</span>
          </h3>
        </div>
      </div>

      {/* Main Table Matching LongTAF_MAU.docx exactly */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
        <table className="w-full border-collapse bg-white table-fixed" style={{ minWidth: '1000px' }}>
          <colgroup>
            <col style={{ width: '70px' }} /> {/* Element */}
            <col style={{ width: '60px' }} /> {/* Type */}
            {evaluations.map((_, i) => (
              <col key={i} style={{ width: '50px' }} /> /* 12 Hours columns */
            ))}
            <col style={{ width: '55px' }} /> {/* % Column */}
            <col style={{ width: '185px' }} /> {/* Accuracy Summary Column */}
          </colgroup>
          <thead>
            {/* Row 1 Header */}
            <tr className="bg-slate-900 text-white">
              <th colSpan={2} className="px-3 py-2.5 border-b border-r border-slate-800 font-bold text-left text-xs uppercase">
                Time UTC
              </th>
              {evaluations.map((h, i) => (
                <th key={i} className="px-1 py-2.5 border-b border-r border-slate-800 font-mono font-bold text-center text-xs">
                  {h.timeStr}
                </th>
              ))}
              <th className="px-2 py-2.5 border-b border-r border-slate-800 font-bold text-center text-xs">
                %
              </th>
              <th className="px-3 py-2.5 border-b border-slate-800 font-bold text-center text-xs">
                Accuracy
              </th>
            </tr>
            {/* Row 2 Header */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-1.5 border-r border-slate-200 font-bold text-left text-[11px] text-slate-500 uppercase font-sans">
                Element
              </th>
              <th className="px-2 py-1.5 border-r border-slate-200 font-bold text-center text-[11px] text-slate-500 uppercase font-sans">
                Type
              </th>
              {evaluations.map((_, i) => (
                <th key={i} className="px-1 py-1.5 border-r border-slate-200"></th>
              ))}
              <th className="px-1 py-1.5 border-r border-slate-200"></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* Loop through each element and build 2 rows: TAF and METAR */}
            {(['DD', 'FF', 'VV', 'WW', 'CC', 'HH'] as const).map((element, elIdx) => {
              return (
                <React.Fragment key={element}>
                  {/* TAF Row */}
                  <tr className="border-b border-slate-200">
                    {/* Element Column (Spans 2 rows) */}
                    <td rowSpan={2} className="px-3 py-2 border-r border-b border-slate-200 font-bold text-slate-700 text-xs text-center bg-slate-50 font-sans">
                      {element}
                    </td>
                    {/* TAF Label */}
                    <td className="px-2 py-1.5 border-r border-b border-slate-200 text-center font-bold text-[10px] text-slate-450 bg-slate-50/50 font-mono">
                      TAF
                    </td>
                    {/* Hour columns for TAF */}
                    {evaluations.map((h, hIdx) => (
                      <td key={hIdx} className={getCellClassName()}>
                        {h.elements[element].tafVal}
                      </td>
                    ))}
                    {/* % Column (Spans 2 rows) */}
                    <td rowSpan={2} className="px-2 py-2 border-r border-b border-slate-200 font-bold text-center text-xs text-slate-800 bg-slate-50/40 font-mono">
                      {elementAccuracy[element]}
                    </td>
                    {/* Accuracy Column (Spans all 12 body rows - so we only render on the very first element DD) */}
                    {elIdx === 0 && (
                      <td rowSpan={12} className="px-3 py-4 border-l border-slate-200 text-left bg-slate-900 text-slate-200 font-bold" style={{ verticalAlign: 'top' }}>
                        <div className="font-sans text-xs space-y-4">
                          <p className="font-black text-sm border-b border-slate-800 pb-2.5 text-white uppercase tracking-wider font-display">
                            Accuracy = {overallAccuracy} %
                          </p>
                          <div className="pt-1.5 space-y-2 text-slate-400 font-mono">
                            <p className="flex justify-between"><span>DD</span> <span>= {elementAccuracy.DD} %</span></p>
                            <p className="flex justify-between"><span>FF</span> <span>= {elementAccuracy.FF} %</span></p>
                            <p className="flex justify-between"><span>VV</span> <span>= {elementAccuracy.VV} %</span></p>
                            <p className="flex justify-between"><span>WW</span> <span>= {elementAccuracy.WW} %</span></p>
                            <p className="flex justify-between"><span>CC</span> <span>= {elementAccuracy.CC} %</span></p>
                            <p className="flex justify-between"><span>HH</span> <span>= {elementAccuracy.HH} %</span></p>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* METAR Row */}
                  <tr className="border-b border-slate-200">
                    {/* METAR Label */}
                    <td className="px-2 py-1.5 border-r border-b border-slate-200 text-center font-bold text-[10px] text-slate-450 bg-slate-50/50 font-mono">
                      METAR
                    </td>
                    {/* Hour columns for METAR */}
                    {evaluations.map((h, hIdx) => (
                      <td key={hIdx} className="px-2 py-1.5 border-r border-b border-slate-200 text-center font-mono text-xs text-slate-700 bg-white">
                        {h.elements[element].metarVal}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Note and original TAF block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-3xs">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Note: DD-Direction; FF-Speed; VV-Visibility; WW-Weather; CC-Amount; HH-Height
        </p>
        <div className="border-t border-slate-200 pt-3">
          <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase">Bản tin TAF gốc (Original Bulletin):</span>
          <code className="text-xs font-mono text-indigo-700 block bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-3xs">
            {taf.raw}
          </code>
        </div>
        <div className="text-[9px] uppercase font-mono opacity-50 flex justify-between">
          <p>Accuracy Calculation: (Matches / Total OBS) * 100</p>
        </div>
      </div>
    </div>
  );
}
