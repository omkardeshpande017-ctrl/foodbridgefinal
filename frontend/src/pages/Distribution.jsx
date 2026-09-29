import { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import {
  Truck,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function Distribution() {
  const [items, setItems] = useState([
    {
      id: 1,
      name: 'Rice & Dal',
      people: 160,
      status: 'Packed',
    },
    {
      id: 2,
      name: 'Bakery Packs',
      people: 90,
      status: 'Distributed',
    },
    {
      id: 3,
      name: 'Vegetable Boxes',
      people: 240,
      status: 'Ready',
    },
  ]);

  return (
    <Layout>
      <PageHeader
        title="Distribution"
        subtitle="Track how accepted food moves from pickup to community distribution."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          ['Ready', '18'],
          ['In distribution', '7'],
          ['Completed', '42'],
        ].map((x) => (
          <div
            className="card p-5"
            key={x[0]}
          >
            <p className="text-sm text-slate-500">
              {x[0]}
            </p>

            <p className="text-3xl font-black text-green-800 mt-2">
              {x[1]}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">
                Donation
              </th>

              <th className="text-left p-4">
                People served
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-left p-4">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr
                className="border-t"
                key={x.id}
              >
                <td className="p-4 font-bold">
                  {x.name}
                </td>

                <td className="p-4">
                  {x.people}
                </td>

                <td className="p-4">
                  <span className="status status-delivered">
                    {x.status}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    className="btn btn-secondary text-xs"
                    onClick={() =>
                      setItems(
                        items.map((i) =>
                          i.id === x.id
                            ? {
                                ...i,
                                status: 'Distributed',
                              }
                            : i
                        )
                      )
                    }
                  >
                    <CheckCircle2 size={15} />
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}