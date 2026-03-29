# MarketHub Frontend 🎨

The frontend of MarketHub is a modern, high-performance web application built with Next.js 16 and Tailwind CSS.

## 🛠️ Tech Stack

- **Next.js 16**: Utilizing the App Router for optimal performance and SEO.
- **Tailwind CSS**: For a utility-first, highly customizable design system.
- **Zustand**: Lightweight and scalable state management for cart, auth, and UI states.
- **Axios**: Configured with interceptors for automatic token refresh and error handling.
- **Shadcn UI**: Beautifully designed components built with Radix UI primitives.

## 🚀 Development

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Running Locally

```bash
npm run dev
```

## 📁 Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components.
- `/lib`: Utility functions and API configuration.
- `/store`: Zustand state stores.
- `/types`: TypeScript type definitions.
