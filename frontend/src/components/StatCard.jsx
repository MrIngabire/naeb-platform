// Accent must map to literal classes — v4's JIT scanner cannot generate
// classes from runtime strings like `bg-${accent}-50`.
const ACCENTS = {
  brand:   { bg: 'bg-brand-50',   text: 'text-brand-700' },
  green:   { bg: 'bg-green-50',   text: 'text-green-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700' },
};

export default function StatCard({ label, value, icon, accent = 'brand' }) {
  const a = ACCENTS[accent] ?? ACCENTS.brand;
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`text-3xl p-3 rounded-full ${a.bg} ${a.text}`}>{icon}</div>
      </div>
    </div>
  );
}