# AptitudeX

On-chain app for team recognition and reward on Base.

## Setup

```bash
npm install
npm run dev
```

The app will be available at http://localhost:8080

## Environment Variables (Placeholders)

Create a `.env` file with:

```env
# Base Network Configuration
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Optional: Wallet Connect Project ID
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
```

## Tech Stack

- **React** + **Vite** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Radix UI** + **shadcn/ui** for components
- **Lucide React** for icons

Ready for:
- **Wagmi** + **Viem** for wallet integration
- **Base** mainnet deployment

## Design System

### Colors (HSL)
- **Background**: `180 7% 16%` (#25292a)
- **Background Dark**: `210 22% 4%` (#07090b) 
- **Background Accent**: `4 28% 19%` (#3f2423)
- **Foreground**: `0 0% 100%` (white)
- **Primary/Accent**: `6 89% 60%` (#f4553e)

### Typography
- **Font**: Montserrat (400, 500, 600, 700)
- All text uses semantic color tokens (never direct colors)

### Components
- Rounded corners: `rounded-xl` (0.75rem)
- Soft shadows: `shadow-soft`
- Glow effects: `shadow-glow` on primary elements
- Smooth transitions: 150-200ms cubic-bezier

### Design Principles
1. **Mobile-first**: Optimized for iPhone 14/15 (390x844)
2. **Touch-friendly**: Minimum 44px hit targets
3. **Accessible**: AA contrast, focus states, reduced motion support
4. **Semantic tokens only**: All colors via design system

## Features

### V1 (Current)
- ✅ Wallet connection (mocked)
- ✅ Home dashboard with metrics
- ✅ Rewards list & detail view
- ✅ Claim flow
- ✅ Activity timeline with filters
- ✅ Admin console (issue rewards, define rules, manage allowlist)
- ✅ Bottom tab navigation
- ✅ Responsive mobile layout

### Next Steps
- [ ] Integrate Wagmi for real wallet connection
- [ ] Connect to Base smart contracts
- [ ] Add Web3 transaction handling
- [ ] Persist state to localStorage
- [ ] Add skeleton loaders
- [ ] Light haptics on mobile

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppShell, Header, BottomNav
│   ├── ui/              # shadcn components
│   ├── ActivityItem.tsx
│   ├── BottomSheet.tsx
│   ├── FeatureTile.tsx
│   ├── MetricCard.tsx
│   ├── RewardItem.tsx
│   └── WalletPanel.tsx
├── pages/
│   ├── Home.tsx
│   ├── Rewards.tsx
│   ├── Claim.tsx
│   ├── Activity.tsx
│   ├── Admin.tsx
│   └── NotFound.tsx
├── store/
│   └── useAppStore.ts   # Zustand store
├── App.tsx
└── index.css            # Design system tokens
```

## Mock Data

Currently using Zustand with mock data for:
- User profile (address, admin status, streak)
- Kudos balance
- Pending claims
- Rewards history
- Activity timeline

All ready to swap for real Web3 calls.

## Deployment

Built for Vercel deployment:
- No BigInt issues (TS target ES2020)
- Optimized for production builds
- Mobile-first responsive design

## License

MIT
