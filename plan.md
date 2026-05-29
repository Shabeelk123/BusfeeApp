Bus Fee Tracker — Complete Development Plan
Tech Stack
Frontend
React Native
Expo
Expo Router
Redux Toolkit
React Hook Form
Backend
Supabase
Database
PostgreSQL (Supabase managed)
1. Project Goal

Build a role-based school transport fee management application with separate dashboards and permissions for:

ADMIN
TEACHER
STUDENT

The system should manage:

students
transport fee tracking
buses
classes
fee payments
reports
role-based access

The application must support around:

1500 students
multiple teachers
admin operations
secure access control
scalable database structure
2. Architecture
Expo React Native App
        ↓
Supabase Client SDK
        ↓
Supabase PostgreSQL

No Express backend initially.

Use:

Supabase Auth
Supabase PostgreSQL
Row Level Security (RLS)
3. Folder Structure
Root Structure
Busfee_tracker/
│
├── app/
├── components/
├── services/
├── lib/
├── hooks/
├── store/
├── constants/
├── utils/
├── assets/
├── types/
├── supabase/
├── package.json
└── app.json
4. App Folder Structure

Use Expo Router route groups.

app/
│
├── _layout.jsx
├── index.jsx
│
├── (auth)/
│   ├── login.jsx
│   ├── register.jsx
│   └── forgot-password.jsx
│
├── (admin)/
│   ├── dashboard.jsx
│   ├── students/
│   ├── teachers/
│   ├── buses/
│   ├── classes/
│   ├── fees/
│   └── reports/
│
├── (teacher)/
│   ├── dashboard.jsx
│   ├── students/
│   ├── fees/
│   └── profile/
│
├── (student)/
│   ├── dashboard.jsx
│   ├── my-fees.jsx
│   ├── payment-history.jsx
│   ├── bus-details.jsx
│   └── profile/
5. Roles & Permissions
ADMIN

Can:

manage students
manage teachers
manage buses
manage classes
view all reports
manage fee records
TEACHER

Can:

view assigned students
register students
update fee payment status
view pending fees
STUDENT

Can:

view fee details
view payment history
view assigned bus
view profile
6. Database Design

Use Supabase SQL Editor.

users Table
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  name text,
  email text unique,
  role text not null,
  phone text,
  created_at timestamp default now()
);
classes Table
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text,
  section text,
  created_at timestamp default now()
);
buses Table
create table buses (
  id uuid primary key default gen_random_uuid(),
  bus_number text,
  route_name text,
  fee_amount numeric,
  driver_name text,
  created_at timestamp default now()
);
students Table
create table students (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references users(id),

  class_id uuid references classes(id),

  bus_id uuid references buses(id),

  admission_no text unique,

  parent_name text,

  address text,

  status text default 'ACTIVE',

  created_at timestamp default now()
);
fee_payments Table
create table fee_payments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid references students(id),

  month text,

  year text,

  amount numeric,

  status text,

  paid_at timestamp,

  received_by uuid references users(id),

  created_at timestamp default now()
);
7. Required Database Indexes
create index idx_students_user_id
on students(user_id);

create index idx_students_class_id
on students(class_id);

create index idx_students_bus_id
on students(bus_id);

create index idx_fee_student_id
on fee_payments(student_id);
8. Supabase Setup
Install
npm install @supabase/supabase-js
npm install react-native-url-polyfill
Create Client
lib/supabase.js
import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
Environment Variables
EXPO_PUBLIC_SUPABASE_URL=YOUR_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY
9. Authentication Flow
Signup Flow
User Signup
    ↓
Supabase Auth Signup
    ↓
Insert into users table
    ↓
Store role
Login Flow
Login
   ↓
Get Auth User
   ↓
Fetch role from users table
   ↓
Redirect based on role
Role Redirect Logic
ADMIN   → /(admin)
TEACHER → /(teacher)
STUDENT → /(student)
10. Row Level Security (RLS)

Enable RLS for ALL tables.

alter table users enable row level security;
alter table students enable row level security;
alter table fee_payments enable row level security;
alter table buses enable row level security;
alter table classes enable row level security;
Example Policies
Students can view own data
create policy "student view own profile"
on students
for select
using (
  auth.uid() = user_id
);
Admin full access
create policy "admin full access"
on students
for all
using (true);
11. Services Structure
services/
│
├── auth.service.js
├── student.service.js
├── teacher.service.js
├── class.service.js
├── bus.service.js
├── fee.service.js
└── report.service.js
Example Service
student.service.js
import { supabase } from "../lib/supabase";

export const getStudents = async () => {
  return await supabase
    .from("students")
    .select("*");
};

export const createStudent = async (payload) => {
  return await supabase
    .from("students")
    .insert([payload]);
};
12. Redux Structure
store/
│
├── index.js
├── authSlice.js
├── studentSlice.js
├── feeSlice.js
└── busSlice.js

Store:

authenticated user
role
loading states
cached records
13. Shared Components
components/
│
├── ui/
├── forms/
├── cards/
├── common/
└── tables/
Important Components
AppButton
AppInput
Loader
EmptyState
StudentCard
FeeCard
BusCard
14. Development Order
PHASE 1 — Foundation

Tasks:

setup Supabase
setup auth
create tables
create RLS
create navigation
create role redirect

Deliverable:

login working
protected routes working
PHASE 2 — Student Module

Tasks:

student CRUD
student list
student details
add/edit student

Deliverable:

admin can manage students
PHASE 3 — Bus Module

Tasks:

bus CRUD
assign buses
bus fee structure

Deliverable:

students assigned to buses
PHASE 4 — Class Module

Tasks:

class CRUD
assign students to classes

Deliverable:

class organization working
PHASE 5 — Fee Module

Tasks:

create payment
payment history
pending fee tracking
monthly fee status

Deliverable:

fee management operational
PHASE 6 — Dashboards
Admin Dashboard

Show:

total students
total buses
pending fees
monthly collection
Teacher Dashboard

Show:

assigned students
pending payments
Student Dashboard

Show:

fee status
payment history
bus info
PHASE 7 — Reports

Tasks:

pending fee report
monthly collection report
class-wise reports
15. Performance Rules
MUST FOLLOW
Use pagination
.range(0, 20)
Never use large select *

Fetch only needed columns.

Use indexes

Required for:

student_id
class_id
bus_id
Avoid unnecessary realtime

Use realtime only if actually needed.

16. UI/UX Rules
Must Include
loading states
empty states
pull-to-refresh
form validation
error handling
confirmation dialogs
17. Security Rules
Must Follow
enable RLS on every table
never expose service role key
validate user role before actions
restrict student access to own records
18. Deployment Strategy
Initial

Use:

Supabase hosted backend
Expo development build
Production Later

Possible future upgrades:

Express backend
custom APIs
push notifications
payment gateway
PDF receipts

Only after MVP stabilizes.

19. Recommended Initial Deliverables
MVP Scope
ADMIN
login
manage students
manage buses
manage classes
manage fees
TEACHER
view students
update fees
STUDENT
view fee details
20. Important Development Guidelines
DO NOT
overengineer architecture
add backend server now
add unnecessary libraries
optimize too early
build all screens first
DO
build feature by feature
complete vertical slices
test after every module
maintain clean services
keep UI modular
21. Recommended Build Sequence
1. Supabase setup
2. Authentication
3. Role redirect
4. Student CRUD
5. Bus CRUD
6. Class CRUD
7. Fee payments
8. Dashboards
9. Reports
10. UI polish
11. Deployment

This plan should be treated as the primary implementation instruction set for all development agents working on the Bus Fee Tracker application.