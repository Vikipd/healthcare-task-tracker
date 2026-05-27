import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function formatIST(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

const statusConfig = {
  Completed:     { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-400"   },
  Pending:       { badge: "bg-slate-100 text-slate-500",     dot: "bg-slate-400"   },
};

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTasks(data);
      setLastUpdated(new Date());
    }
  }

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.patient_name?.toLowerCase().includes(q) ||
      t.insurance_id?.toLowerCase().includes(q) ||
      t.assigned_user?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const pending = tasks.filter((t) => t.status === "Pending").length;

  function exportToExcel() {
    const data = filtered.map((t) => ({
      Patient: t.patient_name,
      Insurance: t.insurance_id,
      Employee: t.assigned_user,
      Status: t.status,
      "Start Time (IST)": formatIST(t.start_time),
      "End Time (IST)": formatIST(t.end_time),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Report");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Healthcare_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* NAV */}
      <header className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-7 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-tight flex items-center gap-2">
                HealthFlow
                <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                  ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-xs">
                {lastUpdated ? `Synced ${lastUpdated.toLocaleTimeString("en-IN")}` : "Loading…"}
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 px-4 py-2 rounded-lg text-sm transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-7 py-7">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Tasks",  value: total,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-100"    },
            { label: "Completed",    value: completed,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "In Progress",  value: inProgress, color: "text-amber-600",   bg: "bg-amber-50 border-amber-100"  },
            { label: "Pending",      value: pending,    color: "text-slate-500",   bg: "bg-slate-50 border-slate-200"  },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-5`}>
              <div className={`text-4xl font-extrabold tracking-tight ${s.color}`}>{s.value}</div>
              <div className="text-sm text-slate-500 font-medium mt-1.5">{s.label}</div>
              <div className="h-1 rounded-full bg-slate-200 mt-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.color.replace("text-", "bg-")} transition-all duration-700`}
                  style={{ width: total ? `${(s.value / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search patient, insurance, employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Pending", "In Progress", "Completed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  filterStatus === s
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <span className="font-bold text-slate-800 text-base">Employee Workflow Monitoring</span>
            <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full">
              {filtered.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  {["Patient", "Insurance ID", "Employee", "Status", "Start Time", "End Time"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No records match your filter.
                    </td>
                  </tr>
                )}
                {filtered.map((task) => {
                  const cfg = statusConfig[task.status] || statusConfig.Pending;
                  return (
                    <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">{task.patient_name}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-600">{task.insurance_id}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{task.assigned_user}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatIST(task.start_time)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatIST(task.end_time)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}