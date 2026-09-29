import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import {
  TrendChart,
  CategoryChart,
  StatusChart,
} from '../components/Charts';
import {
  Utensils,
  Users,
  Leaf,
  Truck,
  BarChart3,
} from 'lucide-react';
import { api } from '../services/api';
import { mock } from '../services/mock';

export default function Analytics() {
  const [o, setO] = useState(mock.overview());
  const [period, setPeriod] = useState('Weekly');

  useEffect(() => {
    api.overview()
      .then(setO)
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Measure food rescue, demand, distribution efficiency and environmental impact."
        action={
          <select
            className="input w-36"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Food Rescued"
          value="18.6 t"
          icon={Utensils}
        />

        <StatCard
          label="Meals Served"
          value="37.2K"
          icon={Users}
        />

        <StatCard
          label="CO₂ Reduced"
          value="18.6 t"
          icon={Leaf}
        />

        <StatCard
          label="Delivery Efficiency"
          value="86%"
          icon={Truck}
        />

        <StatCard
          label="Active Network"
          value="1,248"
          icon={BarChart3}
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-6 mt-6">
        <div className="card p-5 xl:col-span-2">
          <h2 className="font-black">
            Food rescued vs demand
          </h2>

          <p className="text-sm text-slate-500 mb-3">
            {period} network trend
          </p>

          <TrendChart data={o.trend} />
        </div>

        <div className="card p-5">
          <h2 className="font-black">
            Food by category
          </h2>

          <CategoryChart data={o.byCategory} />
        </div>

        <div className="card p-5">
          <h2 className="font-black">
            Donation status
          </h2>

          <StatusChart data={o.byStatus} />
        </div>

        <div className="card p-5">
          <h2 className="font-black">
            Daily operational indicators
          </h2>

          <div className="grid gap-4 mt-5">
            {[
              ['Matching rate', '91%'],
              ['On-time pickup', '88%'],
              ['Distribution completion', '86%'],
              ['Food safety confirmations', '97%'],
            ].map((x) => (
              <div key={x[0]}>
                <div className="flex justify-between text-sm font-bold">
                  <span>{x[0]}</span>
                  <span>{x[1]}</span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full mt-2">
                  <div
                    className="h-2 bg-green-600 rounded-full"
                    style={{ width: x[1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-black">
            Filters
          </h2>

          <div className="grid md:grid-cols-3 gap-3 mt-5">
            <select className="input">
              <option>All cities</option>
              <option>Pune</option>
              <option>Mumbai</option>
              <option>Nashik</option>
            </select>

            <select className="input">
              <option>All categories</option>
              <option>Cooked Meals</option>
              <option>Bakery</option>
              <option>Vegetables</option>
            </select>

            <input
              className="input"
              type="date"
            />
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Charts use realistic demo/seed data until connected
            to live production data.
          </p>
        </div>
      </div>
    </Layout>
  );
}