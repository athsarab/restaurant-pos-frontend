# Restaurant Management System

A unified React application that combines a customer-facing restaurant website with an inventory management system.

## Project Structure

```
restaurant-frontend/
├── src/
│   ├── website/           # Customer-facing restaurant website
│   ├── inventory/         # Staff inventory management system  
│   ├── components/        # Shared components
│   ├── routes/           # Routing configuration
│   └── App.jsx           # Main application router
├── public/               # Static assets (images, icons, etc.)
└── package.json          # Dependencies and scripts
```

## Features

### Customer Website (/)
- Interactive menu browsing
- Shopping cart functionality
- Table number selection
- Order placement
- Hungarian cuisine showcase

### Inventory Management System (/inventory)
- Dashboard and analytics
- Inventory tracking
- Stock requests
- Supplier management  
- Menu management
- Daily pricing
- User authentication & role-based access
- Kitchen staff interface

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5173

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with:
```
VITE_API_BASE=http://localhost:5173/api
```

3. Start the development server:
```bash
npm start
```

The application will be available at:
- **Main Website**: http://localhost:3000
- **Inventory System**: http://localhost:3000/inventory

## Development

### Available Scripts

- `npm start` - Start development server on port 3000
- `npm run dev` - Same as start (Vite dev mode)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Connection

The inventory system connects to the backend API at `http://localhost:5173/api`. Make sure the backend server is running before using the inventory features.

### Authentication

The inventory system requires authentication. Use the login page at `/inventory/login` to access the management interface.

## Routing

- `/` - Main restaurant website
- `/inventory/login` - Staff login
- `/inventory/*` - All inventory management routes

## Technologies Used

- **React 18** - UI framework
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **Chart.js & Recharts** - Data visualization
- **Heroicons & Lucide React** - Icon libraries

## Building for Production

```bash
npm run build
```

The build will be optimized and ready for deployment in the `dist/` folder.