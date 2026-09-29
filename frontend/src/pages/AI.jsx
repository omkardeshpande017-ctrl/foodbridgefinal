import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { MiniLine } from '../components/Charts';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function AI() {
  const [data, setData] = useState({
    confidence: 0.86,

    insights: [
      {
        title: 'Demand rising',
        text: 'Meal demand is projected to rise 14% in the next 7 days.',
        severity: 'medium',
      },
      {
        title: 'Surplus detected',
        text: 'Cooked meals show the largest short-term surplus opportunity.',
        severity: 'high',
      },
      {
        title: 'NGO matching',
        text: 'Three nearby NGO profiles match the current donation category.',
        severity: 'low',
      },
    ],

    forecast: [
      { day: 'Mon', demand: 120 },
      { day: 'Tue', demand: 135 },
      { day: 'Wed', demand: 150 },
      { day: 'Thu', demand: 164 },
      { day: 'Fri', demand: 172 },
      { day: 'Sat', demand: 181 },
      { day: 'Sun', demand: 176 },
    ],
  });

  useEffect(() => {
    api.ai()
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <PageHeader
        title="AI Insights"
        subtitle="Decision-support signals for demand, surplus and partner matching."
      />

      <div className="card p-5 bg-gradient-to-r from-green-900 to-green-700 text-white">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center">
            <BrainCircuit />
          </div>

          <div>
            <p className="text-green-200 text-xs font-black uppercase tracking-widest">
              Demo / Mock AI
            </p>

            <h2 className="text-2xl font-black">
              Predictive food rescue intelligence
            </h2>

            <p className="text-green-100 text-sm mt-1">
              Confidence score:{' '}
              {Math.round(data.confidence * 100)}% · Replace with a
              trained model/API for production.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        {data.insights.map((x) => (
          <div
            key={x.title}
            className="card p-6"
          >
            <div className="flex justify-between">
              <Sparkles className="text-green-600" />

              {x.severity === 'high' ? (
                <AlertTriangle className="text-amber-500" />
              ) : (
                <CheckCircle2 className="text-green-600" />
              )}
            </div>

            <h3 className="font-black mt-5">
              {x.title}
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              {x.text}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="font-black">
            7-day demand forecast
          </h2>

          <MiniLine data={data.forecast} />
        </div>

        <div className="card p-5">
          <h2 className="font-black">
            Recommended actions
          </h2>

          <ol className="space-y-4 mt-5 text-sm">
            {[
              'Prioritize cooked-meal donations for nearby high-demand NGOs.',
              'Pre-position volunteers before the weekend demand peak.',
              'Flag short-expiry food for immediate matching.',
              'Review surplus heat-map areas before assigning routes.',
            ].map((x, i) => (
              <li
                key={x}
                className="flex gap-3"
              >
                <b className="w-7 h-7 rounded-full bg-green-100 text-green-800 grid place-items-center shrink-0">
                  {i + 1}
                </b>

                <span>{x}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Layout>
  );
}