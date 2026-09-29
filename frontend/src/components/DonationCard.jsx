import {
  MapPin,
  Clock,
  Users,
  Leaf,
} from 'lucide-react';

export default function DonationCard({
  d,
  onAccept,
  onStatus,
  showActions = true,
}) {
  return (
    <div className="card p-5">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900">
            {d.foodName}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {d.category} · {d.quantity} {d.unit}
          </p>
        </div>

        <span className={`status status-${d.status}`}>
          {d.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mt-4 text-sm text-slate-600">
        <div className="flex gap-2">
          <MapPin size={16} className="text-green-600" />
          {d.pickupLocation || 'Location not set'}
        </div>

        <div className="flex gap-2">
          <Clock size={16} className="text-green-600" />
          {d.pickupDate || '—'} {d.pickupTime || ''}
        </div>

        <div className="flex gap-2">
          <Users size={16} className="text-green-600" />
          {d.peopleServed ||
            Math.round((d.quantity || 0) * 2)}{' '}
          people served
        </div>

        <div className="flex gap-2">
          <Leaf size={16} className="text-green-600" />
          {d.co2Saved || d.quantity || 0} kg CO₂ saved
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 mt-4">
          {onAccept && d.status === 'available' && (
            <button
              className="btn btn-primary text-sm"
              onClick={() => onAccept(d)}
            >
              Accept Donation
            </button>
          )}

          {onStatus && d.status !== 'delivered' && (
            <button
              className="btn btn-secondary text-sm"
              onClick={() => onStatus(d)}
            >
              {d.status === 'accepted'
                ? 'Mark Picked Up'
                : d.status === 'picked_up'
                  ? 'Start Delivery'
                  : 'Mark Delivered'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}