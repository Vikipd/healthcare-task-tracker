import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzOZVJGKEULik6HjPx2TH7Hh6HUSxG6roWOlKqi4nj05pEDeM_7HjJxB61o3LWq5tzC/exec";

function formatIST(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function postToSheets(payload) {
  fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const statusConfig = {
  Completed:   { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400"   },
  Pending:     { badge: "bg-slate-100 text-slate-500",    dot: "bg-slate-400"   },
};

export default function EmployeeDashboard({ user }) {
  const safeUser = user || { email: "employee@workflow.com" };
  const [tasks, setTasks] = useState([]);
  const [patientName, setPatientName] = useState("");
  const [insuranceId, setInsuranceId] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_user", safeUser.email)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  }, [safeUser.email]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function addTask() {
    if (!patientName.trim() || !insuranceId.trim()) {
      alert("Please fill all fields");
      return;
    }
    setAdding(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      patient_name: patientName,
      insurance_id: insuranceId,
      assigned_user: safeUser.email,
      status: "Pending",
      start_time: null,
      end_time: null,
      _optimistic: true,
    };
    setTasks((prev) => [optimistic, ...prev]);
    setPatientName("");
    setInsuranceId("");

    const { data } = await supabase
      .from("tasks")
      .insert([{
        patient_name: optimistic.patient_name,
        insurance_id: optimistic.insurance_id,
        assigned_user: safeUser.email,
        status: "Pending",
      }])
      .select()
      .single();

    postToSheets({
      patient: optimistic.patient_name,
      insurance: optimistic.insurance_id,
      employee: safeUser.email,
      status: "Pending",
      startTime: "",
      endTime: "",
    });

    if (data) {
      setTasks((prev) => prev.map((t) => (t.id === tempId ? data : t)));
    } else {
      fetchTasks();
    }
    setAdding(false);
  }

  async function startTask(task) {
    const startTimeISO = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: "In Progress", start_time: startTimeISO } : t)
    );
    await supabase.from("tasks").update({ start_time: startTimeISO, status: "In Progress" }).eq("id", task.id);
    postToSheets({
      patient: task.patient_name,
      insurance: task.insurance_id,
      employee: safeUser.email,
      status: "In Progress",
      startTime: formatIST(startTimeISO),
      endTime: "",
    });
  }

  async function completeTask(task) {
    const endTimeISO = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: "Completed", end_time: endTimeISO } : t)
    );
    await supabase.from("tasks").update({ end_time: endTimeISO, status: "Completed" }).eq("id", task.id);
    postToSheets({
      patient: task.patient_name,
      insurance: task.insurance_id,
      employee: safeUser.email,
      status: "Completed",
      startTime: formatIST(task.start_time),
      endTime: formatIST(endTimeISO),
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pending = tasks.filter((t) => t.status !== "Completed").length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* NAV */}
      <header className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-tight">HealthFlow</div>
              <div className="text-slate-500 text-xs">{safeUser.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 px-4 py-1.5 rounded-lg text-sm transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-7">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="text-4xl font-extrabold text-blue-600 tracking-tight">{total}</div>
            <div className="text-sm text-slate-500 font-medium mt-1.5">Total Tasks</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">{completed}</div>
            <div className="text-sm text-slate-500 font-medium mt-1.5">Completed</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div className="text-4xl font-extrabold text-amber-500 tracking-tight">{pending}</div>
            <div className="text-sm text-slate-500 font-medium mt-1.5">Pending</div>
          </div>
        </div>

        {/* CREATE TASK */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-5">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <span className="font-bold text-slate-800 text-base">New Task</span>
            <span className="text-slate-400 text-sm">Register a patient workflow</span>
          </div>
          <div className="px-6 py-5 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 min-w-[180px] border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
            <input
              type="text"
              placeholder="Insurance ID"
              value={insuranceId}
              onChange={(e) => setInsuranceId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 min-w-[180px] border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
            <button
              onClick={addTask}
              disabled={adding}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 whitespace-nowrap"
            >
              {adding ? "Adding…" : "+ Add Task"}
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <span className="font-bold text-slate-800 text-base">Workflow Monitor</span>
            <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full">
              {tasks.length} tasks
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  {["Patient", "Insurance ID", "Status", "Start Time", "End Time", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No tasks yet. Add your first task above.
                    </td>
                  </tr>
                )}
                {tasks.map((task) => {
                  const cfg = statusConfig[task.status] || statusConfig.Pending;
                  return (
                    <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">{task.patient_name}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-600">{task.insurance_id}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatIST(task.start_time)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatIST(task.end_time)}</td>
                      <td className="px-5 py-4">
                        {task.status === "Completed" ? (
                          <span className="text-emerald-600 font-bold text-sm">✓ Done</span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startTask(task)}
                              disabled={task.status === "In Progress" || task._optimistic}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => completeTask(task)}
                              disabled={task._optimistic}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                      </td>
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