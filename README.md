# Skill Navigator – Skill Gap Analyzer

## 📌 Project Overview

Skill Navigator is a web-based Skill Gap Analyzer designed to evaluate users' technical knowledge, identify their strengths and weaknesses, and track their learning progress.

The application allows users to take diagnostic assessments, view their performance, and understand which technical areas need improvement. It also provides an admin dashboard to manage questions, users, and assessment analytics.

## ✨ Features

### 👤 User Features
- **User Authentication:** Secure registration and login using Supabase.
- **Diagnostic Assessment:** Take technical assessments with multiple-choice questions.
- **Randomized Questions:** Questions are selected randomly from the available question bank.
- **Progress Tracking:** Track the number of completed assessments.
- **Performance Analysis:** View assessment scores and category-wise performance.
- **Skill Gap Identification:** Identify strong areas and topics that need improvement.
- **Results Dashboard:** Review assessment results and performance statistics.

### 🔐 Admin Features
- **Admin Dashboard:** View overall platform statistics.
- **User Management:** Manage registered users.
- **Question Management:** Add and manage assessment questions.
- **CSV Upload:** Upload questions in CSV format.
- **Analytics Dashboard:** Analyze user performance, accuracy trends, and question difficulty.
- **Admin Settings:** Access platform configuration options.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| TypeScript | Type-safe programming |
| Vite | Development server and build tool |
| Tailwind CSS | UI styling |
| shadcn/ui | Reusable UI components |
| Supabase | Database and authentication |
| React Router | Application navigation |
| Recharts | Data visualization |
| Lucide React | Icons |

## 📂 Project Structure

```text
skill-navigator/
│
├── public/                  # Static assets
│
├── src/
│   ├── components/
│   │   ├── admin/           # Admin components
│   │   └── ui/              # Reusable UI components
│   │
│   ├── hooks/               # Custom React hooks
│   │
│   ├── integrations/
│   │   └── supabase/        # Supabase configuration
│   │
│   ├── lib/                 # Utility functions
│   │
│   ├── pages/               # Application pages
│   │   └── admin/           # Admin pages
│   │
│   ├── App.tsx              # Main application
│   └── main.tsx             # Application entry point
│
├── supabase/
│   └── migrations/          # Database migrations
│
├── package.json
├── vite.config.ts
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- A Supabase account

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### Step 2: Navigate to the Project

```bash
cd skill-navigator-main
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root directory.

Add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with your actual Supabase project credentials.

**Important:** Never upload your `.env` file or private credentials to GitHub.

### Step 5: Run the Application

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:8080
```

Check the terminal for the actual local URL if a different port is assigned.

## 🏗️ Build for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🗄️ Database

This project uses Supabase for backend services.

The application works with database tables for:

- User profiles
- Assessment questions
- User answers
- Test results
- User roles and permissions

Apply the supplied Supabase migrations and configure the required authentication and database permissions before running the application with a new Supabase project.

## 🚀 Future Enhancements

- AI-powered personalized learning recommendations.
- Learning roadmaps based on identified skill gaps.
- More technical assessment categories.
- Advanced performance analytics.
- Personalized practice questions.
- Integration with learning resources.

## 👨‍💻 Author

Developed as a Skill Navigator – Skill Gap Analyzer project.

---

**Skill Navigator – Identify Your Skill Gaps. Improve Your Skills. Track Your Growth.**
