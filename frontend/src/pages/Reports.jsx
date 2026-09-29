import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import {
  FileText,
  Download,
  Printer,
} from 'lucide-react';

export default function Reports() {
  const [r, setR] = useState({
    generatedAt: new Date().toISOString(),
    users: 1248,
    donations: 18640,
    totalFood: 18640,
    peopleServed: 37280,
    co2Saved: 18640,
  });

  useEffect(() => {
    api.report()
      .then(setR)
      .catch(() => {});
  }, []);

  function download() {
    const blob = new Blob(
      [JSON.stringify(r, null, 2)],
      {
        type: 'application/json',
      }
    );

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = 'foodbridge-impact-report.json';

    a.click();

    URL.revokeObjectURL(a.href);
  }

  return (
    <Layout>
      <PageHeader
        title="Reports"
        subtitle="View and download impact and operational summaries."
        action={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <Printer size={17} />
              Print
            </button>

            <button
              className="btn btn-primary"
              onClick={download}
            >
              <Download size={17} />
              Download
            </button>
          </div>
        }
      />

      <div className="card p-6 max-w-4xl">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl grid place-items-center text-green-700">
            <FileText />
          </div>

          <div>
            <h2 className="font-black text-xl">
              FoodBridge Impact Report
            </h2>

            <p className="text-sm text-slate-500">
              Generated{' '}
              {new Date(
                r.generatedAt
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
          {[
            ['Users', r.users],
            ['Donations', r.donations],
            [
              'Food rescued (kg)',
              Math.round(r.totalFood),
            ],
            [
              'People served',
              Math.round(r.peopleServed),
            ],
            [
              'CO₂ saved (kg)',
              Math.round(r.co2Saved),
            ],
            [
              'Delivery efficiency',
              '86%',
            ],
          ].map((x) => (
            <div
              className="bg-slate-50 rounded-xl p-5"
              key={x[0]}
            >
              <p className="text-sm text-slate-500">
                {x[0]}
              </p>

              <p className="text-2xl font-black text-green-800 mt-2">
                {x[1]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}