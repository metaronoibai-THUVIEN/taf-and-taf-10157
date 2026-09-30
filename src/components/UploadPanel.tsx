import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import { parseFile, ParsedReports, parseReportsFromText } from '../utils/fileParser';
import { SAMPLE_DATA_TEXT } from '../sampleData';

interface UploadPanelProps {
  onDataLoaded: (data: ParsedReports) => void;
  onReset: () => void;
}

export default function UploadPanel({ onDataLoaded, onReset }: UploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<ParsedReports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    try {
      const parsed = await parseFile(uploadedFile);
      setStats(parsed);
      onDataLoaded(parsed);
    } catch (err) {
      setError((err as Error).message);
      setStats(null);
      setFile(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const loadSample = () => {
    setError(null);
    setFile(null);
    const parsed = parseReportsFromText(SAMPLE_DATA_TEXT);
    setStats(parsed);
    onDataLoaded(parsed);
  };

  const handleReset = () => {
    setFile(null);
    setStats(null);
    setError(null);
    onReset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-indigo-50/20 border border-slate-200 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Decorative top colored bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
      
      <div className="pt-1">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">📁 NHẬP DỮ LIỆU ĐỐI SOÁT</h2>
        </div>

        {/* Drag and Drop Zone */}
        <div
          id="upload-dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[190px] ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-100/50 scale-[0.99] ring-4 ring-indigo-500/10'
              : 'border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20 hover:bg-indigo-50/30 hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept=".txt,.docx,.xlsx,.xls,.csv,.html"
            className="hidden"
          />
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300 shadow-3xs">
            <FileText className="w-8 h-8" />
          </div>
          <p className="font-bold text-slate-700 text-xs uppercase tracking-wide">
            Kéo thả file vào đây hoặc nhấp để chọn
          </p>
          <p className="text-[10px] text-slate-400 mt-2.5 uppercase tracking-wide bg-slate-100 px-2.5 py-1 rounded-full font-medium inline-block">
            Định dạng: .txt, .docx, .xlsx, .csv, .html
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex gap-2 items-start animate-fade-in shadow-3xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Status indicator */}
        {stats && (
          <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-100/80 rounded-2xl text-xs space-y-3 shadow-3xs">
            <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 mb-2 uppercase tracking-wide">
              <div className="p-1 bg-emerald-100 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span>ĐÃ NẠP DỮ LIỆU THÀNH CÔNG</span>
            </div>
            {file && (
              <p className="text-slate-600 font-medium bg-white/70 px-2 py-1.5 rounded-lg border border-emerald-100/40">
                <span className="font-bold text-slate-800">Tên file:</span> {file.name} <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white border border-emerald-100 rounded-xl p-2.5 text-center shadow-3xs">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider leading-tight">TAF PHÁT HIỆN</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{stats.tafs.length}</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-xl p-2.5 text-center shadow-3xs">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider leading-tight">METAR/SPECI</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{stats.observations.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100">
        <button
          id="btn-load-sample"
          onClick={loadSample}
          type="button"
          className="flex-1 py-2.5 px-3 bg-white border border-indigo-200 text-xs text-indigo-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-800 font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs uppercase cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          Sử dụng bản tin mẫu
        </button>
        {stats && (
          <button
            id="btn-reset-upload"
            onClick={handleReset}
            type="button"
            className="py-2.5 px-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-100/50 rounded-xl font-bold transition-all shadow-2xs uppercase cursor-pointer"
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}
