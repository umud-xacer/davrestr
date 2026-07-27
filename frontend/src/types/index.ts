export type Role =
  | "citizen"
  | "cabinet_employee"
  | "cabinet_approver"
  | "org_admin"
  | "superadmin";

export interface UserOut {
  id: string;
  full_name: string;
  username: string;
  role: Role;
  organization_id: string | null;
  oneid_verified: boolean;
}

export type FieldType = "text" | "number" | "date" | "select" | "boolean" | "file" | "list";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[] | null;
  item_fields?: FieldDef[] | null; // faqat type === "list" uchun
}

export interface RegistryTypeOut {
  id: string;
  code: string;
  name: string;
  description: string | null;
  field_schema: FieldDef[];
  public_fields: string[];
  is_active: boolean;
}

export type RegistryStatus = "draft" | "payment_pending" | "paid" | "active" | "suspended" | "terminated" | "violated";

export interface RegistryRecordOut {
  id: string;
  registry_type_id: string;
  record_number: string;
  subject_pinfl: string | null;
  subject_name: string | null;
  data: Record<string, any>;
  status: RegistryStatus;
  source_channel: string;
  verify_code: string;
  signed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicRecordOut {
  record_number: string;
  registry_type_name: string;
  status: RegistryStatus;
  data: Record<string, any>;
  field_defs: FieldDef[];
  published_at: string | null;
  verify_code: string;
}

export interface CaptchaOut {
  token: string;
  image_base64: string;
}

export interface RevealCodeOut {
  token: string;
  code: string;
}

export type ContentType = "news" | "service" | "announcement";

export interface PublicContentItemOut {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  image_url: string | null;
  published_at: string | null;
}

export interface ContentItemOut extends PublicContentItemOut {
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "payment_pending"
  | "paid"
  | "approved"
  | "rejected";

export interface ApplicationOut {
  id: string;
  service_title: string;
  full_name: string;
  phone: string;
  message: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogOut {
  id: string;
  actor_username: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface OrganizationOut {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}
