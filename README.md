<div align="center">

# 🏸 BadmintonHub

**A Mobile-First PWA for Modern Club Management & AI-Powered Coaching**

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

[View Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📖 Overview

**BadmintonHub** is a modern, mobile-first Progressive Web Application (PWA) designed to streamline badminton club operations. It empowers admins to manage sessions and membership effortlessly while providing players with rich statistical insights.

Unique to BadmintonHub is the **AI Coach**, powered by **Google Gemini 2.5 Flash**, which analyzes match history to provide personalized, tactical advice to help players level up.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Place+Your+App+Screenshot+Here)
*(Tip: Replace the link above with a real screenshot of your app)*

---

## ✨ Key Features

### 🏟 Club & Session Management
* **Club Dashboard:** Centralized hub for announcements (Alerts, Info, Success), member rosters, and live club rankings.
* **Smart Scheduling:** Effortlessly create single or weekly recurring sessions.
* **Real-time Status:** Visual capacity bars with instant status indicators (**Open** / **Full** / **Locked**).
* **Admin Controls:** Comprehensive tools to manage rosters, remove members, and invite new players via email.

### 🏸 Match Recording & Gamification
* **Live Scorer:** A touch-friendly, mobile-optimized interface for recording matches on the court.
* **Team Management:** Quick drag-and-drop or tap selection with "Swap Sides" functionality.
* **Detailed History:** comprehensive match logs with expandable details showing all participants.
* **Dynamic Leaderboards:** Automatic calculation of Win/Loss rates to rank members.

### 📊 Player Profile & Analytics
* **Visual Stats:** Track performance with Win/Loss ratios and "Recent Form" indicators (e.g., `W-L-W-W`).
* **Session History:** Distinct views for Upcoming vs. Past sessions to stay organized.
* **Customization:** Edit avatars, display names, and self-assessed skill levels.

### 🤖 AI Coach (Powered by Gemini)
> *Your personal tactical analyst.*
* **Tactical Analysis:** Integrates with the **Gemini 2.5 Flash model** to analyze a player's recent match history.
* **Personalized Tips:** Generates 3 specific, actionable coaching tips tailored to the player's current performance trends.

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Core** | React 19, TypeScript |
| **Styling** | Tailwind CSS (Mobile-first utility classes), Lucide React (Icons) |
| **Routing** | React Router v7 |
| **State** | React Context API + LocalStorage persistence |
| **AI** | Google GenAI SDK (Gemini 2.5 Flash) |
| **Visualization** | Recharts |

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/badminton-hub.git](https://github.com/yourusername/badminton-hub.git)
    cd badminton-hub
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 🔮 Future Roadmap

* [ ] **Backend Migration:** Migrate from LocalStorage to **Supabase** for real-time database capabilities and multi-device sync.
* [ ] **Auth:** Implement secure user authentication.
* [ ] **Tournament Mode:** Add bracket generation for club tournaments.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License.
