import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import DonationCard from '../components/DonationCard';
import { api } from '../services/api';
import { mock } from '../services/mock';
import {
  Search,
  Filter,
} from 'lucide-react';

export default function Donations({ nearby = false }) {
  const [ds, setDs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    try {
      const q = new URLSearchParams();

      if (search) {
        q.set('search', search);
      }

      if (status) {
        q.set('status', status);
      }

      setDs(
        await api.donations(`?${q}`)
      );
    } catch {
      setDs(
        mock
          .donations()
          .filter(
            (d) =>
              (!status || d.status === status) &&
              (!search ||
                d.foodName
                  .toLowerCase()
                  .includes(search.toLowerCase()))
          )
      );
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function accept(d) {
    try {
      await api.acceptDonation(d._id);
    } catch {}

    setDs((x) =>
      x.map((a) =>
        a._id === d._id
          ? {
              ...a,
              status: 'accepted',
            }
          : a
      )
    );
  }

  return (
    <Layout>
      <PageHeader
        title={
          nearby
            ? 'Nearby Donations'
            : 'My Donations'
        }
        subtitle={
          nearby
            ? 'Find available surplus food and accept a matching donation.'
            : 'Track every donation from posting to delivery.'
        }
      />

      <div className="card p-4 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-3 text-slate-400"
            size={18}
          />

          <input
            className="input pl-10"
            placeholder="Search food..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === 'Enter' && load()
            }
          />
        </div>

        <select
          className="input md:w-48"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option value="">
            All statuses
          </option>

          {[
            'available',
            'accepted',
            'picked_up',
            'in_transit',
            'delivered',
            'expired',
            'cancelled',
          ].map((x) => (
            <option key={x}>
              {x}
            </option>
          ))}
        </select>

        <button
          className="btn btn-secondary"
          onClick={load}
        >
          <Filter size={17} />
          Apply
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {ds.length ? (
          ds.map((d) => (
            <DonationCard
              key={d._id}
              d={d}
              onAccept={nearby ? accept : null}
            />
          ))
        ) : (
          <div className="card p-10 text-center lg:col-span-2">
            <p className="font-black">
              No donations found
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Try another filter or create a new donation.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}