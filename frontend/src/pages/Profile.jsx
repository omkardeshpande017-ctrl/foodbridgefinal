import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import {
  api,
  session,
} from '../services/api';

export default function Profile() {
  const s = session();

  const [f, setF] = useState({
    name: s?.user?.name || '',
    phone: '',
    location: s?.user?.location || '',
    organization:
      s?.user?.organization || '',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.me()
      .then((u) =>
        setF((x) => ({
          ...x,
          ...u,
        }))
      )
      .catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();

    try {
      await api.updateMe(f);
    } catch {}

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  return (
    <Layout>
      <PageHeader
        title="Profile"
        subtitle="Manage your FoodBridge account information."
      />

      <form
        onSubmit={save}
        className="card p-6 max-w-2xl grid gap-4"
      >
        <label className="text-sm font-bold">
          Name

          <input
            className="input mt-1"
            value={f.name}
            onChange={(e) =>
              setF({
                ...f,
                name: e.target.value,
              })
            }
          />
        </label>

        <label className="text-sm font-bold">
          Organization

          <input
            className="input mt-1"
            value={f.organization}
            onChange={(e) =>
              setF({
                ...f,
                organization: e.target.value,
              })
            }
          />
        </label>

        <label className="text-sm font-bold">
          Phone

          <input
            className="input mt-1"
            value={f.phone || ''}
            onChange={(e) =>
              setF({
                ...f,
                phone: e.target.value,
              })
            }
          />
        </label>

        <label className="text-sm font-bold">
          Location

          <input
            className="input mt-1"
            value={f.location || ''}
            onChange={(e) =>
              setF({
                ...f,
                location: e.target.value,
              })
            }
          />
        </label>

        <div>
          <button className="btn btn-primary">
            Save profile
          </button>

          {saved && (
            <span className="text-green-700 font-bold text-sm ml-3">
              Saved
            </span>
          )}
        </div>
      </form>
    </Layout>
  );
}