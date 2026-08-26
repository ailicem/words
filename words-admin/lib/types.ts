export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type AdminItem = SafeUser;