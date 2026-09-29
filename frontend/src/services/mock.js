const donations = [
  {
    _id: 'm1',
    foodName: 'Fresh Cooked Rice & Dal',
    category: 'Cooked Meals',
    quantity: 80,
    unit: 'kg',
    pickupLocation: 'Kothrud, Pune',
    pickupDate: '2026-09-24',
    pickupTime: '13:00',
    status: 'available',
    peopleServed: 160,
    co2Saved: 80,
  },
  {
    _id: 'm2',
    foodName: 'Bread & Bakery Packs',
    category: 'Bakery',
    quantity: 45,
    unit: 'kg',
    pickupLocation: 'Shivajinagar, Pune',
    pickupDate: '2026-09-24',
    pickupTime: '16:00',
    status: 'accepted',
    peopleServed: 90,
    co2Saved: 45,
  },
  {
    _id: 'm3',
    foodName: 'Vegetable Boxes',
    category: 'Vegetables',
    quantity: 120,
    unit: 'kg',
    pickupLocation: 'Wakad, Pune',
    pickupDate: '2026-09-25',
    pickupTime: '10:00',
    status: 'delivered',
    peopleServed: 240,
    co2Saved: 120,
  },
];

export const mock = {
  login: (email, role) => ({
    token: 'mock-token',
    user: {
      id: 'mock',
      name:
        role === 'admin'
          ? 'FoodBridge Admin'
          : role === 'ngo'
            ? 'Sahyog NGO'
            : role === 'volunteer'
              ? 'Rohan Volunteer'
              : 'Aarav Donor',
      email,
      role,
      location: 'Pune',
    },
  }),

  donations: () =>
    JSON.parse(
      localStorage.getItem('fb_donations') || 'null'
    ) || donations,

  save: (d) =>
    localStorage.setItem(
      'fb_donations',
      JSON.stringify(d)
    ),

  summary: () => ({
    totalFood: 245,
    active: 2,
    completed: 1,
    peopleServed: 490,
    co2Saved: 245,
    efficiency: 33,
  }),

  overview: () => ({
    users: 4,
    donations: 3,

    byCategory: [
      {
        name: 'Cooked Meals',
        value: 80,
      },
      {
        name: 'Bakery',
        value: 45,
      },
      {
        name: 'Vegetables',
        value: 120,
      },
    ],

    byStatus: [
      {
        name: 'available',
        value: 1,
      },
      {
        name: 'accepted',
        value: 1,
      },
      {
        name: 'delivered',
        value: 1,
      },
    ],

    trend: [
      {
        name: 'Mon',
        food: 120,
        demand: 100,
      },
      {
        name: 'Tue',
        food: 180,
        demand: 145,
      },
      {
        name: 'Wed',
        food: 150,
        demand: 165,
      },
      {
        name: 'Thu',
        food: 220,
        demand: 190,
      },
      {
        name: 'Fri',
        food: 240,
        demand: 210,
      },
      {
        name: 'Sat',
        food: 280,
        demand: 250,
      },
      {
        name: 'Sun',
        food: 200,
        demand: 230,
      },
    ],
  }),

  notifications: () => [
    {
      id: '1',
      title: 'New donation nearby',
      message:
        'Fresh cooked meals are available in Kothrud.',
      read: false,
      type: 'info',
    },
    {
      id: '2',
      title: 'Welcome to FoodBridge',
      message: 'Your dashboard is ready.',
      read: true,
      type: 'success',
    },
  ],
};