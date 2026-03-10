// Sidebar.jsx
export default function Sidebar({ patients, activeId, onSelect, searchTerm, setSearchTerm }) {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Patient Database</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-3 top-3.5 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {patients.length > 0 ? (
          patients.map((p) => (
            <button 
              key={p.id} 
              onClick={() => onSelect(p.id)}
              className={`w-full p-4 text-left rounded-xl transition-all border ${
                activeId === p.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold truncate text-sm">{p.firstName} {p.lastName}</span>
                {/* Visual alert dot in the sidebar for critical patients */}
                {p.status === "Critical" && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                )}
              </div>
              <div className={`text-xs mt-1 font-medium ${activeId === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                HR: {p.heartRate} bpm • {p.status}
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="text-3xl mb-2">👤</span>
            <p className="text-slate-400 text-sm italic">No patients found matching your search</p>
          </div>
        )}
      </div>
    </aside>
  );
}