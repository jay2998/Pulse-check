// components/VitalsCard.jsx
export default function VitalsCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xl md:text-2xl mb-2">{icon}</div>
      <p className="text-[10px] md:text-sm text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="flex items-baseline gap-1 mt-1 md:mt-2">
        <span className="text-2xl md:text-3xl font-bold text-slate-800">{value}</span>
        <span className="text-slate-400 text-xs md:text-sm">{unit}</span>
      </div>
    </div>
  );
}