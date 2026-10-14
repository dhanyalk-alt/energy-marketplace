⚡ Energy Marketplace — Renewable Energy Trading Platform

A full-stack web application that enables renewable energy producers to trade their surplus electricity with consumers through a digital marketplace.

The platform aims to make renewable energy more accessible by connecting energy producers and consumers through a secure, user-friendly, and scalable system.

🌱 Project Overview

Traditional energy systems often limit how easily individuals and small-scale renewable energy producers can share surplus electricity. Energy Marketplace aims to address this challenge by providing a digital platform where producers can offer available energy and consumers can explore and request energy from producers.

The application includes role-based dashboards, secure authentication, energy trading functionality, and database integration.

✨ Key Features

🔐 Authentication and Authorization

User registration and login.

JWT-based authentication.

Secure access to protected routes and API endpoints.

Role-based access for producers and consumers.

☀️ Producer Dashboard

View producer account information.

Manage energy-selling information.

View energy trading activity.

Manage available energy offers.

🏠 Consumer Dashboard

View consumer account information.

Browse available energy offers.

Explore producer listings.

Submit energy purchase requests.

⚡ Energy Trading System

Connect energy producers with consumers.

Display available energy offers.

Support energy purchase requests and trading workflows.

Manage producer and consumer interactions.

🗄️ Database Integration

PostgreSQL for persistent data storage.

SQLAlchemy for database operations and ORM functionality.

Structured data management for users, roles, and energy trading records.

📱 Responsive User Interface

React-based frontend.

Responsive layouts for different screen sizes.

Interactive dashboards and user-friendly navigation.

🛠️ Tech Stack

Layer

Technologies

Frontend

React.js, JavaScript, CSS

Backend

Python, FastAPI

Authentication

JSON Web Tokens (JWT)

ORM

SQLAlchemy

Database

PostgreSQL

API Communication

REST API

HTTP Client

Axios

🏗️ System Architecture

The application follows a client-server architecture.

                 ┌──────────────────────┐
                 │       Users          │
                 │ Producers / Consumers│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   React Frontend     │
                 │ Dashboards and UI    │
                 └──────────┬───────────┘
                            │
                      REST API / HTTP
                            │
                            ▼
                 ┌──────────────────────┐
                 │   FastAPI Backend    │
                 │ Business Logic       │
                 │ JWT Authentication   │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    SQLAlchemy ORM    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   PostgreSQL DB      │
                 │ Users and Trades     │
                 └──────────────────────┘

🔄 How It Works

Register: A user creates an account as a producer or consumer.

Authenticate: The user logs in and receives an authentication token.

Access Dashboard: The application displays features according to the user's role.

List Energy: Producers publish their available surplus energy and selling details.

Request Energy: Consumers browse offers and submit purchase requests.

Manage Trades: Producers review requests, and the application records supported trading activities.

Store Data: User information and trading records are stored in PostgreSQL.
