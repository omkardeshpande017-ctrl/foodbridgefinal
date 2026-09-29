import { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState(false);

  return (
    <Layout>
      <PageHeader
        title="Settings"
        subtitle="Platform preferences and configuration."
      />

      <div className="max-w-3xl grid gap-5">
        <div className="card p-6">
          <h2 className="font-black">
            Notifications
          </h2>

          {[
            [
              'Donation accepted',
              'Notify when a donation is accepted.',
            ],
            [
              'Pickup updates',
              'Receive volunteer status updates.',
            ],
            [
              'Weekly impact summary',
              'Receive a weekly analytics summary.',
            ],
          ].map((x) => (
            <label
              className="flex items-center justify-between py-4 border-b last:border-0"
              key={x[0]}
            >
              <div>
                <b className="text-sm">
                  {x[0]}
                </b>

                <p className="text-xs text-slate-500 mt-1">
                  {x[1]}
                </p>
              </div>

              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-green-600"
              />
            </label>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="font-black">
            Appearance
          </h2>

          <label className="flex items-center justify-between mt-5">
            <span className="text-sm font-bold">
              Dark mode
            </span>

            <input
              type="checkbox"
              checked={dark}
              onChange={(e) =>
                setDark(e.target.checked)
              }
              className="w-5 h-5 accent-green-600"
            />
          </label>

          <p className="text-xs text-slate-500 mt-2">
            Optional interface preference. The core FoodBridge
            theme remains sustainability-focused.
          </p>
        </div>

        <button
          className="btn btn-primary w-fit"
          onClick={() => {
            setToast(true);
            setTimeout(() => setToast(false), 1500);
          }}
        >
          Save settings
        </button>

        {toast && (
          <p className="text-sm font-bold text-green-700">
            Settings saved.
          </p>
        )}
      </div>
    </Layout>
  );
}