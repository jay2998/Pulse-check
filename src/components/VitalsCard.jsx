// components/VitalsCard.jsx
export default function VitalsCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        <span className="text-slate-400 text-sm">{unit}</span>
      </div>
    </div>
  );
}