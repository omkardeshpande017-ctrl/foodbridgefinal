import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

export default function Requests() {
  return (
    <Layout>
      <PageHeader
        title="My Requests"
        subtitle="Track donation requests submitted to the NGO."
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">
                Request
              </th>
              <th className="p-4 text-left">
                Quantity
              </th>
              <th className="p-4 text-left">
                Status
              </th>
              <th className="p-4 text-left">
                Priority
              </th>
            </tr>
          </thead>

          <tbody>
            {[
              [
                'Cooked Meals',
                '80 kg',
                'Accepted',
                'High',
              ],
              [
                'Bakery',
                '45 kg',
                'Pending',
                'Medium',
              ],
              [
                'Vegetables',
                '120 kg',
                'Completed',
                'Low',
              ],
            ].map((x) => (
              <tr
                className="border-t"
                key={x[0]}
              >
                {x.map((v, i) => (
                  <td
                    className={`p-4 ${
                      i === 0 ? 'font-bold' : ''
                    }`}
                    key={i}
                  >
                    {i === 2 ? (
                      <span className="status status-accepted">
                        {v}
                      </span>
                    ) : (
                      v
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}