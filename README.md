# AptitudeX (Alpha) — Built for the Base Community

**Test it out:**  
🔗 https://test.aptitudex.app

AptitudeX turns team recognition into **on-chain rewards** on **Base**.  
This repo hosts the public **alpha** for **Base Batches 002**: a lightweight, mobile-first web app that lets teams or orgs reward contributions with tokens — **fair, transparent, programmable**.

> **Status:** Alpha preview — expect rapid changes. I’m building in the open with the Base community and iterating weekly.

---

## ✨ What it does (today)

- **Wallet connect (Base 8453)** — connect with an injected wallet.
- **Live token wiring (APX)** — read token metadata, balances, and (admin-gated) mint flow.
- **Mobile-first UI** — simple demo surfaces for “recognition → reward”.
- **Safe fallbacks** — if a feature isn’t configured (e.g., sponsored gas), the app degrades gracefully.

> This alpha is for community testing & feedback, **not** production HR use (yet).

---

## 🧭 Why (Base Batches 002)

We believe recognition should become **ownership**, and Base is the right place to prove it:

- **Programmable trust:** rewards and rules live on-chain.  
- **Transparency:** verifiable histories > spreadsheets.  
- **Fun & fair:** kudos, milestones, streaks → tokenized incentives.

**Base Batches 002** gives us the perfect sandbox to ship fast with real users and real feedback.

---

## 🔗 Live surfaces

- **Demo Preview:** https://demo.aptitudex.app  
- **Configurator (Start):** https://start.aptitudex.app *(wizard to bootstrap an org instance; parts are “coming soon” in alpha)*  
- **Example Instance:** https://doors3.aptitudex.app *(brand-customized preview)*  
- **Landing:** https://aptitudex.app

> Some links/pages may be placeholders while we iterate — PRs and issues welcome.

---

## 🧱 Tech & Ecosystem

- **Base (mainnet 8453):** https://mainnet.base.org  
- **wagmi v2 + viem v2:** wallet, reads/writes  
- **OnchainKit (Coinbase):** identity & Base-first UX primitives (progressively integrated)  
- **ENS resolution (L1 mainnet):** show name/avatar if available, fallback to short address  
- **(Planned) Paymaster / CDP:** optional gas sponsorship for select actions

**Token (alpha):** APX on Base  
`0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3`  
*(Admin-only mint UI appears when the connected address is authorized.)*

---

## 🚀 Quick start (local)

# 1) Install
npm i

# 2) Configure env
cp .env.example .env
# then edit .env

# 3) Run
npm run dev

# Chain
VITE_CHAIN_ID=8453
VITE_RPC_URL=https://mainnet.base.org

# Token wiring
VITE_APX_ADDRESS=0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3
# Optional: gate admin-only UI (no secrets; just an address check)
VITE_APX_ADMIN=0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4

# ENS (Ethereum mainnet RPC for name/avatar lookups)
VITE_ETH_MAINNET_RPC_URL=https://ethereum.publicnode.com

# CDP Paymaster (server-only when added; do NOT expose in client)
# CDP_API_KEY=...
# CDP_PAYMASTER_URL=...
# CDP_BUNDLER_URL=...

Never commit or expose private keys or CDP secrets. Any gas sponsorship will run via a server endpoint (Vercel Function) that holds the secret.

🗺️ Roadmap (public)
P0 — Alpha validation (now → 0–3 months)

✅ Wallet connect, Base reads/writes (APX)

✅ Mobile-first demo & example instance

⏳ Base ENS name/avatar in header

⏳ Paymaster (CDP) toggle for sponsored tx on select flows

⏳ Configurator “happy path” (brand + token + rules → JSON)

P1 — Scale foundations (3–9 months)

Org-level configurator → one-click org instance

Audit logs export, basic admin analytics

OnchainKit identity polish, better error surfaces

P2 — Enterprise motion (9–18 months)

SSO/HRIS integrations (lightweight)

Security pack (SOC-lite), DPIA templates

White-label options & partner kits

Feedback drives scope — please open issues with real-world needs.

🧑‍💻 Contributing

We welcome issues, ideas, and PRs:

Bugs/UX: steps to reproduce + screenshots if possible

Features: short problem statement → proposed UX → on-chain implications

Code: keep components small, TypeScript strict, and avoid leaking secrets

Run lint/typecheck before PR:

npm run lint
npm run build

🔒 Security notes

This is alpha software; use test wallets and small amounts.

Avoid sharing private keys/API keys. If you see a potential secret in the repo or build output, please open a security issue.

🙏 Acknowledgements

Base & Coinbase Developer Platform for tooling, OnchainKit, and community support.

Builders in Base Batches 002 for feedback and inspiration.

📬 Contact

Project: AptitudeX — “Recognition that becomes ownership.”
Say hi / share feedback: open an Issue or reach the maintainer via the repo profile.

📝 License

MIT (see LICENSE). Content and trademarks remain property of their respective owners.

::contentReference[oaicite:0]{index=0}