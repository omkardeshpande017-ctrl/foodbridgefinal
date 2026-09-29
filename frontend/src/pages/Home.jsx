import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  HeartHandshake,
  Leaf,
  Route,
  ShieldCheck,
  Truck,
  Users,
  Utensils,
  Globe2,
} from 'lucide-react';
import { TrendChart } from '../components/Charts';

const trend = [
  { name: 'Jan', food: 320, demand: 280 },
  { name: 'Feb', food: 410, demand: 350 },
  { name: 'Mar', food: 520, demand: 470 },
  { name: 'Apr', food: 680, demand: 610 },
  { name: 'May', food: 820, demand: 760 },
  { name: 'Jun', food: 940, demand: 880 },
];

export default function Home() {
  return (
    <>
      <section className="grid-bg">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 rounded-full px-3 py-1 text-sm font-bold">
              <Leaf size={16} />
              Sustainable food distribution
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mt-5 leading-[.98]">
              Turn Surplus Food Into{' '}
              <span className="text-green-700">
                Meaningful Impact
              </span>
            </h1>

            <p className="text-lg text-slate-600 mt-6 max-w-xl">
              Connect food donors with NGOs and volunteers to reduce
              food waste and deliver surplus food to people who need it.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/donate"
                className="btn btn-primary"
              >
                Donate Food
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/dashboard"
                className="btn btn-secondary"
              >
                Explore Platform
              </Link>
            </div>

            <div className="flex gap-6 mt-8 text-sm font-bold text-slate-600">
              <span className="flex gap-2 items-center">
                <ShieldCheck
                  size={18}
                  className="text-green-600"
                />
                Verified partners
              </span>

              <span className="flex gap-2 items-center">
                <Globe2
                  size={18}
                  className="text-green-600"
                />
                Impact analytics
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="gradient-green rounded-[2rem] p-8 text-white shadow-soft">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-100">
                    Today’s network
                  </p>

                  <p className="text-4xl font-black mt-2">
                    2,480 kg
                  </p>

                  <p className="text-green-100 mt-1">
                    surplus food matched
                  </p>
                </div>

                <HeartHandshake size={48} />
              </div>

              <div className="bg-white/10 rounded-2xl p-5 mt-8">
                <div className="flex justify-between">
                  <span>Distribution efficiency</span>
                  <b>86%</b>
                </div>

                <div className="h-3 bg-white/20 rounded-full mt-3">
                  <div
                    className="h-3 bg-white rounded-full"
                    style={{ width: '86%' }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                  <div>
                    <b className="text-2xl">124</b>
                    <p className="text-xs text-green-100">
                      Donors
                    </p>
                  </div>

                  <div>
                    <b className="text-2xl">48</b>
                    <p className="text-xs text-green-100">
                      NGOs
                    </p>
                  </div>

                  <div>
                    <b className="text-2xl">212</b>
                    <p className="text-xs text-green-100">
                      Volunteers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 card p-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-green-100 rounded-xl grid place-items-center text-green-700">
                  <Utensils />
                </div>

                <div>
                  <b>3,420 meals</b>
                  <p className="text-xs text-slate-500">
                    served this week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            ['Food Donated', '18,640 kg'],
            ['Meals Served', '37,280'],
            ['Active Donors', '1,248'],
            ['NGOs Connected', '186'],
            ['Food Saved', '18.6 tons'],
            ['CO₂ Reduction', '18.6 tons'],
          ].map((x) => (
            <div
              className="card p-5"
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
      </section>

      <section
        id="how"
        className="bg-white border-y border-green-100"
      >
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-green-700 font-black uppercase tracking-widest text-xs">
              How it works
            </p>

            <h2 className="text-4xl font-black mt-2">
              From surplus to service in four steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5 mt-10">
            {[
              [
                '1',
                'Donor posts surplus food',
                Utensils,
              ],
              [
                '2',
                'NGO accepts donation',
                HeartHandshake,
              ],
              [
                '3',
                'Volunteer picks it up',
                Truck,
              ],
              [
                '4',
                'Food reaches communities',
                Users,
              ],
            ].map(([n, t, I]) => (
              <div
                className="card p-6"
                key={n}
              >
                <div className="flex justify-between">
                  <span className="w-10 h-10 rounded-full gradient-green text-white grid place-items-center font-black">
                    {n}
                  </span>

                  <I className="text-green-600" />
                </div>

                <h3 className="font-black text-lg mt-6">
                  {t}
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Every handoff is tracked for visibility, safety
                  and impact.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="impact"
        className="max-w-7xl mx-auto px-4 py-16"
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-green-700 font-black uppercase tracking-widest text-xs">
              Network impact
            </p>

            <h2 className="text-4xl font-black mt-2">
              Data that turns food rescue into measurable change.
            </h2>

            <p className="text-slate-600 mt-4">
              Track donation volumes, demand, distribution
              efficiency and carbon reduction across the network.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="card p-5">
                <BarChart3 className="text-green-600" />

                <b className="block mt-3">
                  Analytics
                </b>

                <p className="text-sm text-slate-500 mt-1">
                  Daily, weekly and monthly views.
                </p>
              </div>

              <div className="card p-5">
                <BrainCircuit className="text-green-600" />

                <b className="block mt-3">
                  AI Insights
                </b>

                <p className="text-sm text-slate-500 mt-1">
                  Demo forecasts and surplus signals.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex justify-between items-center">
              <div>
                <b>Food rescued vs demand</b>

                <p className="text-sm text-slate-500">
                  Illustrative network trend
                </p>
              </div>

              <Route className="text-green-600" />
            </div>

            <TrendChart data={trend} />
          </div>
        </div>
      </section>

      <footer
        id="about"
        className="bg-slate-950 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <b className="text-xl">
              FoodBridge
            </b>

            <p className="text-slate-400 mt-3 text-sm">
              A food donation coordination and analytics platform.
            </p>
          </div>

          <div>
            <b>Platform</b>

            <p className="text-slate-400 text-sm mt-3">
              Donations · Matching · Routes · Analytics
            </p>
          </div>

          <div>
            <b>Partners</b>

            <p className="text-slate-400 text-sm mt-3">
              Donors · NGOs · Volunteers · Government
            </p>
          </div>

          <div>
            <b>Get started</b>

            <div className="mt-3">
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}