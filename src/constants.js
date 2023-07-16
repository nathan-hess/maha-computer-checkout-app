export const PAGES = {
    home: '/',

    // Authentication
    login: '/login',
    password_reset: '/password-reset',

    // User management
    users: '/users',
    account_mgmt: '/account',
    register: '/register',
    user_modify: '/users/edit',

    // Computer checkout
    computer_list: '/computers',
    details: '/computers/details',
    checkout: '/computers/checkout',
    checkin: '/computers/checkin',
    extend_reservation: '/computers/extend',
    make_available: '/computers/reactivate',

    // Computer management
    computer_modify: '/computers/edit',

    // Administrator tools
    backup: '/backup',
};

export const REDIRECT = 'redirect';
export const NEW_COMPUTER_KEYWORD = 'new';

export const ROLES = {
    admin: 'admin',
    faculty: 'faculty',
    student: 'student',
    external: 'external',
};

export const STATUSES = {
    available: 'available',
    in_use: 'in_use',
    pending: 'pending',
    offline: 'offline',
    archived: 'archived',
};

// Maximum mumber of days for which a computer can be reserved
//   If you update this value, also be sure to edit `firestore.rules` so
//   that the maximum reservation length is enforced through database rules
export const MAX_RESERVE_DAYS = 14;
