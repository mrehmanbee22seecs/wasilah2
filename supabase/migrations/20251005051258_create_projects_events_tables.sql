/*
  # Create Projects and Events Management System

  ## Overview
  This migration creates comprehensive tables for managing community projects and events
  with user submission workflow, admin approval system, and detailed tracking.

  ## New Tables
  
  ### `project_submissions`
  Stores all project proposals submitted by users
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Project name
  - `description` (text) - Detailed project description
  - `category` (text) - Project category
  - `location` (text) - City/region
  - `address` (text) - Full address
  - `latitude` (numeric) - GPS coordinate
  - `longitude` (numeric) - GPS coordinate
  - `start_date` (date) - Project start
  - `end_date` (date) - Project end
  - `expected_volunteers` (integer) - Number of volunteers needed
  - `target_audience` (text) - Who the project serves
  - `duration_estimate` (text) - Estimated duration
  - `requirements` (text[]) - Array of requirements
  - `objectives` (text[]) - Array of objectives
  - `contact_email` (text) - Contact email
  - `contact_phone` (text) - Contact phone
  - `budget` (text) - Project budget
  - `timeline` (text) - Timeline description
  - `notes` (text) - Additional notes
  - `image` (text) - Image URL
  - `submitted_by` (uuid, foreign key to auth.users) - User who submitted
  - `submitter_name` (text) - Name of submitter
  - `submitter_email` (text) - Email of submitter
  - `status` (text) - draft, pending, approved, rejected
  - `submitted_at` (timestamptz) - When submitted
  - `reviewed_at` (timestamptz) - When reviewed
  - `reviewed_by` (uuid) - Admin who reviewed
  - `admin_comments` (text) - Admin feedback
  - `rejection_reason` (text) - If rejected, why
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ### `event_submissions`
  Stores all event proposals submitted by users
  - Similar structure to projects but event-specific fields
  - `date` (date) - Event date
  - `time` (text) - Event time
  - `expected_attendees` (integer) - Expected participants
  - `registration_deadline` (date) - Last day to register
  - `agenda` (text[]) - Event agenda items
  - `cost` (text) - Event cost (Free, $10, etc.)

  ## Security
  - Row Level Security enabled on all tables
  - Users can view their own submissions
  - Users can create new submissions
  - Users can update their own draft submissions
  - Admins can view, update, and manage all submissions
  - Public can view approved submissions only

  ## Indexes
  - Index on `status` for filtering
  - Index on `submitted_by` for user queries
  - Index on `category` for filtering
*/

-- Create project_submissions table
CREATE TABLE IF NOT EXISTS project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  address text DEFAULT '',
  latitude numeric,
  longitude numeric,
  start_date date NOT NULL,
  end_date date NOT NULL,
  expected_volunteers integer DEFAULT 10,
  target_audience text DEFAULT '',
  duration_estimate text DEFAULT '',
  requirements text[] DEFAULT '{}',
  objectives text[] DEFAULT '{}',
  contact_email text NOT NULL,
  contact_phone text DEFAULT '',
  budget text DEFAULT '',
  timeline text NOT NULL,
  notes text DEFAULT '',
  image text DEFAULT '',
  submitted_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_comments text DEFAULT '',
  rejection_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_submissions table
CREATE TABLE IF NOT EXISTS event_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  address text DEFAULT '',
  latitude numeric,
  longitude numeric,
  expected_attendees integer DEFAULT 50,
  target_audience text DEFAULT '',
  duration_estimate text DEFAULT '',
  registration_deadline date NOT NULL,
  requirements text[] DEFAULT '{}',
  agenda text[] DEFAULT '{}',
  contact_email text NOT NULL,
  contact_phone text DEFAULT '',
  cost text DEFAULT 'Free',
  notes text DEFAULT '',
  image text DEFAULT '',
  submitted_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_comments text DEFAULT '',
  rejection_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_project_submissions_submitted_by ON project_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_project_submissions_category ON project_submissions(category);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_submitted_by ON event_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_event_submissions_category ON event_submissions(category);

-- Enable Row Level Security
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_submissions

-- Public can view approved projects
CREATE POLICY "Anyone can view approved projects"
  ON project_submissions FOR SELECT
  USING (status = 'approved');

-- Users can view their own submissions
CREATE POLICY "Users can view own project submissions"
  ON project_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by);

-- Authenticated users can create submissions
CREATE POLICY "Authenticated users can create project submissions"
  ON project_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Users can update their own draft submissions
CREATE POLICY "Users can update own draft projects"
  ON project_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by AND status = 'draft')
  WITH CHECK (auth.uid() = submitted_by);

-- Admins can view all submissions (implement via app logic checking user role)
-- Admins can update any submission (implement via app logic checking user role)

-- RLS Policies for event_submissions

-- Public can view approved events
CREATE POLICY "Anyone can view approved events"
  ON event_submissions FOR SELECT
  USING (status = 'approved');

-- Users can view their own submissions
CREATE POLICY "Users can view own event submissions"
  ON event_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by);

-- Authenticated users can create submissions
CREATE POLICY "Authenticated users can create event submissions"
  ON event_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Users can update their own draft submissions
CREATE POLICY "Users can update own draft events"
  ON event_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by AND status = 'draft')
  WITH CHECK (auth.uid() = submitted_by);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_project_submissions_updated_at ON project_submissions;
CREATE TRIGGER update_project_submissions_updated_at
  BEFORE UPDATE ON project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_submissions_updated_at ON event_submissions;
CREATE TRIGGER update_event_submissions_updated_at
  BEFORE UPDATE ON event_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
