export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-semibold">
            {label}
          </p>

          <p className="text-2xl font-black mt-2 text-slate-900">
            {value}
          </p>

          {sub && (
            <p className="text-xs text-green-700 font-bold mt-1">
              {sub}
            </p>
          )}
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 grid place-items-center">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}