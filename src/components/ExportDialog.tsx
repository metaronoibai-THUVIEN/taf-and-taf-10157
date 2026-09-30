import React, { useState } from 'react';
import { TafEvaluationResult } from '../types';
import { Download, X, FileEdit, FileCode, Printer, HelpCircle } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationResults: TafEvaluationResult[];
  referenceMonthYear?: string;
  fileHeader?: string;
}

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  evaluationResults, 
  referenceMonthYear = "Tháng đối soát", 
  fileHeader 
}: ExportDialogProps) {
  const [reportType, setReportType] = useState<'detail' | 'summary'>('detail');
  const [format, setFormat] = useState<'.docx' | '.html' | '.pdf'>('.docx');

  if (!isOpen) return null;

  // Generate beautiful styled HTML report content
  const generateReportHtml = (): string => {
    // Generate individual TAF reports HTML
    const tafsHtml = evaluationResults.map((result, idx) => {
      const { taf, evaluations, elementAccuracy, overallAccuracy } = result;
      return `
        <div style="margin-bottom: 40px; page-break-after: always; font-family: 'Segoe UI', Arial, sans-serif;">
          <h2 style="font-size: 16px; margin-bottom: 2px; color: #111;">Forecast Bulletin TAF Evaluation</h2>
          <p style="font-size: 13px; margin-top: 0; color: #555; margin-bottom: 15px;">
            Airport: <strong>${taf.station}</strong> - Date: <strong>${String(taf.validStartDay).padStart(2, '0')} (${referenceMonthYear})</strong> - Validtime: <strong>${String(taf.validStartHour).padStart(2, '0')}${String(taf.validEndHour).padStart(2, '0')}</strong>
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th colspan="2" style="border: 1px solid #ccc; padding: 6px; text-align: left; font-weight: bold; width: 130px;">Time UTC</th>
                ${evaluations.map(h => `<th style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: bold; width: 50px;">${h.timeStr}</th>`).join('')}
                <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 45px;">%</th>
                <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 150px;">Accuracy</th>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ccc; padding: 4px; text-align: left; color: #666;">Element</th>
                <th style="border: 1px solid #ccc; padding: 4px; text-align: center; color: #666;">Type</th>
                ${evaluations.map(() => `<th style="border: 1px solid #ccc; padding: 4px;"></th>`).join('')}
                <th style="border: 1px solid #ccc; padding: 4px;"></th>
                <th style="border: 1px solid #ccc; padding: 4px;"></th>
              </tr>
            </thead>
            <tbody>
              ${(['DD', 'FF', 'VV', 'WW', 'CC', 'HH'] as const).map((el, elIdx) => {
                return `
                  <tr>
                    <!-- Element Column (Spans 2 rows) -->
                    <td rowspan="2" style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; background-color: #fcfcfc; width: 60px;">${el}</td>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: bold; color: #555;">TAF</td>
                    ${evaluations.map(h => {
                      return `<td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-family: monospace; background-color: #ffffff; color: #333;">${h.elements[el].tafVal}</td>`;
                    }).join('')}
                    <td rowspan="2" style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 45px;">${elementAccuracy[el]}</td>
                    ${elIdx === 0 ? `
                      <td rowspan="12" style="border: 1px solid #ccc; padding: 12px; vertical-align: top; background-color: #fafafa; font-family: monospace; font-size: 11px; line-height: 1.5; width: 150px;">
                        <strong style="font-size: 12px; color: #000; display: block; margin-bottom: 8px;">Accuracy = ${overallAccuracy} %</strong>
                        DD = ${elementAccuracy.DD} %<br/>
                        FF = ${elementAccuracy.FF} %<br/>
                        VV = ${elementAccuracy.VV} %<br/>
                        WW = ${elementAccuracy.WW} %<br/>
                        CC = ${elementAccuracy.CC} %<br/>
                        HH = ${elementAccuracy.HH} %
                      </td>
                    ` : ''}
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-weight: bold; color: #555;">METAR</td>
                    ${evaluations.map(h => `<td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-family: monospace; color: #333;">${h.elements[el].metarVal}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <p style="font-size: 10px; color: #666; font-style: italic; margin-bottom: 6px;">
            Note: DD-Wind Direction; FF-Wind Speed; VV- Visibility; WW- Weather; CC- Cloud Amount; HH-Height of base of Clouds
          </p>
          <p style="font-size: 10px; color: #555; font-style: italic; margin-bottom: 12px; margin-top: 0px;">
            * Ghi chú: Thông tin ngày, tháng, năm đánh giá được xác định và đối chiếu trực tiếp từ nhóm thời gian phát hành và ngày hiệu lực của bản tin trong tệp dữ liệu đã tải lên.
          </p>
          <div style="border-top: 1px solid #eee; padding-top: 8px;">
            <span style="font-size: 11px; font-weight: bold; color: #333;">TAF Bulletin:</span>
            <code style="display: block; font-family: monospace; font-size: 11px; background-color: #fdfdfd; border: 1px solid #e0e0e0; padding: 8px; border-radius: 4px; margin-top: 4px; white-space: pre-wrap;">${taf.raw}</code>
          </div>
        </div>
      `;
    }).join('');

    // Generate Summary block HTML
    // Calculate elements averages
    const totalReports = evaluationResults.length;
    const elementAverages = {
      DD: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.DD, 0) / totalReports),
      FF: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.FF, 0) / totalReports),
      VV: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.VV, 0) / totalReports),
      WW: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.WW, 0) / totalReports),
      CC: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.CC, 0) / totalReports),
      HH: Math.round(evaluationResults.reduce((sum, r) => sum + r.elementAccuracy.HH, 0) / totalReports)
    };

    const dailyStats = evaluationResults.map(r => {
      const isPassed = r.overallAccuracy > 84;
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; font-size: 11px;">Sân bay: ${r.taf.station} - Ngày ${String(r.taf.validStartDay).padStart(2, '0')} (${referenceMonthYear})</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.DD}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.FF}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.VV}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.WW}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.CC}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace;">${r.elementAccuracy.HH}%</td>
          <td style="padding: 8px; font-size: 11px; font-family: monospace; font-weight: bold;">${r.overallAccuracy}%</td>
          <td style="padding: 8px; font-size: 11px; font-weight: bold; color: ${isPassed ? '#137333' : '#c5221f'};">${isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}</td>
        </tr>
      `;
    }).join('');

    const monthlyAvg = Math.round(evaluationResults.reduce((sum, r) => sum + r.overallAccuracy, 0) / totalReports);

    const summaryBlockHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; margin-top: 30px;">
        <h2 style="font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 6px; color: #111; margin-bottom: 15px;">📊 TỔNG HỢP THỐNG KÊ ĐÁNH GIÁ TAF</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ccc; text-align: left;">
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">Ngày / Sân bay</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">DD (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">FF (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">VV (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">WW (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">CC (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">HH (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">Trung bình ngày (%)</th>
              <th style="padding: 8px; font-size: 11px; font-weight: bold;">Kết luận</th>
            </tr>
          </thead>
          <tbody>
            ${dailyStats}
          </tbody>
        </table>

        <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 15px; border-radius: 6px; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0; font-weight: bold; font-size: 14px; color: #000; margin-bottom: 8px;">KẾT LUẬN TỔNG THỂ THÁNG</p>
          <p style="margin: 0;">• <strong>Tổng số bản tin đánh giá</strong>: ${totalReports} bản tin</p>
          <p style="margin: 0;">• <strong>Điểm trung bình toàn bộ bản tin TAF</strong>: <span style="font-size: 13px; font-weight: bold; color: ${monthlyAvg > 84 ? '#137333' : '#c5221f'};">${monthlyAvg}%</span></p>
          <p style="margin: 0;">• <strong>Kết luận chất lượng phát hành bản tin</strong>: <strong style="color: ${monthlyAvg > 84 ? '#137333' : '#c5221f'};">${monthlyAvg > 84 ? '✅ ĐẠT YÊU CẦU ĐỘ CHÍNH XÁC CỦA ICAO' : '❌ CHƯA ĐẠT CHỈ TIÊU ĐỘ CHÍNH XÁC'}</strong></p>
          <p style="margin: 0; margin-top: 10px; font-size: 11px; color: #555; font-style: italic; border-top: 1px dashed #eee; padding-top: 8px;">* Lưu ý: Thông tin về ngày, tháng, năm đánh giá được tham chiếu và đối soát trực tiếp từ nội dung của file dữ liệu đã nạp.</p>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Đánh giá chất lượng bản tin TAF</title>
        <style>
          body { padding: 30px; }
          @media print {
            body { padding: 0; }
            button, .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <h1 style="font-size: 20px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
          BÁO CÁO CHẤT LƯỢNG BẢN TIN DỰ BÁO TAF THEO TIÊU CHUẨN ICAO ANNEX 3
        </h1>
        <p style="font-size: 11px; text-align: center; color: #555; margin-top: -15px; margin-bottom: 30px; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
          *(Thời gian đánh giá - bao gồm ngày, tháng, năm - được tham chiếu và đối soát trực tiếp từ nội dung của tệp dữ liệu đã tải lên hệ thống)
        </p>
        ${reportType === 'detail' ? tafsHtml : ''}
        ${reportType === 'summary' || reportType === 'detail' ? summaryBlockHtml : ''}
      </body>
      </html>
    `;
  };

  const handleExport = () => {
    const reportHtml = generateReportHtml();

    if (format === '.pdf') {
      // For PDF, we open a new printable window or just print the current page if desired,
      // but a new styled window is much cleaner and focuses on the report!
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        // Give resources a millisecond to load and print
        setTimeout(() => {
          printWindow.print();
        }, 350);
      }
    } else {
      // For HTML or DOCX download
      const mimeType = format === '.docx' ? 'application/msword' : 'text/html';
      const fileExtension = format === '.docx' ? 'doc' : 'html'; // doc extension forces Word opening beautifully
      const blob = new Blob([reportHtml], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao_cao_danh_gia_TAF_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-fade-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">💾 XUẤT BÁO CÁO</h3>
          </div>
          <button
            id="btn-close-export-dialog"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Section 1: Report Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">LOẠI BÁO CÁO</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                reportType === 'detail'
                  ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950 ring-1 ring-indigo-600/50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="detail"
                  checked={reportType === 'detail'}
                  onChange={() => setReportType('detail')}
                  className="accent-indigo-600 cursor-pointer w-4 h-4"
                />
                <div className="text-xs">
                  <p className="font-bold">Báo cáo Chi tiết</p>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">Bảng 12 giờ & tổng hợp</p>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                reportType === 'summary'
                  ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950 ring-1 ring-indigo-600/50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  checked={reportType === 'summary'}
                  onChange={() => setReportType('summary')}
                  className="accent-indigo-600 cursor-pointer w-4 h-4"
                />
                <div className="text-xs">
                  <p className="font-bold">Báo cáo Tổng hợp</p>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">Bảng thống kê chung</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Format Choice */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">ĐỊNH DẠNG TỆP</label>
            <div className="space-y-2">
              {/* DOCX */}
              <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                format === '.docx'
                  ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950 ring-1 ring-indigo-600/50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}>
                <div className="flex items-center gap-3 text-xs w-full">
                  <input
                    type="radio"
                    name="format"
                    value=".docx"
                    checked={format === '.docx'}
                    onChange={() => setFormat('.docx')}
                    className="accent-indigo-600 cursor-pointer w-4 h-4"
                  />
                  <FileEdit className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold">Microsoft Word (.docx)</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Định dạng tài liệu soạn thảo chuẩn</p>
                  </div>
                </div>
              </label>

              {/* HTML */}
              <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                format === '.html'
                  ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950 ring-1 ring-indigo-600/50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}>
                <div className="flex items-center gap-3 text-xs w-full">
                  <input
                    type="radio"
                    name="format"
                    value=".html"
                    checked={format === '.html'}
                    onChange={() => setFormat('.html')}
                    className="accent-indigo-600 cursor-pointer w-4 h-4"
                  />
                  <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold">Trang web (.html)</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Có thể xem trên trình duyệt hoặc máy tính</p>
                  </div>
                </div>
              </label>

              {/* PDF */}
              <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                format === '.pdf'
                  ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950 ring-1 ring-indigo-600/50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}>
                <div className="flex items-center gap-3 text-xs w-full">
                  <input
                    type="radio"
                    name="format"
                    value=".pdf"
                    checked={format === '.pdf'}
                    onChange={() => setFormat('.pdf')}
                    className="accent-indigo-600 cursor-pointer w-4 h-4"
                  />
                  <Printer className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold">Xuất bản in / PDF (.pdf)</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">In trực tiếp hoặc Lưu thành PDF sắc nét</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            id="btn-dialog-cancel"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-200 text-xs text-slate-600 rounded-xl hover:bg-slate-100 font-bold transition-all shadow-3xs uppercase cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            id="btn-dialog-export"
            onClick={handleExport}
            className="flex-1 py-2.5 px-4 bg-indigo-600 text-white text-xs rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Tải báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}
