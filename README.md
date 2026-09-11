# 🌸 AASTU Muslim Sisters — Resource Sharing Platform

> **A simple, organized academic resource hub for AASTU Muslim Sisters.**

The **AASTU Muslim Sisters Resource Sharing Platform** is a community-driven academic website created for the girls' **Jemaea** at Addis Ababa Science and Technology University (AASTU).

The idea came from a simple problem:

📚 **Academic resources were being shared through Telegram, but as the number of departments and resources increased, finding the right material became difficult.**

Notes, assignments, midterm exams, final exams, presentations, and other resources could easily get buried among hundreds of Telegram messages.

This platform provides a **centralized and organized place** where AASTU Muslim Sisters can find, share, and manage academic resources according to their college, department, year, and category.

---

## 🎯 The Problem

Telegram is useful for communication, but it is not designed to be an academic resource management system.

As resources were shared in Jemaea Telegram groups:

* 📂 Resources became scattered across many messages.
* 🔎 Finding an old resource became difficult.
* 🏫 Different departments had different resources.
* 🎓 Students from different years needed different materials.
* 📄 Important notes and exams could easily get lost.
* ⏳ Students spent unnecessary time searching through old messages.

### The goal

Instead of searching through Telegram history:

> **Choose your college → choose your department → choose your year → find your resource.**

---

## ✨ Features

### 📚 Organized Resources

Resources are organized based on:

* College
* Department
* Academic year
* Semester
* Resource category

This makes it easier for students to find exactly what they need.

### 🏫 College Selection

Students can first select their college:

* **College of Engineering**
* **College of Applied Science**

The available departments and academic years are then organized accordingly.

### 📄 Resource Sharing

Students can share useful academic materials such as:

* 📝 Lecture notes
* 📊 PowerPoint presentations
* 📖 Assignments
* 🧪 Midterm exams
* 🎓 Final exams
* 📁 Projects
* 📚 Other study materials

### 🗑️ Resource Management

Users can remove resources they have uploaded when they are no longer needed or were uploaded by mistake.

### ⏱️ Study Timer

A built-in timer helps students track their study sessions and stay focused.

### 🔥 Study Streak

Students can maintain a study streak to encourage consistency and regular study habits.

### 📱 Simple & Student-Friendly

The platform is designed to be:

* Easy to navigate
* Mobile-friendly
* Fast
* Clean
* Accessible without complicated registration

---

## 🧭 How It Works

The platform follows a simple structure:

```text
AASTU Muslim Sisters
        │
        ▼
     College
        │
   ┌────┴────┐
   ▼         ▼
Engineering  Applied Science
   │             │
   ▼             ▼
Department    Department
   │             │
   ▼             ▼
 Academic Year
        │
        ▼
     Semester
        │
        ▼
    Resources
```

Students don't need to search through hundreds of messages.

They can simply navigate through the academic structure and find the material they need.

---

## 🌱 Why We Built It

This project was created with the **AASTU Muslim Sisters Jemaea** in mind.

The motivation wasn't to replace Telegram.

Telegram can still be used for:

* Announcements
* Discussions
* Reminders
* Community communication

Instead, this platform is intended to handle something Telegram isn't particularly good at:

> **Organizing and preserving academic resources.**

The platform separates **communication** from **resource management**, making both easier.

---

## 👩‍💻 Built For Students, By Students

This project is designed around the actual academic experience of AASTU students.

The goal is to create a place where students can:

**Share → Find → Study → Progress**

rather than:

**Search Telegram → Scroll → Search again → Give up 😭**

---

## 🛠️ Technology

The project is built using modern web technologies.

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend & Database

* Next.js API/server functionality
* Prisma ORM
* PostgreSQL
* Supabase

### Deployment

* Vercel

### Development Tools

* Git
* GitHub
* pnpm
* Prisma

---

## 📁 Project Structure

```text
aastu-muslim-sisters/
│
├── app/
│   ├── ...
│   └── ...
│
├── components/
│   └── ...
│
├── data/
│   └── ...
│
├── lib/
│   ├── prisma.ts
│   └── ...
│
├── prisma/
│   └── schema.prisma
│
├── public/
│   └── ...
│
├── .env.example
├── package.json
├── next.config.mjs
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SarahRedwan/SISTERS_Resource_Sharing.git
```

### 2. Navigate into the project

```bash
cd SISTERS_Resource_Sharing
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="your_database_connection_string"
DIRECT_URL="your_direct_database_connection_string"
```

Add any other environment variables required by the project.

### 5. Generate Prisma Client

```bash
pnpm prisma generate
```

### 6. Run database migrations

```bash
pnpm prisma migrate dev
```

### 7. Start the development server

```bash
pnpm dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## 🤝 Contribution

This platform is intended to grow with the AASTU Muslim Sisters community.

Students can contribute by:

* Sharing useful academic resources
* Reporting incorrect or outdated materials
* Suggesting improvements
* Helping organize resources
* Contributing to the codebase

If you would like to contribute to the development of the platform, feel free to open an issue or submit a pull request.

---

## 🔐 Community Responsibility

Because this platform is built for students and academic resource sharing, everyone is encouraged to use it responsibly.

Please:

* Upload resources that are useful for students.
* Avoid uploading unrelated or harmful content.
* Do not upload private or sensitive information.
* Respect the work and materials of others.
* Make sure shared resources are relevant to the selected department and year.

---

## 🌸 Vision

The long-term vision is to build a reliable academic space where AASTU Muslim Sisters can easily access the resources they need throughout their university journey.

What started as a simple problem with resources getting lost in Telegram can become a structured academic community platform.

### From scattered messages...

```text
📱 Telegram
   ↓
Hundreds of messages
   ↓
Resources get buried
   ↓
Students struggle to find them
```

### To organized learning...

```text
🌸 AASTU Muslim Sisters Platform
             ↓
          College
             ↓
         Department
             ↓
            Year
             ↓
         Semester
             ↓
          Resource
```

---

## 💡 The Idea in One Sentence

> **A centralized academic resource-sharing platform created for AASTU Muslim Sisters to make finding and sharing study materials easier, faster, and more organized than relying on scattered Telegram messages.**

---

## ❤️ Made for the AASTU Muslim Sisters Jemaea

Built with the intention of making students' academic lives a little easier.

**Learn. Share. Support. Grow. 🌸**

---

### 📌 Project

**AASTU Muslim Sisters Resource Sharing Platform**

**Repository:** `SISTERS_Resource_Sharing`

**Purpose:** Academic resource sharing and study support for AASTU Muslim Sisters.
