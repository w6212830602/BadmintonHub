import { Club, ClubMember, Match, Session, User } from '../types';

// --- Initial Data ---

const USERS: User[] = [
  { id: 'u1', name: 'Alex Chen', email: 'alex@demo.com', skillLevel: 7, avatarUrl: 'https://picsum.photos/id/64/150/150' },
  { id: 'u2', name: 'Sarah Jones', email: 'sarah@demo.com', skillLevel: 5, avatarUrl: 'https://picsum.photos/id/65/150/150' },
  { id: 'u3', name: 'Mike Ross', email: 'mike@demo.com', skillLevel: 8, avatarUrl: 'https://picsum.photos/id/91/150/150' },
  { id: 'u4', name: 'Jenny Kim', email: 'jenny@demo.com', skillLevel: 4, avatarUrl: 'https://picsum.photos/id/103/150/150' },
  { id: 'u5', name: 'David Lee', email: 'david@demo.com', skillLevel: 6, avatarUrl: 'https://picsum.photos/id/177/150/150' },
];

const CLUBS: Club[] = [
  {
    id: 'c1',
    name: 'Smash City Badminton',
    location: 'Downtown Sportsplex',
    description: 'Premier club for intermediate to advanced players.',
    memberCount: 5,
    bannerUrl: 'https://picsum.photos/id/192/800/400',
    announcements: [
      { id: 'a1', type: 'alert', content: 'Court 3 is closed for maintenance this week.', date: '2023-10-25' },
      { id: 'a2', type: 'success', content: 'Tournament winners announced!', date: '2023-10-20' }
    ]
  },
  {
    id: 'c2',
    name: 'Sunday Shuttlers',
    location: 'Community Center',
    description: 'Casual sunday games for everyone.',
    memberCount: 12,
    bannerUrl: 'https://picsum.photos/id/158/800/400',
    announcements: []
  }
];

const MEMBERS: ClubMember[] = [
  { clubId: 'c1', userId: 'u1', role: 'admin', joinedAt: '2023-01-01', matchesPlayed: 45, matchesWon: 30 },
  { clubId: 'c1', userId: 'u2', role: 'member', joinedAt: '2023-02-15', matchesPlayed: 20, matchesWon: 8 },
  { clubId: 'c1', userId: 'u3', role: 'member', joinedAt: '2023-03-10', matchesPlayed: 40, matchesWon: 35 },
  { clubId: 'c1', userId: 'u4', role: 'member', joinedAt: '2023-04-05', matchesPlayed: 10, matchesWon: 2 },
  { clubId: 'c1', userId: 'u5', role: 'member', joinedAt: '2023-05-20', matchesPlayed: 15, matchesWon: 7 },
  { clubId: 'c2', userId: 'u1', role: 'member', joinedAt: '2023-06-01', matchesPlayed: 5, matchesWon: 5 },
];

const SESSIONS: Session[] = [
  {
    id: 's1',
    clubId: 'c1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '19:00',
    endTime: '21:00',
    courtNumber: '1 & 2',
    maxPlayers: 8,
    registeredPlayerIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
    status: 'OPEN'
  },
  {
    id: 's2',
    clubId: 'c1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    startTime: '18:00',
    endTime: '20:00',
    courtNumber: '4',
    maxPlayers: 6,
    registeredPlayerIds: ['u1', 'u3', 'u5', 'u2'],
    status: 'COMPLETED'
  }
];

const MATCHES: Match[] = [
  {
    id: 'm1',
    sessionId: 's2',
    teamA: ['u1', 'u3'],
    teamB: ['u5', 'u2'],
    scoreA: 21,
    scoreB: 15,
    winner: 'A',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
   {
    id: 'm2',
    sessionId: 's2',
    teamA: ['u1', 'u2'],
    teamB: ['u3', 'u5'],
    scoreA: 18,
    scoreB: 21,
    winner: 'B',
    timestamp: new Date(Date.now() - 86000000).toISOString()
  }
];

// --- Simulation Helpers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Service ---

export const mockDb = {
  // Auth & User Management
  getAllUsers: async (): Promise<User[]> => {
    await delay(300);
    return [...USERS];
  },

  getCurrentUser: async (id?: string): Promise<User | null> => {
    await delay(300);
    if (!id) return null;
    return USERS.find(u => u.id === id) || null;
  },

  login: async (email: string): Promise<User> => {
    await delay(600);
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("User not found");
    return user;
  },

  createUser: async (data: { name: string; email: string; skillLevel: number }): Promise<User> => {
    await delay(800);
    const existing = USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) throw new Error("Email already registered");

    const newUser: User = {
      id: 'u' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      skillLevel: data.skillLevel,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.name}&background=random`
    };
    USERS.push(newUser);
    return newUser;
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(400);
    const index = USERS.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    
    const updatedUser = { ...USERS[index], ...data };
    USERS[index] = updatedUser;
    return updatedUser;
  },

  // Club Management
  getUserClubs: async (userId: string): Promise<Club[]> => {
    await delay(400);
    const membershipIds = MEMBERS.filter(m => m.userId === userId).map(m => m.clubId);
    return CLUBS.filter(c => membershipIds.includes(c.id));
  },

  getClubDetails: async (clubId: string): Promise<Club | undefined> => {
    await delay(300);
    return CLUBS.find(c => c.id === clubId);
  },

  createClub: async (data: Partial<Club>, userId: string): Promise<Club> => {
    await delay(600);
    const newClub: Club = {
      id: 'c' + Math.random().toString(36).substr(2, 9),
      name: data.name!,
      description: data.description!,
      location: data.location!,
      memberCount: 1,
      bannerUrl: data.bannerUrl || 'https://picsum.photos/seed/badminton/800/400',
      announcements: []
    };
    CLUBS.push(newClub);
    
    // Add creator as admin
    MEMBERS.push({
      clubId: newClub.id,
      userId: userId,
      role: 'admin',
      joinedAt: new Date().toISOString(),
      matchesPlayed: 0,
      matchesWon: 0
    });
    
    return newClub;
  },

  getClubMembers: async (clubId: string): Promise<(User & { role: 'admin' | 'member', stats: { played: number, won: number } })[]> => {
    await delay(500);
    const clubMembers = MEMBERS.filter(m => m.clubId === clubId);
    return clubMembers.map(member => {
      const user = USERS.find(u => u.id === member.userId)!;
      return {
        ...user,
        role: member.role,
        stats: { played: member.matchesPlayed, won: member.matchesWon }
      };
    }).sort((a, b) => (b.stats.won / (b.stats.played || 1)) - (a.stats.won / (a.stats.played || 1)));
  },

  inviteMember: async (clubId: string, email: string): Promise<{ success: boolean; message: string; user?: User }> => {
    await delay(600);
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        // Mocking an invite sent to an external email
        return { success: true, message: `Invitation sent to ${email}` };
    }

    const isMember = MEMBERS.some(m => m.clubId === clubId && m.userId === user.id);
    if (isMember) {
        throw new Error("User is already a member of this club");
    }

    // Auto-join for mock simplicity
    MEMBERS.push({
        clubId,
        userId: user.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
        matchesPlayed: 0,
        matchesWon: 0
    });

    return { success: true, message: `${user.name} added to club`, user };
  },

  kickMember: async (clubId: string, userId: string): Promise<void> => {
    await delay(400);
    const index = MEMBERS.findIndex(m => m.clubId === clubId && m.userId === userId);
    if (index !== -1) {
      MEMBERS.splice(index, 1);
    }
  },

  // Announcements
  addAnnouncement: async (clubId: string, type: 'info' | 'alert' | 'success', content: string): Promise<void> => {
    await delay(400);
    const club = CLUBS.find(c => c.id === clubId);
    if (club) {
        club.announcements.unshift({
            id: 'a' + Math.random().toString(36).substr(2, 9),
            type,
            content,
            date: new Date().toISOString().split('T')[0]
        });
    }
  },

  updateAnnouncement: async (clubId: string, announcementId: string, data: Partial<{type: 'info' | 'alert' | 'success', content: string}>): Promise<void> => {
    await delay(300);
    const club = CLUBS.find(c => c.id === clubId);
    if (club) {
        const ann = club.announcements.find(a => a.id === announcementId);
        if (ann) {
            if (data.type) ann.type = data.type;
            if (data.content) ann.content = data.content;
        }
    }
  },

  deleteAnnouncement: async (clubId: string, announcementId: string): Promise<void> => {
      await delay(300);
      const club = CLUBS.find(c => c.id === clubId);
      if (club) {
          club.announcements = club.announcements.filter(a => a.id !== announcementId);
      }
  },

  // Sessions
  getSessions: async (clubId: string): Promise<Session[]> => {
    await delay(400);
    return SESSIONS.filter(s => s.clubId === clubId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getUserSessions: async (userId: string): Promise<Session[]> => {
    await delay(300);
    return SESSIONS.filter(s => s.registeredPlayerIds.includes(userId)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getSessionDetails: async (sessionId: string): Promise<Session | undefined> => {
    await delay(300);
    return SESSIONS.find(s => s.id === sessionId);
  },

  getSessionPlayers: async (sessionId: string): Promise<User[]> => {
    await delay(400);
    const session = SESSIONS.find(s => s.id === sessionId);
    if (!session) return [];
    return USERS.filter(u => session.registeredPlayerIds.includes(u.id));
  },

  joinSession: async (sessionId: string, userId: string): Promise<Session> => {
    await delay(500);
    const session = SESSIONS.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");
    if (session.registeredPlayerIds.includes(userId)) return session;
    if (session.registeredPlayerIds.length >= session.maxPlayers) throw new Error("Session full");
    
    session.registeredPlayerIds.push(userId);
    if (session.registeredPlayerIds.length >= session.maxPlayers) session.status = 'FULL';
    return { ...session };
  },

  leaveSession: async (sessionId: string, userId: string): Promise<Session> => {
    await delay(500);
    const session = SESSIONS.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");
    
    // Check if locked (mock logic: if session is in the past)
    const sessionDate = new Date(session.date + 'T' + session.startTime);
    if (sessionDate.getTime() < Date.now()) throw new Error("Cannot leave past session");

    session.registeredPlayerIds = session.registeredPlayerIds.filter(id => id !== userId);
    if (session.status === 'FULL') session.status = 'OPEN';
    return { ...session };
  },

  createSession: async (clubId: string, data: Partial<Session>, recurrenceWeeks: number = 1): Promise<Session[]> => {
    await delay(600);
    const createdSessions: Session[] = [];
    const baseDate = new Date(data.date!);

    for (let i = 0; i < recurrenceWeeks; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + (i * 7));
        const dateString = currentDate.toISOString().split('T')[0];

        const newSession: Session = {
            id: 's' + Math.random().toString(36).substr(2, 9),
            clubId,
            date: dateString,
            startTime: data.startTime!,
            endTime: data.endTime!,
            courtNumber: data.courtNumber || 'TBD',
            maxPlayers: data.maxPlayers || 8,
            registeredPlayerIds: [],
            status: 'OPEN'
        };
        SESSIONS.push(newSession);
        createdSessions.push(newSession);
    }

    return createdSessions;
  },

  // Matches
  getSessionMatches: async (sessionId: string): Promise<Match[]> => {
    await delay(300);
    return MATCHES.filter(m => m.sessionId === sessionId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  recordMatch: async (matchData: Omit<Match, 'id' | 'timestamp'>): Promise<Match> => {
    await delay(500);
    const newMatch: Match = {
      ...matchData,
      id: 'm' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    MATCHES.push(newMatch);

    // Update stats for involved players
    const allPlayers = [...matchData.teamA, ...matchData.teamB];
    const winningTeam = matchData.winner === 'A' ? matchData.teamA : matchData.teamB;
    const session = SESSIONS.find(s => s.id === matchData.sessionId);

    if (session) {
      MEMBERS.forEach(m => {
        if (m.clubId === session.clubId && allPlayers.includes(m.userId)) {
          m.matchesPlayed += 1;
          if (winningTeam.includes(m.userId)) {
            m.matchesWon += 1;
          }
        }
      });
    }

    return newMatch;
  },

  getUserMatches: async (userId: string): Promise<Match[]> => {
    await delay(300);
    return MATCHES.filter(m => m.teamA.includes(userId) || m.teamB.includes(userId));
  }
};