import { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import VitalsCard from "./components/VitalsCard";

export default function App() {
  // --- 1. CORE STATE ---
  const [patients, setPatients] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempNote, setTempNote] = useState("");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    bloodPressure: "120/80",
  });

  // --- 2. LOGIC HELPERS ---
  const getPatientStatus = (hr) => {
    if (hr > 110) return "Critical";
    if (hr < 60) return "Warning";
    return "Stable";
  };

  const handleNoteChange = (id, newNote) => {
    setPatients((prev) => {
      const updated = { ...prev, [id]: { ...prev[id], notes: newNote } };
      localStorage.setItem("hospital_records", JSON.stringify(updated));
      return updated;
    });
  };

  const removePatient = (id) => {
    if (!window.confirm("Discharge this patient and delete all records?")) return;
    const next = { ...patients };
    delete next[id];
    setPatients(next);
    if (activeId === id) setActiveId(Object.keys(next)[0] || null);
    localStorage.setItem("hospital_records", JSON.stringify(next));
  };

  const handleAdmit = (e) => {
    e.preventDefault();
    const id = `pt-${Date.now()}`;
    const newPt = {
      ...formData,
      id,
      heartRate: 72,
      status: "Stable",
      waveData: new Array(80).fill(100),
      notes: "",
    };
    const updated = { ...patients, [id]: newPt };
    setPatients(updated);
    setActiveId(id);
    setShowForm(false);
    setFormData({ firstName: "", lastName: "", age: "", bloodPressure: "120/80" });
    localStorage.setItem("hospital_records", JSON.stringify(updated));
  };

  const downloadPatientReport = () => {
    const activePatient = patients[activeId];
    const reportContent = `
HOSPITAL PATIENT REPORT
----------------------------
Generated: ${new Date().toLocaleString()}

PATIENT INFO
Name: ${activePatient.firstName} ${activePatient.lastName}
ID: ${activePatient.id}
Age: ${activePatient.age}

LATEST VITALS
Heart Rate: ${activePatient.heartRate} bpm
Blood Pressure: ${activePatient.bloodPressure}
Status: ${activePatient.status}

NURSING OBSERVATIONS
-----------------------
${tempNote || "No notes recorded."}

-----------------------
End of Report
    `;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${activePatient.lastName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- 3. EFFECTS ---

  // Initial Data Load
  useEffect(() => {
    const localData = localStorage.getItem("hospital_records");
    if (localData) {
      setPatients(JSON.parse(localData));
      setLoading(false);
    } else {
      fetch("https://formatjsononline.com/api/json/pulse-check")
        .then((res) => res.json())
        .then((data) => {
          const init = data.reduce((acc, p, i) => {
            const id = `pt-${i}`;
            acc[id] = {
              ...p,
              id,
              status: "Stable",
              waveData: new Array(80).fill(100),
              notes: "",
            };
            return acc;
          }, {});
          setPatients(init);
          setActiveId("pt-0");
          setLoading(false);
        });
    }
  }, []);

  // Sync tempNote when switching patients
  useEffect(() => {
    if (patients && activeId) {
      setTempNote(patients[activeId]?.notes || "");
    }
  }, [activeId]);

  // Simulation Engine (ECG Wave + Heart Rate Drift)
  useEffect(() => {
    if (!patients) return;
    const timer = setInterval(() => {
      setPatients((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          const p = next[id];
          const drift = Math.floor(Math.random() * 3) - 1;
          const newHR = Math.max(50, Math.min(140, (p.heartRate || 72) + drift));

          // Calculate ECG PQRST points
          const beatInterval = 60000 / newHR;
          const offset = parseInt(id.split("-")[1] || 0) * 100;
          const time = (Date.now() + offset) % beatInterval;

          let wavePoint = 100;
          if (time > 0 && time < 30) wavePoint = 110;
          else if (time >= 40 && time < 70) wavePoint = 20;
          else if (time >= 70 && time < 100) wavePoint = 180;
          else if (time >= 150 && time < 250) wavePoint = 85;
          else wavePoint = 100 + Math.random() * 2;

          const newWave = [...(p.waveData || [])];
          newWave.push(wavePoint);

          next[id] = {
            ...p,
            heartRate: newHR,
            status: getPatientStatus(newHR),
            waveData: newWave.slice(-80),
          };
        });
        return next;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [patients ? Object.keys(patients).length : 0]);

  // --- 4. DERIVED DATA ---
  const activePatient = patients?.[activeId];
  const filteredPatientsList = useMemo(() => {
    if (!patients) return [];
    return Object.values(patients).filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (loading) return <div className="h-screen flex items-center justify-center font-mono italic text-slate-400">SYSTEM INITIALIZING...</div>;

  return (
    <div className={`flex h-screen transition-colors duration-500 ${activePatient?.status === "Critical" ? "bg-red-50" : "bg-slate-100"}`}>
      {/* Sidebar Area */}
      <div className="flex flex-col w-80 bg-white border-r border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded">
            {Object.keys(patients || {}).length} PATIENTS
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="m-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-100"
        >
          + ADMIT NEW PATIENT
        </button>
        <Sidebar
          patients={filteredPatientsList}
          activeId={activeId}
          onSelect={setActiveId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activePatient ? (
          <div className="max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-black text-slate-900">
                  {activePatient.firstName} {activePatient.lastName}
                </h1>
                <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">ID: {activeId}</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={downloadPatientReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs shadow-sm">
                    📥 DOWNLOAD REPORT
                  </button>
                  <button onClick={() => removePatient(activeId)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-xs shadow-sm">
                    ⚠️ DISCHARGE
                  </button>
                </div>
              </div>

              <div className={`px-6 py-2 rounded-full border-2 font-black ${activePatient.status === "Critical" ? "bg-red-600 border-red-700 text-white animate-pulse" : "bg-white border-slate-200 text-slate-400"}`}>
                {activePatient.status.toUpperCase()}
              </div>
            </header>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <VitalsCard label="Heart Rate" value={activePatient.heartRate} unit="bpm" icon="💓" />
              <VitalsCard label="BP" value={activePatient.bloodPressure} unit="mmHg" icon="🩺" />
              <VitalsCard label="Age" value={activePatient.age} unit="yrs" icon="👤" />
            </div>

            {/* ECG Monitor Section */}
            <div className={`bg-black rounded-3xl p-2 shadow-2xl border-4 transition-colors ${activePatient.status === "Critical" ? "border-red-500" : "border-slate-800"}`}>
              <div className="flex h-64">
                <div className="flex-1 relative overflow-hidden bg-slate-950 rounded-l-2xl">
                  <svg viewBox="0 0 1000 200" className="w-full h-full p-4">
                    <path
                      d={`M ${activePatient.waveData.map((v, i) => `${(i / 79) * 1000},${v}`).join(" L ")}`}
                      fill="none"
                      stroke={activePatient.status === "Critical" ? "#ff4444" : "#00ffaa"}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="w-48 bg-slate-900 p-6 flex flex-col justify-center border-l border-slate-800">
                  <p className="text-emerald-500 font-mono text-[10px] font-bold tracking-widest uppercase">Live HR</p>
                  <p className={`text-6xl font-mono font-black ${activePatient.status === "Critical" ? "text-red-500" : "text-emerald-400"}`}>
                    {Math.round(activePatient.heartRate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Observations Section */}
            <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">📝 Nursing Observations</h3>
                <button
                  onClick={() => handleNoteChange(activeId, tempNote)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-100"
                >
                  Save to Record
                </button>
              </div>
              <textarea
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 resize-none"
                placeholder="Type clinical observations here..."
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 font-bold italic">SELECT A PATIENT TO VIEW MONITOR</div>
        )}
      </main>

      {/* --- ADMISSION FORM MODAL --- */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-[2rem] w-[400px] shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Admit New Patient</h2>
            <form onSubmit={handleAdmit} className="space-y-4">
              <input
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <input
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                placeholder="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <input
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                placeholder="Age"
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100">
                  CONFIRM ADMISSION
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 rounded-xl transition-all">
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}