export interface User {
  id: string;
  email: string;
  name: string;
  skillLevel: number; // 1-10
  avatarUrl?: string;
}

export type ClubRole = 'admin' | 'member';

export interface ClubMember {
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: string;
  matchesPlayed: number;
  matchesWon: number;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  memberCount: number;
  bannerUrl?: string;
  announcements: { 
    id: string; 
    type: 'info' | 'alert' | 'success'; 
    content: string; 
    date: string; 
  }[];
}

export interface Session {
  id: string;
  clubId: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  courtNumber: string;
  maxPlayers: number;
  registeredPlayerIds: string[];
  status: 'OPEN' | 'FULL' | 'COMPLETED';
  price?: number;
}

export interface Match {
  id: string;
  sessionId: string;
  teamA: string[]; // User IDs
  teamB: string[]; // User IDs
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B';
  timestamp: string;
}

// Helper type for UI
export interface PlayerWithRole extends User {
  role?: ClubRole;
  isCurrentUser?: boolean;
}