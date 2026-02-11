# Sentinel Frontend

Modern, minimal, and responsive web interface for the Sentinel compliance monitoring system.

## Overview

The frontend provides three main pages:

1. **Homepage** - Landing page showcasing the project
2. **Dashboard** - Real-time treasury monitoring and analytics
3. **Documentation** - Comprehensive project documentation

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library

## Development

```bash
cd frontend
npm install
npm run dev
```

The dev server will start at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The production build will be output to `frontend/dist/`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with navigation
│   ├── pages/
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── DashboardPage.jsx   # Analytics dashboard
│   │   └── DocsPage.jsx        # Documentation
│   ├── assets/
│   │   └── logo.svg            # Logo file
│   ├── App.jsx                 # Router configuration
│   ├── main.jsx                # React entry point
│   └── styles.css              # Global styles
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration
└── package.json
```

## Design System

### Colors

- Primary Background: `#0a0f1a`
- Card Background: `#1a2332`
- Primary Accent: `#637fff`
- Secondary Accent: `#4c9aff`
- Success: `#4ade80`
- Warning: `#fbbf24`
- Danger: `#ef4444`

### Typography

- Font Family: Inter (loaded from Google Fonts)
- Monospace: JetBrains Mono, Fira Code

### Layout

- Max width: 1280px (homepage sections), 1400px (dashboard)
- Responsive breakpoints: 1024px, 768px, 480px

## Environment Variables

Configure the API base URL:

```bash
# Development (uses proxy)
VITE_API_URL=http://localhost:3000

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
```

## API Integration

The frontend connects to the backend API endpoints:

- `GET /api/events` - Recent compliance events
- `GET /api/balances` - Treasury and quarantine balances
- `GET /api/bundle` - Jito bundle execution status

## Features

### Navigation
- Sticky header with logo and links
- Mobile-friendly hamburger menu
- Active route highlighting

### Homepage
- Hero section with animated status cards
- Feature showcase grid
- Statistics section
- Architecture flow diagram
- Call-to-action section

### Dashboard
- Real-time data polling (5-7 second intervals)
- Balance cards with icons
- Transaction activity table
- Status badges for different states
- Responsive grid layout

### Documentation
- Sidebar navigation
- Code blocks with syntax highlighting
- Tables and lists
- Info boxes
- Anchor links for sections

## Responsive Design

The interface is fully responsive:

- **Desktop** (>1024px) - Full layout with sidebars
- **Tablet** (768px-1024px) - Adjusted grid columns
- **Mobile** (<768px) - Single column, hamburger menu

## Performance

- Production build size: ~212 KB (gzipped: ~67 KB)
- Optimized with Vite's code splitting
- Efficient polling with cleanup on unmount
- Minimal re-renders with React hooks

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox

## Customization

### Logo

Replace `src/assets/logo.svg` with your custom logo. The logo is used in:
- Navigation header
- Footer
- As favicon (if configured)

### Colors

Update CSS variables in `src/styles.css`:

```css
:root {
  --accent-primary: #637fff;
  --accent-secondary: #4c9aff;
  /* ... other colors */
}
```

### Content

Edit the page components directly:
- `src/pages/HomePage.jsx` - Landing page content
- `src/pages/DocsPage.jsx` - Documentation text

## Deployment

### Option 1: Docker (with backend)

The `docker-compose.yml` in the root already includes the frontend service.

```bash
docker compose up -d --build
```

### Option 2: Static Hosting

Build and deploy the `dist` folder to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Make sure to set `VITE_API_BASE_URL` to your backend API URL.

### Option 3: Serve with Backend

The backend server can serve the built frontend:

```bash
npm run build
# Configure backend to serve from frontend/dist
```

## Troubleshooting

### API Connection Errors

If you see "Failed to load resource" errors:
- Ensure the backend is running on `http://localhost:3000`
- Check CORS configuration in `server.js`
- Verify `VITE_API_URL` is set correctly

### Build Errors

If the build fails:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (requires Node 18+)

### Style Issues

If styles aren't loading:
- Clear browser cache
- Check browser console for CSS errors
- Verify `styles.css` is imported in `main.jsx`

## Contributing

When making changes:
1. Test on multiple screen sizes
2. Ensure accessibility (keyboard navigation, ARIA labels)
3. Keep the design minimal and consistent
4. Update this README if adding new features

## License

Same as the main Sentinel project.
