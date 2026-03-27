# NodeMesh

Red P2P de bandwidth descentralizada construida sobre Monad. Los proveedores monetizan su ancho de banda y los usuarios pagan únicamente por los segundos que consumen — sin intermediarios, sin censura, con liquidación instantánea on-chain.

---

## ¿Qué problema resuelve?

Las VPNs centralizadas guardan logs, pueden ser confiscadas y cobran suscripciones fijas aunque no las uses. NodeMesh elimina al intermediario: el proveedor y el usuario se conectan directamente, y el pago ocurre automáticamente por cada segundo de sesión activa.

---

## Cómo funciona
```
Proveedor registra nodo → Usuario abre sesión + deposita MON
→ Sesión activa (micropagos acumulándose)
→ Usuario cierra sesión
→ Proveedor recibe pago en MON
→ Usuario recibe reembolso del depósito no utilizado
```

Todo ocurre on-chain. Sin custodia. Sin confianza entre partes.

---

## Contratos deployados — Monad Testnet

| Contrato | Address | Explorer |
|---|---|---|
| NodeRegistry | `0x554d242eBf4e5d5896069023D8ACe1a76A445D83` | [Ver](https://testnet.monadexplorer.com/address/0x554d242eBf4e5d5896069023D8ACe1a76A445D83) |
| SessionManager | `0x9efed651f02dB27E173B4aed4697dd774571D9f3` | [Ver](https://testnet.monadexplorer.com/address/0x9efed651f02dB27E173B4aed4697dd774571D9f3) |
| MicroPayment | `0xF0fC0EA4A8CcDB16bc9d482e9b93C9b3b01A3ddf` | [Ver](https://testnet.monadexplorer.com/address/0xF0fC0EA4A8CcDB16bc9d482e9b93C9b3b01A3ddf) |
| ReputationSBT | `0xf6C6aa8dFd32618F8d3703F0BcB40456c032fbb3` | [Ver](https://testnet.monadexplorer.com/address/0xf6C6aa8dFd32618F8d3703F0BcB40456c032fbb3) |

---

## Arquitectura
```
nodemesh/
├── backend/                    # Contratos Solidity + scripts Hardhat
│   ├── contracts/
│   │   ├── NodeRegistry.sol    # Registro de nodos con staking mínimo
│   │   ├── SessionManager.sol  # Apertura/cierre de sesiones VPN
│   │   ├── MicroPayment.sol    # Streaming de pagos + reembolsos
│   │   └── ReputationSBT.sol   # Soulbound Token de reputación
│   └── deploy/
│       └── 01_deploy_nodemesh.js
└── frontend/                   # Next.js 15 + Wagmi + Reown AppKit
    ├── app/
    ├── components/
    │   ├── Dashboard.tsx        # Layout bento desktop / tabs mobile
    │   ├── NodeMap.tsx          # Mapa mundial con nodos on-chain
    │   ├── UserPanel.tsx        # Flujo de sesión para usuarios
    │   ├── ProviderPanel.tsx    # Registro de nodos y claim de earnings
    │   └── PaymentTicker.tsx    # Visualización de pagos en tiempo real
    ├── hooks/
    ├── lib/
    │   ├── contracts.ts         # ABIs + addresses
    │   └── monad.ts             # Configuración de la chain
    └── types/
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Blockchain | Monad Testnet (chainId 10143) |
| Smart Contracts | Solidity ^0.8.28 |
| Framework de deploy | Hardhat + hardhat-deploy |
| Frontend | Next.js 15 + TypeScript |
| Wallet / Web3 | Wagmi v2 + Viem + Reown AppKit |
| Mapa | react-simple-maps + Natural Earth |
| Deploy | Vercel |

---

## Correr localmente

### Requisitos

- Node.js 18+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/usainbluntmx/nodemesh.git
cd nodemesh
```

### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 3. Configurar variables de entorno del backend
```bash
# backend/.env
PRIVATE_KEY=tu_private_key_sin_0x
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
```

### 4. Compilar contratos
```bash
npm run compile
```

### 5. Instalar dependencias del frontend
```bash
cd ../frontend
npm install --legacy-peer-deps
```

### 6. Configurar variables de entorno del frontend
```bash
# frontend/.env.local
NEXT_PUBLIC_NODE_REGISTRY=0x554d242eBf4e5d5896069023D8ACe1a76A445D83
NEXT_PUBLIC_SESSION_MANAGER=0x9efed651f02dB27E173B4aed4697dd774571D9f3
NEXT_PUBLIC_MICRO_PAYMENT=0xF0fC0EA4A8CcDB16bc9d482e9b93C9b3b01A3ddf
NEXT_PUBLIC_REPUTATION_SBT=0xf6C6aa8dFd32618F8d3703F0BcB40456c032fbb3
NEXT_PUBLIC_REOWN_PROJECT_ID=tu_project_id
```

### 7. Correr el frontend
```bash
npm run dev
```

Abre `http://localhost:3000`

---

## Flujo de demo

### Como proveedor (Wallet A)
1. Conectar wallet en Monad Testnet
2. Ir a **⚡ Provide & Earn**
3. Seleccionar ubicación, bandwidth y precio por segundo
4. Click en **Register Node** (requiere 0.01 MON de stake)
5. El nodo aparece activo en el mapa y disponible para usuarios

### Como usuario (Wallet B)
1. Conectar wallet en Monad Testnet
2. Ir a **👤 Use Bandwidth**
3. Seleccionar un nodo disponible
4. Click en **Open Session** (deposita 0.01 MON en escrow)
5. Usar el servicio — el ticker muestra el costo acumulándose
6. Click en **Close Session**
   - El contrato calcula el tiempo usado
   - El proveedor recibe el pago en MON
   - El remanente se reembolsa al usuario automáticamente

### Como observador
- Ir a **🌐 Network Map**
- Los nodos activos aparecen en el mapa mundial en tiempo real
- Click en un nodo para ver sus detalles

---

## Por qué Monad

Los micropagos por segundo generan ~720 transacciones por hora por usuario activo. Con 1,000 usuarios simultáneos eso es **720,000 tx/hora**.

| Red | Viabilidad |
|---|---|
| Ethereum | ❌ Fees prohibitivos |
| Polygon | ⚠️ Viable pero lenta |
| **Monad** | ✅ 10,000 TPS · <1s finality · fees mínimos |

Monad es la única chain donde el modelo económico de NodeMesh funciona a escala real.

---

## Roadmap

| Fase | Estado | Descripción |
|---|---|---|
| v0 · Hackathon | ✅ Completo | Contratos en testnet, demo funcional, dashboard integrado |
| v1 · Post-hack | 🔜 Q2 2026 | Nodos reales con software ligero, cliente de escritorio, audit |
| v2 · Producto | 🔜 Q3 2026 | App móvil, marketplace de nodos, modelo freemium |
| v3 · Escala | 🔜 2027 | Multi-chain, exit nodes en 50+ países, DAO governance |

---

## Equipo

**Richi XBT** — Computer Systems Engineer · Full-Stack Developer · Blockchain Developer

- GitHub: [@usainbluntmx](https://github.com/usainbluntmx)
- Solana Certified Developer
- Stack: Solidity · Rust · TypeScript · Next.js · Wagmi · Anchor

---

## Licencia

MIT