import { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import VitalsCard from "./components/VitalsCard";

export default function App() {
  const [patients, setPatients] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempNote, setTempNote] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", age: "", bloodPressure: "120/80",
  });

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
    if (!window.confirm("Discharge this patient?")) return;
    const next = { ...patients };
    delete next[id];
    setPatients(next);
    if (activeId === id) setActiveId(Object.keys(next)[0] || null);
    localStorage.setItem("hospital_records", JSON.stringify(next));
  };

  const handleAdmit = (e) => {
    e.preventDefault();
    const id = `pt-${Date.now()}`;
    const newPt = { ...formData, id, heartRate: 72, status: "Stable", waveData: new Array(80).fill(100), notes: "" };
    const updated = { ...patients, [id]: newPt };
    setPatients(updated);
    setActiveId(id);
    setShowForm(false);
    setFormData({ firstName: "", lastName: "", age: "", bloodPressure: "120/80" });
    localStorage.setItem("hospital_records", JSON.stringify(updated));
  };

  const downloadPatientReport = () => {
    const activePatient = patients[activeId];
    const reportContent = `PATIENT REPORT\nName: ${activePatient.firstName} ${activePatient.lastName}\nHR: ${activePatient.heartRate}\nNotes: ${tempNote}`;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${activePatient.lastName}.txt`;
    link.click();
  };

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
            acc[id] = { ...p, id, status: "Stable", waveData: new Array(80).fill(100), notes: "" };
            return acc;
          }, {});
          setPatients(init);
          setActiveId("pt-0");
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (patients && activeId) setTempNote(patients[activeId]?.notes || "");
  }, [activeId]);

  useEffect(() => {
    if (!patients) return;
    const timer = setInterval(() => {
      setPatients((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          const p = next[id];
          const drift = Math.floor(Math.random() * 3) - 1;
          const newHR = Math.max(50, Math.min(140, (p.heartRate || 72) + drift));
          const beatInterval = 60000 / newHR;
          const time = (Date.now() + parseInt(id.split("-")[1] || 0) * 100) % beatInterval;
          let wavePoint = 100;
          if (time < 30) wavePoint = 110;
          else if (time < 70) wavePoint = 20;
          else if (time < 100) wavePoint = 180;
          else wavePoint = 100 + Math.random() * 2;
          const newWave = [...(p.waveData || [])];
          newWave.push(wavePoint);
          next[id] = { ...p, heartRate: newHR, status: getPatientStatus(newHR), waveData: newWave.slice(-80) };
        });
        return next;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [patients ? Object.keys(patients).length : 0]);

  const activePatient = patients?.[activeId];
  const filteredPatientsList = useMemo(() => {
    if (!patients) return [];
    return Object.values(patients).filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (loading) return <div className="h-screen flex items-center justify-center font-mono italic text-slate-400">INITIALIZING...</div>;

  return (
    <div className={`flex h-screen overflow-hidden ${activePatient?.status === "Critical" ? "bg-red-50" : "bg-slate-100"}`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Drawer on Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded">
              {Object.keys(patients || {}).length} PATIENTS
            </span>
          </div>
          <button onClick={() => setShowForm(true)} className="m-4 py-3 bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-100">+ ADMIT PATIENT</button>
          <Sidebar patients={filteredPatientsList} activeId={activeId} onSelect={setActiveId} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navbar */}
        <header className="lg:hidden bg-white p-4 border-b flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold">MENU</button>
          <span className="font-bold text-slate-800 text-sm italic">VitalSync Dashboard</span>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activePatient ? (
            <div className="max-w-5xl mx-auto">
              <header className="flex flex-col md:flex-row md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black text-slate-900">{activePatient.firstName} {activePatient.lastName}</h1>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={downloadPatientReport} className="px-3 py-2 bg-white border text-[10px] font-bold rounded-lg">DOWNLOAD</button>
                    <button onClick={() => removePatient(activeId)} className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded-lg">DISCHARGE</button>
                  </div>
                </div>
                <div className={`self-start md:self-center px-6 py-2 rounded-full border-2 font-black ${activePatient.status === "Critical" ? "bg-red-600 text-white animate-pulse" : "bg-white text-slate-400"}`}>
                  {activePatient.status.toUpperCase()}
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <VitalsCard label="Heart Rate" value={activePatient.heartRate} unit="bpm" icon="💓" />
                <VitalsCard label="BP" value={activePatient.bloodPressure} unit="mmHg" icon="🩺" />
                <VitalsCard label="Age" value={activePatient.age} unit="yrs" icon="👤" />
              </div>

              {/* Responsive Monitor */}
              <div className={`bg-black rounded-3xl overflow-hidden border-4 ${activePatient.status === "Critical" ? "border-red-500" : "border-slate-800"}`}>
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 h-48 md:h-64 bg-slate-950 p-4">
                    <svg viewBox="0 0 1000 200" className="w-full h-full">
                      <path d={`M ${activePatient.waveData.map((v, i) => `${(i / 79) * 1000},${v}`).join(" L ")}`} fill="none" stroke={activePatient.status === "Critical" ? "#ff4444" : "#00ffaa"} strokeWidth="4" />
                    </svg>
                  </div>
                  <div className="bg-slate-900 p-4 md:w-48 flex md:flex-col justify-between items-center border-t md:border-t-0 md:border-l border-slate-800">
                    <span className="text-emerald-500 text-[10px] font-bold uppercase">Live HR</span>
                    <span className={`text-4xl md:text-6xl font-mono font-black ${activePatient.status === "Critical" ? "text-red-500" : "text-emerald-400"}`}>{Math.round(activePatient.heartRate)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white p-6 rounded-3xl border shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                  <h3 className="font-bold">Nursing Observations</h3>
                  <button onClick={() => handleNoteChange(activeId, tempNote)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Save to Record</button>
                </div>
                <textarea className="w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none text-sm" value={tempNote} onChange={(e) => setTempNote(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic">SELECT A PATIENT TO VIEW DATA</div>
          )}
        </div>
      </main>

      {/* Admission Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black mb-4">Admit New Patient</h2>
            <form onSubmit={handleAdmit} className="space-y-3">
              <input className="w-full bg-slate-50 border p-3 rounded-xl outline-none" placeholder="First Name" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              <input className="w-full bg-slate-50 border p-3 rounded-xl outline-none" placeholder="Last Name" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              <input className="w-full bg-slate-50 border p-3 rounded-xl outline-none" placeholder="Age" type="number" required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl">CONFIRM</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}