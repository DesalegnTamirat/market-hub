# MarketHub 🛒

MarketHub is a premium, multi-vendor e-commerce platform designed for scalability and performance. It features a modern, responsive frontend and a robust, feature-rich backend with secure authentication, real-time data management, and integrated payment processing.

## 🚀 Key Features

- **Multi-Vendor Ecosystem**: Vendors can manage their own stores and products.
- **Secure Authentication**: JWT-based auth with access and refresh tokens.
- **Advanced Product Discovery**: Category-based filtering, price range selection, and sophisticated sorting.
- **Seamless Shopping Experience**: Integrated Shopping Cart and Wishlist functionality.
- **User Roles & Permissions**: Specialized dashboards for Admins, Vendors, and Customers.
- **Modern UI/UX**: Responsive design with Dark Mode support and smooth glassmorphic aesthetics.
- **Payment Integration**: Stripe-ready for secure transactions.
- **Media Management**: Cloudinary integration for optimized product imaging.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **API Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Security**: [Passport.js](https://www.passportjs.org/) & [JWT](https://jwt.io/)
- **Image Storage**: [Cloudinary](https://cloudinary.com/)
- **Payments**: [Stripe](https://stripe.com/)

## 📂 Project Structure

```text
market-hub/
├── frontend/    # Next.js web application
└── backend/     # NestJS API & Prisma database layer
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Docker (optional, for database)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd market-hub
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Configure .env with your DATABASE_URL, JWT_SECRET, etc.
   npx prisma generate
   npm run start:dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   # Configure .env with NEXT_PUBLIC_API_URL
   npm run dev
   ```

## 📄 License

This project is [UNLICENSED](LICENSE).
