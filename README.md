# 🌿 NAEB Digital Farm-to-Market Supply Chain Platform

A full-stack web application that digitizes agricultural trade for the
**National Agricultural Export Development Board (NAEB)** of Rwanda — replacing
fragmented manual ledgers with a centralized, real-time marketplace for farmers,
buyers, and NAEB administrators.

Built as a final-year research project at **Mount Kigali University**
(Bachelor of Business Information & Communication Technology).

---

## 🎯 Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | User-friendly interface that minimizes wait times | ✅ |
| 2 | Central database for registrations, listings, logistics & contracts | ✅ |
| 3 | Analytics engine estimating supply trends + exportable reports | ✅ |

## 🧱 Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 19 + Vite + Tailwind CSS v4 + Recharts + React Router |
| Backend     | Django 5 + Django REST Framework + SimpleJWT |
| Database    | SQLite (dev) → PostgreSQL (prod, swappable via `.env`) |
| Auth        | JWT (access + refresh tokens) with role-based access control |

## 👥 Roles

| Role | Capabilities |
|------|-------------|
| **NAEB Admin** | Dashboard KPIs, verify users, manage orders, generate/export reports |
| **Farmer / Cooperative** | Add/edit/delete product listings, track inventory, view incoming orders |
| **Buyer (Wholesaler/Exporter)** | Browse marketplace, initiate purchase orders, download digital contracts, track delivery |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone

```bash
git clone https://github.com/<your-username>/naeb-platform.git
cd naeb-platform