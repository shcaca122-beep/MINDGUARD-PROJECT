"use client";

import React, { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="admin-dashboard flex min-h-screen bg-[#06140e] text-emerald-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ==================== SIDEBAR ==================== */}
      <aside className="w-64 bg-[#030d09] border-r border-emerald-900/40 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-emerald-900/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/50">
            MG
          </div>
          <div>
            <h1 className="font-bold text-sm text-emerald-300 tracking-wide">MINDGUARD</h1>
            <p className="text-[11px] text-emerald-500/80">SMK Budi Bakti Ciwidey</p>
          </div>
        </div>

        {/* User Info Sidebar */}
        <div className="p-4 bg-[#051811] border-b border-emerald-900/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-800 border border-emerald-500/30 flex items-center justify-center text-xs font-semibold text-emerald-200">
            AU
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-emerald-200 truncate">Administrator Utama</p>
            <p className="text-[10px] text-emerald-500">Super Admin</p>
          </div>
        </div>

        <div className="px-4 pt-4">
          <ThemeToggle />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-6 text-xs overflow-y-auto custom-scrollbar">
          {/* Main Link */}
          <div>
            <button
              onClick={() => setActiveTab("Dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === "Dashboard"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-emerald-400/80 hover:bg-emerald-950/60 hover:text-emerald-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              Dashboard
            </button>
          </div>

          {/* Group 1: DATA MASTER */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">DATA MASTER</p>
            <div className="space-y-1">
              {["Data Guru", "Data Kelas", "Data Siswa", "Jenis Pelanggaran", "Profil Sekolah"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                    activeTab === item
                      ? "bg-emerald-800/50 text-emerald-200 font-medium border-l-2 border-emerald-400"
                      : "text-emerald-400/70 hover:bg-emerald-950/40 hover:text-emerald-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: KEGIATAN BK */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">KEGIATAN BK</p>
            <div className="space-y-1">
              {["Sesi Konseling", "Pelanggaran Siswa"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                    activeTab === item
                      ? "bg-emerald-800/50 text-emerald-200 font-medium border-l-2 border-emerald-400"
                      : "text-emerald-400/70 hover:bg-emerald-950/40 hover:text-emerald-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: LAPORAN */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">LAPORAN</p>
            <div className="space-y-1">
              {["Laporan Konseling", "Laporan Pelanggaran"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                    activeTab === item
                      ? "bg-emerald-800/50 text-emerald-200 font-medium border-l-2 border-emerald-400"
                      : "text-emerald-400/70 hover:bg-emerald-950/40 hover:text-emerald-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Group 4: PENGATURAN */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">PENGATURAN</p>
            <button
              onClick={() => setActiveTab("Pengaturan User")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-400/70 hover:bg-emerald-950/40 hover:text-emerald-200 rounded-lg text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
              Pengaturan User
            </button>
          </div>
        </nav>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="h-14 bg-[#040e0a] border-b border-emerald-900/40 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button className="text-emerald-400 hover:text-emerald-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <h2 className="text-lg font-bold text-emerald-200">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-emerald-400/70">
              Home / <span className="text-emerald-200 font-medium">Dashboard</span>
            </div>
            <div className="h-4 w-[1px] bg-emerald-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-white">
                AU
              </div>
              <span className="text-emerald-300 font-medium">Administrator Utama</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Body */}
        <main className="p-6 space-y-6 flex-1">
          {/* 4 STAT CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Siswa */}
            <div className="bg-[#0b2419] border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 flex flex-col justify-between">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold text-white">1,248</h3>
                  <p className="text-xs text-emerald-300 mt-1 font-medium">Total Siswa</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-teal-900/60 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
              </div>
              <button className="bg-emerald-950/80 hover:bg-emerald-900/80 border-t border-emerald-800/40 px-4 py-2 text-[11px] text-teal-300 flex items-center justify-center gap-1.5 transition-colors">
                Lihat Detail <span>&rarr;</span>
              </button>
            </div>

            {/* Card 2: Total Guru BK */}
            <div className="bg-[#0b2419] border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 flex flex-col justify-between">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold text-white">6</h3>
                  <p className="text-xs text-emerald-300 mt-1 font-medium">Total Guru BK</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <button className="bg-emerald-950/80 hover:bg-emerald-900/80 border-t border-emerald-800/40 px-4 py-2 text-[11px] text-emerald-300 flex items-center justify-center gap-1.5 transition-colors">
                Lihat Detail <span>&rarr;</span>
              </button>
            </div>

            {/* Card 3: Sesi Konseling */}
            <div className="bg-[#0b2419] border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 flex flex-col justify-between">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold text-white">18</h3>
                  <p className="text-xs text-amber-300 mt-1 font-medium">Sesi Konseling</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
              </div>
              <button className="bg-emerald-950/80 hover:bg-emerald-900/80 border-t border-emerald-800/40 px-4 py-2 text-[11px] text-amber-300 flex items-center justify-center gap-1.5 transition-colors">
                Lihat Detail <span>&rarr;</span>
              </button>
            </div>

            {/* Card 4: Pelanggaran */}
            <div className="bg-[#0b2419] border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 flex flex-col justify-between">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold text-white">24</h3>
                  <p className="text-xs text-rose-300 mt-1 font-medium">Pelanggaran Siswa</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
              </div>
              <button className="bg-emerald-950/80 hover:bg-emerald-900/80 border-t border-emerald-800/40 px-4 py-2 text-[11px] text-rose-300 flex items-center justify-center gap-1.5 transition-colors">
                Lihat Detail <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* MAIN GRID: GRAFIK (LEFT) + INFORMASI SEKOLAH (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS: GRAFIK KONSELING BULANAN */}
            <div className="lg:col-span-2 bg-[#081c13] border border-emerald-800/50 rounded-xl shadow-xl overflow-hidden flex flex-col">
              <div className="bg-[#051811] px-5 py-3.5 border-b border-emerald-800/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-300">Grafik Konseling Bulanan</h3>
                <span className="text-[11px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Tahun 2026
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                {/* Visual Bar Chart */}
                <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-emerald-800/40">
                  {[
                    { month: "Jan", val: 35 },
                    { month: "Feb", val: 85 },
                    { month: "Mar", val: 45 },
                    { month: "Apr", val: 60 },
                    { month: "Mei", val: 20 },
                    { month: "Jun", val: 15 },
                    { month: "Jul", val: 50 },
                    { month: "Agu", val: 75 },
                    { month: "Sep", val: 90 },
                    { month: "Okt", val: 40 },
                    { month: "Nov", val: 65 },
                    { month: "Des", val: 30 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        {item.val}
                      </div>
                      <div
                        style={{ height: `${item.val}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-emerald-800 to-emerald-400 rounded-t-md group-hover:from-emerald-700 group-hover:to-emerald-300 transition-all shadow-md shadow-emerald-950"
                      ></div>
                      <span className="text-[11px] text-emerald-400/80 group-hover:text-emerald-200">{item.month}</span>
                    </div>
                  ))}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-emerald-400/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                    <span>Jumlah Sesi Konseling Terjadwal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 1 COLUMN: INFORMASI SEKOLAH */}
            <div className="bg-[#081c13] border border-emerald-800/50 rounded-xl shadow-xl overflow-hidden flex flex-col">
              <div className="bg-[#051811] px-5 py-3.5 border-b border-emerald-800/50">
                <h3 className="text-sm font-bold text-emerald-300">Informasi Sekolah</h3>
              </div>

              <div className="p-5 space-y-5 text-xs">
                {/* Nama Sekolah */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V11m0 0h5M12 11H7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-500 text-[11px] font-semibold">Nama Sekolah</p>
                    <p className="font-bold text-emerald-100 text-sm mt-0.5">SMK Budi Bakti Ciwidey</p>
                  </div>
                </div>

                {/* Alamat */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-500 text-[11px] font-semibold">Alamat Sekolah</p>
                    <p className="text-emerald-200 mt-0.5 leading-relaxed">
                      Jl. Raya Ciwidey - Patengan No. 108, Kec. Ciwidey, Kabupaten Bandung, Jawa Barat
                    </p>
                  </div>
                </div>

                {/* Kepala Sekolah */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-500 text-[11px] font-semibold">Kepala Sekolah</p>
                    <p className="font-bold text-emerald-100 mt-0.5">Drs. H. Ahmad Sudrajat, M.Pd</p>
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">NIP: 19680312 199403 1 004</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer className="h-10 bg-[#030d09] border-t border-emerald-900/40 px-6 flex items-center justify-between text-[11px] text-emerald-500/80 shrink-0">
          <div>
            Copyright &copy; 2026 <span className="text-emerald-400 font-medium">Aplikasi MindGuard SMK Budi Bakti Ciwidey</span>. All rights reserved.
          </div>
          <div>Version 1.0.0</div>
        </footer>
      </div>
    </div>
  );
}