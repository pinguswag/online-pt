export type UserRole = 'member' | 'coach';

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    code?: string; // Member code
    coachId?: string; // If member
    joinedDates?: string[]; // If needed
}

// Storage Keys
const USERS_KEY = 'opt_users';
const SESSION_KEY = 'opt_session';

export const auth = {
    getUsers: (): User[] => {
        if (typeof window === 'undefined') return [];
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    createUser: (user: Omit<User, 'id'>): User => {
        const users = auth.getUsers();
        // Check if username exists
        if (users.find(u => u.username === user.username)) {
            throw new Error('이미 존재하는 아이디입니다.');
        }

        // Generate Code for Members
        const code = user.role === 'member'
            ? Math.random().toString(36).substring(2, 8).toUpperCase()
            : undefined;

        const newUser = {
            ...user,
            id: Math.random().toString(36).substr(2, 9),
            code
        };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return newUser;
    },

    login: (username: string): User => {
        const users = auth.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    // Coach Specific
    linkMember: (coachId: string, memberCode: string) => {
        const users = auth.getUsers();
        const memberIndex = users.findIndex(u => u.code === memberCode && u.role === 'member');

        if (memberIndex === -1) {
            throw new Error('유효하지 않은 회원 코드입니다.');
        }

        if (users[memberIndex].coachId) {
            throw new Error('이미 담당 코치가 배정된 회원입니다.');
        }

        users[memberIndex].coachId = coachId;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return users[memberIndex];
    },

    getMembersByCoachId: (coachId: string): User[] => {
        const users = auth.getUsers();
        return users.filter(u => u.coachId === coachId);
    }
};
