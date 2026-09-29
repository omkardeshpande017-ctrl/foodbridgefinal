export default function PageHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-green-700">
          FoodBridge
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
          {title}
        </h1>

        {subtitle && (
          <p className="text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}