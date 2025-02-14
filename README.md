# Video Hosting Backend System

A **scalable** and **secure** backend system for video hosting and streaming, enabling seamless upload, storage, and playback of videos. Designed to handle **high traffic** and ensure a smooth user experience.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication
- Secure password management

### 📺 Video & Content Management
- Upload, publish, update, and delete videos
- Fetch all videos with optimized queries
- Scalable storage & streaming with **Cloudinary & Multer**

### 📜 Watch History
- Efficient tracking and retrieval of user watch history

### 🔄 CRUD Operations
- **Profile Management** – Update account details, avatar, and cover image
- **Videos** – Upload, update, delete, and fetch
- **Subscriptions** – Manage user subscriptions
- **Playlists** – Create, update, delete, and manage videos within them
- **Tweets** – Create, update, delete, and engage

### 📊 Channel & User Insights
- Fetch real-time **channel statistics** and **videos**

### 🎭 Engagement & Social Features
- Like/Unlike **videos, comments, and tweets**
- Add, update, delete, and fetch **video comments**
- Subscription system to **toggle subscriptions**, get **user subscribers**, and **subscribed channels**

### 🗂 Playlist Management
- Create, update, delete playlists
- Manage videos within playlists

### 📝 Tweet System
- Create, update, delete tweets
- Engage with tweets via likes and comments

### 👤 User Management
- Signup, login, logout
- Change password
- Update account details, avatar, and cover image

## 🏗 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Storage & Streaming:** Cloudinary, Multer
- **Authentication:** JWT, bcrypt.js

## 📦 Installation

Clone the repository:
```bash
git clone https://github.com/your-username/video-backend.git
cd video-backend
```

Install dependencies:
```bash
npm install
```

Create a **.env** file and configure the following:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Run the development server:
```bash
npm run dev
```

## 💡 Contributing
Feel free to **fork** this repository, create a **feature branch**, and submit a **pull request**!

## 📧 Contact
For inquiries, reach out via **prabhsingh1407@gmail.com**.