import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  Utensils,
  Users,
  Leaf,
  ArrowRight,
  Truck,
  Activity,
  Clock,
} from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import DonationCard from '../components/DonationCard';
import { api, session } from '../services/api';
import { mock } from '../services/mock';

export default function Dashboard() {
  const s = session();
  const role = s?.user?.role || 'donor';

  const [summary, setSummary] = useState(
    mock.summary()
  );

  const [ds, setDs] = useState([]);

  useEffect(() => {
    api.summary()
      .then(setSummary)
      .catch(() => {});

    api.donations()
      .then(setDs)
      .catch(() => setDs(mock.donations()));
  }, []);

  return (
    <Layout>
      <PageHeader
        title={`Good to see you, ${s?.user?.name || 'there'}`}
        subtitle={`Your ${role} workspace is ready.`}
        action={
          <Link
            to={
              role === 'donor'
                ? '/donate'
                : role === 'ngo'
                  ? '/nearby'
                  : role === 'volunteer'
                    ? '/tasks'
                    : '/analytics'
            }
            className="btn btn-primary"
          >
            {role === 'donor'
              ? 'Donate Food'
              : role === 'ngo'
                ? 'Find Donations'
                : role === 'volunteer'
                  ? 'View Tasks'
                  : 'Open Analytics'}

            <ArrowRight size={17} />
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Food Donated"
          value={`${summary.totalFood} kg`}
          icon={Utensils}
          sub="network total"
        />

        <StatCard
          label="Active"
          value={summary.active}
          icon={Activity}
        />

        <StatCard
          label="Completed"
          value={summary.completed}
          icon={PackageCheck}
        />

        <StatCard
          label="People Served"
          value={summary.peopleServed}
          icon={Users}
        />

        <StatCard
          label="CO₂ Saved"
          value={`${summary.co2Saved} kg`}
          icon={Leaf}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-black text-lg">
                Recent donations
              </h2>

              <p className="text-sm text-slate-500">
                Live network activity
              </p>
            </div>

            <Link
              to="/donations"
              className="text-sm font-bold text-green-700"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4">
            {ds.slice(0, 3).map((d) => (
              <DonationCard
                key={d._id}
                d={d}
                showActions={false}
              />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Clock className="text-green-600" />

            <h2 className="font-black">
              Quick actions
            </h2>
          </div>

          <div className="grid gap-3 mt-5">
            {[
              [
                role === 'donor'
                  ? '/donate'
                  : '/nearby',
                'Food donation',
              ],
              ['/map', 'Map & route'],
              ['/analytics', 'Analytics'],
              ['/ai', 'AI insights'],
              ['/notifications', 'Notifications'],
            ].map(([p, t]) => (
              <Link
                key={p}
                to={p}
                className="p-4 rounded-xl bg-slate-50 hover:bg-green-50 font-bold text-sm flex justify-between"
              >
                {t}

                <ArrowRight size={17} />
              </Link>
            ))}
          </div>

          <div className="mt-5 p-4 bg-green-50 rounded-xl">
            <Truck className="text-green-700" />

            <p className="font-bold mt-2">
              Distribution efficiency
            </p>

            <p className="text-3xl font-black text-green-800 mt-1">
              {summary.efficiency}%
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}