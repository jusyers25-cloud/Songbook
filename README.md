
# Songbook App

This is a Next.js app for searching songs, saving favorites, and tracking learning progress. It features:

- **Search & Autocomplete**: Quickly find songs as you type.
- **Save for Later & Actively Learning**: Organize songs into two mutually exclusive lists.
- **User Accounts**: Lists are persistent and tied to your Supabase user account.
- **PWA (Progressive Web App)**: Installable on mobile and desktop, with offline support.

## Getting Started

1. **Install dependencies:**
	```bash
	npm install
	```
2. **Configure Supabase:**
	- Create a `.env.local` file with your Supabase project URL and anon key:
	  ```env
	  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
	  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
	  ```
3. **Run the development server:**
	```bash
	npm run dev
	```
	Open [http://localhost:3000](http://localhost:3000) in your browser.

## PWA Features

- Add to Home Screen on mobile for app-like experience.
- Offline support via service worker.
- Custom icons and manifest for installability.

## Deployment

Deploy easily on [Vercel](https://vercel.com/):

1. Push your code to GitHub.
2. Import your repo into Vercel and set your Supabase env variables.
3. Vercel will build and deploy automatically.

## File Structure

- `app/` — Main app pages and layout
- `components/` — UI components
- `lib/supabase/` — Supabase client
- `public/` — Manifest, icons, favicon
- `supabase/` — SQL scripts for DB setup

## Customization

- Update song data and UI in `app/page.tsx` and `components/ui/`
- Modify PWA settings in `public/manifest.json` and `app/_head.tsx`

## License

MIT
