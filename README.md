# Srikesh TR Portfolio

A premium, highly interactive, creative developer portfolio for Srikesh TR, Software Developer.

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

## Development
Run the development server:

```bash
npm run dev
```

## Architecture
- `app/`: Next.js App Router endpoints and pages.
- `components/`: UI components organized by feature.
- `data/`: Portfolio content and static data.
- `lib/`: Infrastructure and utility logic.
- `services/`: API and external service integrations.
- `types/`: TypeScript type definitions.
- `animations/`: Reusable animation logic.
- `config/`: App configurations.

## Configuration & Environment

### GitHub Contribution Heatmap
1. Set your GitHub username in `config/site.ts` (`githubUsername`).
2. The site uses the public Jogruber GitHub Contributions API. Data is fetched server-side and cached for 1 hour.

### Profile Image
- Place your main profile image at `public/images/profile/profile-temp.jpg`.
- If the image is missing, a placeholder will be safely displayed without breaking the site.
