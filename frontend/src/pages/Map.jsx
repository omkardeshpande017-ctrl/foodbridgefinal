import { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import {
  MapPin,
  Route,
  Navigation,
  Clock,
  Zap,
  Layers,
} from 'lucide-react';

export default function Map() {
  const [optimized, setOptimized] = useState(false);

  return (
    <Layout>
      <PageHeader
        title="Map & Route"
        subtitle="Donor, NGO and volunteer locations with route-ready delivery planning."
        action={
          <button
            className="btn btn-primary"
            onClick={() => setOptimized(!optimized)}
          >
            <Zap size={17} />
            {optimized
              ? 'Route Optimized'
              : 'Optimize Route'}
          </button>
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="h-[520px] relative grid-bg bg-[#e9f6ee]">
            <div className="absolute inset-8 border-2 border-dashed border-green-300 rounded-[2rem]" />

            <div className="absolute left-[22%] top-[28%] flex flex-col items-center">
              <MapPin
                className="text-red-600"
                fill="currentColor"
                size={34}
              />
              <b className="bg-white px-2 py-1 rounded shadow text-xs">
                Donor
              </b>
            </div>

            <div className="absolute left-[65%] top-[58%] flex flex-col items-center">
              <MapPin
                className="text-blue-600"
                fill="currentColor"
                size={34}
              />
              <b className="bg-white px-2 py-1 rounded shadow text-xs">
                NGO
              </b>
            </div>

            <div className="absolute left-[46%] top-[42%] flex flex-col items-center">
              <Navigation
                className="text-green-700"
                fill="currentColor"
                size={30}
              />
              <b className="bg-white px-2 py-1 rounded shadow text-xs">
                Volunteer
              </b>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 220 160 Q 390 280 520 300 Q 650 330 780 420"
                fill="none"
                stroke="#15803d"
                strokeWidth="5"
                strokeDasharray={
                  optimized ? '0 0' : '12 12'
                }
              />
            </svg>

            <div className="absolute bottom-5 left-5 right-5 card p-4 flex flex-wrap gap-5 text-sm">
              <span className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                Donor
              </span>

              <span className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                NGO
              </span>

              <span className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-full bg-green-700" />
                Volunteer
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-black flex gap-2 items-center">
              <Route className="text-green-600" />
              Route summary
            </h2>

            <div className="grid gap-4 mt-5">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Distance
                </span>
                <b>
                  {optimized ? '8.6' : '11.2'} km
                </b>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Estimated time
                </span>
                <b>
                  {optimized ? '22' : '31'} min
                </b>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Stops
                </span>
                <b>3</b>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-black flex gap-2 items-center">
              <Layers className="text-green-600" />
              Heat map
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Surplus and demand zones shown as a mock map when no
              Google Maps API key is configured.
            </p>

            <div className="grid grid-cols-4 gap-2 mt-5">
              {Array.from(
                { length: 24 },
                (_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded"
                    style={{
                      background: `rgba(22,163,74,${
                        0.12 + (i % 6) * 0.1
                      })`,
                    }}
                  />
                )
              )}
            </div>

            <div className="flex gap-4 text-xs mt-3 text-slate-500">
              <span>Low demand</span>
              <span>High demand</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between">
              <span className="flex gap-2 items-center">
                <Clock size={17} />
                ETA
              </span>

              <b className="text-green-700">
                {optimized ? '22' : '31'} min
              </b>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}