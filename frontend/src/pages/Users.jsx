import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { mock } from '../services/mock';

export default function Users() {
  const [users, setUsers] = useState([
    {
      _id: '1',
      name: 'Aarav Donor',
      email: 'donor@foodbridge.app',
      role: 'donor',
      status: 'active',
    },
    {
      _id: '2',
      name: 'Sahyog NGO',
      email: 'ngo@foodbridge.app',
      role: 'ngo',
      status: 'active',
    },
    {
      _id: '3',
      name: 'Rohan Volunteer',
      email: 'volunteer@foodbridge.app',
      role: 'volunteer',
      status: 'active',
    },
    {
      _id: '4',
      name: 'FoodBridge Admin',
      email: 'admin@foodbridge.app',
      role: 'admin',
      status: 'active',
    },
  ]);

  useEffect(() => {
    api.users()
      .then(setUsers)
      .catch(() => {});
  }, []);

  async function toggle(u) {
    const status =
      u.status === 'active'
        ? 'suspended'
        : 'active';

    try {
      await api.userStatus(
        u._id,
        status
      );
    } catch {}

    setUsers(
      users.map((x) =>
        x._id === u._id
          ? {
              ...x,
              status,
            }
          : x
      )
    );
  }

  return (
    <Layout>
      <PageHeader
        title="User Management"
        subtitle="Monitor donors, NGOs, volunteers and administrators."
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">
                Name
              </th>
              <th className="p-4 text-left">
                Email
              </th>
              <th className="p-4 text-left">
                Role
              </th>
              <th className="p-4 text-left">
                Status
              </th>
              <th className="p-4 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                className="border-t"
                key={u._id}
              >
                <td className="p-4 font-bold">
                  {u.name}
                </td>

                <td className="p-4">
                  {u.email}
                </td>

                <td className="p-4 capitalize">
                  {u.role}
                </td>

                <td className="p-4">
                  <span
                    className={`status ${
                      u.status === 'active'
                        ? 'status-delivered'
                        : 'status-cancelled'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    disabled={u.role === 'admin'}
                    className="btn btn-secondary text-xs"
                    onClick={() => toggle(u)}
                  >
                    {u.status === 'active'
                      ? 'Suspend'
                      : 'Activate'}
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