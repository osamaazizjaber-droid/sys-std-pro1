// sys-wms-web/js/config.js
// Configuration File for Supabase Credentials

// Replace these values with your actual Supabase project credentials!
// You can find these in your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://aphtvvmmjupdbjxwvmjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHR2dm1tanVwZGJqeHd2bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjc3NjEsImV4cCI6MjA4OTk0Mzc2MX0.Kp8y_726MnFd4y2KAQE5OF52XQbuOrjYf-VmeHWGmPE';

// Initialize Supabase client
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

