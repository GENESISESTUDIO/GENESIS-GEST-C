export type CompanyStatus = "active" | "suspended" | "trial";
export type SubscriptionPlan = "basic" | "professional" | "enterprise";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type UserRole = "admin" | "director" | "project_manager" | "engineer" | "foreman" | "surveyor" | "hse_officer" | "accountant" | "viewer";
export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "windy" | "extreme_heat";
export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";
export type IssueType = "rocky_soil" | "rain_delay" | "third_party_network" | "equipment_failure" | "material_shortage" | "safety_incident" | "permit_delay" | "other";
export type Severity = "low" | "medium" | "high" | "critical";
export type ResolutionStatus = "open" | "in_progress" | "resolved" | "escalated";
export type PhotoType = "morning_meeting" | "site_closing" | "progress" | "safety" | "equipment" | "issue_evidence" | "measurement_evidence" | "before" | "after";
export type EquipmentType = "Escavadora" | "Camião" | "Betoneira" | "Compactador" | "Gerador" | "Bomba" | "Outro";
export type OperationalStatus = "Operacional" | "Em Manutenção" | "Avariado" | "Inativo";
export type MaterialUnit = "kg" | "ton" | "m" | "m2" | "m3" | "un" | "saco";
export type BudgetUnit = "meters" | "square_meters" | "cubic_meters" | "units" | "tons" | "kg" | "liters";

export interface Company {
  id?: string;
  name: string;
  logo_url?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry: string;
  country: string;
  status: CompanyStatus;
  plan: SubscriptionPlan;
  max_users: number;
  max_projects: number;
  primary_color: string;
  director_email: string;
  notes?: string;
}

export interface Project {
  id?: string;
  company_id: string;
  project_name: string;
  client_name: string;
  total_budget: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  project_manager?: string;
  project_manager_signature?: string;
  main_contractor?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  subcontractor?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface UserPermission {
  id?: string;
  user_email: string;
  role: UserRole;
  assigned_projects: string[];
  page_permissions: {
    can_create_rdo: boolean;
    can_approve_rdo: boolean;
    can_manage_attendance: boolean;
    can_register_issues: boolean;
    can_approve_measurements: boolean;
    can_generate_reports: boolean;
    can_manage_workers: boolean;
    can_manage_users: boolean;
    can_view_financials: boolean;
  };
  custom_permissions: string[];
}

export interface DailyReport {
  id?: string;
  company_id: string;
  project_id: string;
  report_date: string;
  weather_condition?: WeatherCondition;
  temperature?: number;
  activities_summary?: string;
  work_fronts?: {
    front_name: string;
    description: string;
    progress_percentage: number;
  }[];
  general_notes?: string;
  morning_meeting_photo?: string;
  closing_photo?: string;
  gps_location?: { lat: number; lng: number };
  approved_by?: string;
  approval_status: ApprovalStatus;
}

export interface Task {
  id?: string;
  company_id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  priority: Severity;
  status: "pending" | "in_progress" | "completed" | "blocked";
  category?: string;
  notes?: string;
}

export interface Worker {
  id?: string;
  company_id: string;
  full_name: string;
  id_number?: string;
  work_category_id: string;
  custom_hourly_rate?: number;
  accumulated_balance: number;
  phone_number?: string;
  emergency_contact?: string;
  status: "active" | "inactive" | "suspended" | "on_leave";
  bank_account?: string;
  hire_date?: string;
  certifications?: string[];
}

export interface BudgetItem {
  id?: string;
  company_id: string;
  project_id: string;
  item_code?: string;
  chapter?: string;
  description: string;
  unit: BudgetUnit;
  contracted_quantity: number;
  unit_price: number;
  total_budgeted?: number;
  measured_to_date: number;
  value_to_date: number;
  percentage_complete: number;
  source_document?: string;
  notes?: string;
}
