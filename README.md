# RoomSync - Roommate Dashboard

A modern full-stack application for managing shared chores and splitting expenses with your roommates. Built with a unisex, laidback, playful, yet sleek and luxe design aesthetic.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
RoomSync/
├── client/          # Next.js frontend
├── server/          # Express.js backend
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (or Supabase account)
- Git

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/roomsync?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
```

**Important:** Replace the `DATABASE_URL` with your actual PostgreSQL connection string. If using Supabase, you can find this in your Supabase project settings under "Database" → "Connection string".

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Run database migrations (this creates the database tables):
```bash
npm run prisma:migrate
```

6. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

**Note:** The server will automatically test the database connection on startup. If you see connection errors, make sure:
- Your database is running and accessible
- The `DATABASE_URL` is correct
- You've run `prisma:generate` and `prisma:migrate`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `client` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Protected routes

### Household Management
- Create or join a household
- Invite roommates using invite codes
- View household members

### Chore Tracking
- Create and assign chores
- Mark chores as complete
- Delete chores
- View all household chores

### Expense Splitting
- Add expenses with descriptions and amounts
- Split expenses between multiple roommates
- View financial summary (You Owe / You Are Owed)
- Track who paid for what

### Dashboard
- Financial summary with net balance
- My Chores widget showing pending tasks
- Quick overview of household activity

## Design System

The application uses a custom color palette designed to be:
- **Unisex**: Neutral colors with pops of warmth
- **Laidback**: Soft, muted tones
- **Playful**: Rounded corners, friendly typography
- **Sleek & Luxe**: Smooth gradients, subtle shadows, premium feel

### Color Palette
- **Primary**: Terracotta (warm orange-red)
- **Secondary**: Sage green
- **Accent**: Lavender purple
- **Neutrals**: Warm grays, beige, cream

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Households
- `GET /api/households/me` - Get current user's household
- `POST /api/households` - Create a new household
- `POST /api/households/join` - Join a household with invite code

### Chores
- `GET /api/chores` - Get all chores for household
- `POST /api/chores` - Create a new chore
- `PATCH /api/chores/:id` - Update a chore
- `DELETE /api/chores/:id` - Delete a chore

### Expenses
- `GET /api/expenses` - Get all expenses for household
- `POST /api/expenses` - Create a new expense with splits

## Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### "Internal server error" when signing in

This usually means one of the following:

1. **Prisma Client not generated**
   ```bash
   cd server
   npm run prisma:generate
   ```

2. **Database migrations not run**
   ```bash
   cd server
   npm run prisma:migrate
   ```

3. **Database connection issue**
   - Check that your `DATABASE_URL` in `.env` is correct
   - Verify your database is running and accessible
   - For Supabase: Make sure you're using the connection string from your project settings

4. **Missing environment variables**
   - Ensure both `DATABASE_URL` and `JWT_SECRET` are set in `server/.env`

5. **Check server logs**
   - Look at the terminal where the server is running for detailed error messages
   - The server now shows connection status on startup

### Database Connection Issues

If you see "Database connection failed" on server startup:

- **Local PostgreSQL**: Make sure PostgreSQL is running
  ```bash
  # On macOS with Homebrew
  brew services start postgresql
  
  # On Linux
  sudo systemctl start postgresql
  
  # On Windows
  # Start PostgreSQL service from Services panel
  ```

- **Supabase**: 
  - Go to your Supabase project dashboard
  - Navigate to Settings → Database
  - Copy the "Connection string" (URI format)
  - Use it as your `DATABASE_URL`

### Prisma Migration Issues

If migrations fail:

```bash
# Reset the database (WARNING: This deletes all data)
npm run prisma:migrate reset

# Or create a fresh migration
npm run prisma:migrate dev --name init
```

## License

ISC

