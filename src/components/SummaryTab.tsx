import React from 'react';
import { TafEvaluationResult } from '../types';
import { BarChart3, TrendingUp, CheckCircle, XCircle, FileText, ArrowRight, PlaneTakeoff, Award, Activity } from 'lucide-react';

interface SummaryTabProps {
  evaluationResults: TafEvaluationResult[];
}

export default function SummaryTab({ evaluationResults }: SummaryTabProps) {
  if (evaluationResults.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-sans flex flex-col items-center justify-center shadow-sm">
        <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700">Chưa có dữ liệu thống kê</p>
        <p className="text-sm text-slate-400 mt-1">Hãy tải lên file hoặc tải dữ liệu mẫu để xem bảng tổng hợp.</p>
      </div>
    );
  }

  // Group evaluations by airport (station) first
  const groupedByStation: { [station: string]: TafEvaluationResult[] } = {};
  evaluationResults.forEach(r => {
    const station = r.taf.station.toUpperCase();
    if (!groupedByStation[station]) {
      groupedByStation[station] = [];
    }
    groupedByStation[station].push(r);
  });

  // Calculate stats for each station
  const stationStats = Object.keys(groupedByStation).map(station => {
    const resultsForStation = groupedByStation[station];
    
    // Group by day key for daily stats of this station
    const groupedByDay: { [day: number]: TafEvaluationResult[] } = {};
    resultsForStation.forEach(r => {
      const day = r.taf.validStartDay;
      if (!groupedByDay[day]) {
        groupedByDay[day] = [];
      }
      groupedByDay[day].push(r);
    });

    const dailyStatsForStation = Object.keys(groupedByDay).map(dayStr => {
      const day = parseInt(dayStr, 10);
      const dayReports = groupedByDay[day];
      const totalScore = dayReports.reduce((sum, r) => sum + r.overallAccuracy, 0);
      const avgScore = Math.round(totalScore / dayReports.length);
      const isPassed = avgScore > 84;

      return {
        day,
        avgScore,
        isPassed,
        reports: dayReports
      };
    }).sort((a, b) => a.day - b.day);

    const totalDays = dailyStatsForStation.length;
    const passedDays = dailyStatsForStation.filter(d => d.isPassed).length;
    const failedDays = totalDays - passedDays;
    
    // Element averages for this station
    const elementAverages = {
      DD: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.DD, 0) / resultsForStation.length),
      FF: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.FF, 0) / resultsForStation.length),
      VV: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.VV, 0) / resultsForStation.length),
      WW: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.WW, 0) / resultsForStation.length),
      CC: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.CC, 0) / resultsForStation.length),
      HH: Math.round(resultsForStation.reduce((sum, r) => sum + r.elementAccuracy.HH, 0) / resultsForStation.length)
    };

    const overallAverage = totalDays > 0
      ? Math.round(dailyStatsForStation.reduce((sum, d) => sum + d.avgScore, 0) / totalDays)
      : 0;

    return {
      station,
      resultsCount: resultsForStation.length,
      dailyStats: dailyStatsForStation,
      totalDays,
      passedDays,
      failedDays,
      elementAverages,
      overallAverage
    };
  }).sort((a, b) => a.station.localeCompare(b.station)); // Sort airports alphabetically

  // Calculate Overall Global Stats across all stations
  const totalReportsGlobal = evaluationResults.length;
  const totalDaysGlobal = stationStats.reduce((sum, s) => sum + s.totalDays, 0);
  const passedDaysGlobal = stationStats.reduce((sum, s) => sum + s.passedDays, 0);
  const failedDaysGlobal = totalDaysGlobal - passedDaysGlobal;
  const overallAverageGlobal = totalDaysGlobal > 0
    ? Math.round(stationStats.reduce((sum, s) => sum + (s.overallAverage * s.totalDays), 0) / totalDaysGlobal)
    : 0;

  const getAirportFullName = (code: string) => {
    switch (code.toUpperCase()) {
      case 'VVNB': return 'Cảng hàng không Quốc tế Nội Bài';
      case 'VVTS': return 'Cảng hàng không Quốc tế Tân Sơn Nhất';
      case 'VVDN': return 'Cảng hàng không Quốc tế Đà Nẵng';
      case 'VVCR': return 'Cảng hàng không Quốc tế Cam Ranh';
      case 'VVPB': return 'Cảng hàng không Quốc tế Phú Bài';
      case 'Vvnb': return 'Cảng hàng không Quốc tế Nội Bài';
      default: return `Sân bay quân sự / dân dụng ${code.toUpperCase()}`;
    }
  };

  const getScoreRating = (avg: number) => {
    if (avg >= 85) return { label: 'TỐT', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (avg >= 70) return { label: 'KHÁ', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (avg >= 50) return { label: 'TRUNG BÌNH', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'KÉM', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-8 font-sans text-sm text-slate-700">
      {/* 4 Elegant Global Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Monthly Average */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">TRUNG BÌNH CHUNG</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{overallAverageGlobal}%</p>
            <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
              overallAverageGlobal > 84 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {overallAverageGlobal > 84 ? 'ĐẠT TIÊU CHUẨN' : 'CẦN CẢI THIỆN'}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Airports & Days */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">SÂN BAY & NGÀY ĐÁNH GIÁ</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{stationStats.length} <span className="text-xs text-slate-400 font-normal">sân bay</span></p>
            <span className="text-[10px] text-slate-500 block font-medium">Tổng số: {totalDaysGlobal} ngày ({totalReportsGlobal} bản tin TAF)</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <PlaneTakeoff className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Days PASSED */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">TỔNG SỐ NGÀY ĐẠT</p>
            <p className="text-3xl font-bold text-emerald-600 font-display">{passedDaysGlobal} <span className="text-xs text-slate-400 font-normal">ngày</span></p>
            <span className="text-[10px] text-emerald-600 font-semibold block">Tỷ lệ đạt: {totalDaysGlobal > 0 ? Math.round((passedDaysGlobal / totalDaysGlobal) * 100) : 0}%</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Days FAILED */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">TỔNG SỐ NGÀY CHƯA ĐẠT</p>
            <p className="text-3xl font-bold text-rose-600 font-display">{failedDaysGlobal} <span className="text-xs text-slate-400 font-normal">ngày</span></p>
            <span className="text-[10px] text-rose-600 font-semibold block">Tỷ lệ chưa đạt: {totalDaysGlobal > 0 ? Math.round((failedDaysGlobal / totalDaysGlobal) * 100) : 0}%</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Header divider */}
      <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          Kết quả tổng hợp thống kê sắp xếp theo sân bay
        </h3>
        <span className="text-[10px] text-slate-400 italic font-medium font-sans">
          *(Ngày đánh giá được tham chiếu trực tiếp từ nội dung tệp đối soát đã nạp)
        </span>
      </div>

      {/* Airport Sections */}
      <div className="space-y-8">
        {stationStats.map((stat, sIdx) => {
          const rating = getScoreRating(stat.overallAverage);
          return (
            <div key={stat.station} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              {/* Airport Header Card */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-lg">
                    <PlaneTakeoff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      {stat.station} - {getAirportFullName(stat.station)}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Đã đánh giá {stat.totalDays} ngày (Tổng {stat.resultsCount} bản tin dự báo khí tượng TAF)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 border border-slate-150 rounded-lg shadow-2xs self-stretch sm:self-auto justify-between">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm trung bình</span>
                    <span className="text-xl font-bold text-slate-800 font-display">{stat.overallAverage}%</span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-md border ${rating.color}`}>
                      {rating.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Airport stats details */}
              <div className="p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. Element accuracy progress grid */}
                <div className="lg:col-span-6 space-y-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Độ chính xác trung bình theo yếu tố (%)
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    {(['DD', 'FF', 'VV', 'WW', 'CC', 'HH'] as const).map(el => {
                      const avg = stat.elementAverages[el];
                      const elFullName = el === 'DD' ? 'Hướng gió (DD)' :
                                         el === 'FF' ? 'Tốc độ gió (FF)' :
                                         el === 'VV' ? 'Tầm nhìn (VV)' :
                                         el === 'WW' ? 'Hiện tượng (WW)' :
                                         el === 'CC' ? 'Lượng mây (CC)' : 'Độ cao mây (HH)';
                      
                      let barColor = 'bg-emerald-500';
                      if (avg < 50) barColor = 'bg-rose-500';
                      else if (avg < 75) barColor = 'bg-amber-500';
                      else if (avg < 85) barColor = 'bg-blue-500';

                      return (
                        <div key={el} className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{elFullName}</span>
                            <span className="font-bold text-slate-900">{avg}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${avg}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. List of days evaluated at this airport */}
                <div className="lg:col-span-6 space-y-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Chi tiết đánh giá theo ngày ({stat.station})
                  </h5>
                  <div className="overflow-y-auto max-h-[220px] pr-1 space-y-2 border border-slate-100 rounded-lg p-2 bg-slate-50/30">
                    {stat.dailyStats.map((daily) => (
                      <div key={daily.day} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-3xs hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${daily.isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span className="font-semibold text-slate-700">Ngày {String(daily.day).padStart(2, '0')}</span>
                          <span className="text-slate-400 text-xs font-medium">({daily.reports.length} bản tin TAF)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-800">TRUNG BÌNH: {daily.avgScore}%</span>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            daily.isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {daily.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
