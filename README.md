# Sason ERP Platform

A modern, enterprise-grade web application designed to streamline garment manufacturing workflows. This frontend architecture provides a robust, highly responsive interface for managing the entire production lifecycle—from order initiation and material procurement to factory floor tracking and delivery.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Architecture:** Modular, Component-driven, Route Grouped `(dashboard)`

## 📦 Core Modules Implemented

The application is structured into interconnected modules tailored for specific enterprise roles:

1. **Dashboard Home (`/dashboard`)**
   - High-level KPIs, live production status, and recent order tracking.
   - Quick-action portals and critical inventory alerts.

2. **Order Management (`/orders`)**
   - Dynamic PO creation with multi-row garment specification grids.
   - Historical order tracking with advanced search and status filtering.

3. **BOM Calculation (`/bom-calculation`)**
   - Automated Bill of Materials generation based on garment type and quantity.
   - Integrated material availability checks and wastage margin controls.

4. **Inventory Control (`/inventory`)**
   - Real-time stock tracking with category filters.
   - Low-stock alerts and value assessment.

5. **Procurement (`/procurement`)**
   - Purchase request lifecycle tracking (Pending -> In Transit -> Delivered).
   - Supplier performance summaries and critical shortage alerts.

6. **Production Tracking (`/production`)**
   - Live factory pipeline visualization (Cutting, Stitching, Checking, Packing).
   - Work order progress bars, machine utilization metrics, and delay alerts.

7. **Authentication (`/login`)**
   - Role-based secure login portal supporting specialized views (e.g., Super Admin, Production Head, Store Manager).

## 📱 Responsive & UX Polish

The UI is meticulously crafted to ensure a seamless Software-as-a-Service (SaaS) experience across all devices:
- **Mobile-First Components:** Fully responsive navigation with a smooth slide-out mobile sidebar.
- **Fluid Data Tables:** All complex data tables (BOM, Inventory, Orders) are secured within horizontally scrollable containers to prevent breakage on small screens.
- **Touch-Optimized:** Action buttons and interactive elements expand on mobile viewports for enhanced tap accessibility.
- **Consistent Design Language:** Standardized typography, unified color tokens (emerald for success, amber for warnings, red for critical), and cohesive card padding across the entire platform.

## 🔗 Future Backend Integration

This frontend prototype is engineered for immediate connection to a production backend. Future roadmap:
1. **API Integration:** Swap static mock data for real REST/GraphQL queries.
2. **State Management:** Implement global state (e.g., Redux, Zustand) or server-state caching (React Query) for complex module interactions.
3. **Database:** Persist data in a scalable RDBMS (e.g., PostgreSQL via Supabase or Prisma).
4. **Authentication Provider:** Replace the client-side login redirect with robust server-side protection using NextAuth.js or Clerk.
5. **Real-Time Data:** Integrate WebSockets to provide live, factory-floor machine status updates to the Production module.

---
*Developed for Sason Garments*
