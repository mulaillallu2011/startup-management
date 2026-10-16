"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/app/dashboard/ConfirmDialog";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "inactive";

export default function UsersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] =
    useState<"admin" | "user">("user");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [pendingAction, setPendingAction] =
    useState<{
      profile: Profile;
      type: "role" | "status";
      nextRole?: "admin" | "user";
      nextStatus?: boolean;
    } | null>(null);

  const loadUsers = useCallback(async () => {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, created_at, updated_at"
      )
      .order("created_at", { ascending: true });

    if (profilesError) {
      setError(profilesError.message);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as Profile[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadUsers]);

  function startEditing(profile: Profile) {
    setEditingId(profile.id);
    setEditName(profile.full_name ?? "");
    setEditRole(profile.role);

    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    if (saving) return;

    setEditingId(null);
    setEditName("");
    setEditRole("user");
  }

  function requestSaveUser(profile: Profile) {
    setError("");
    setSuccess("");

    const name = editName.trim();

    if (!name) {
      setError("Full name cannot be empty.");
      return;
    }

    if (
      profile.id === currentUserId &&
      editRole !== "admin"
    ) {
      setError(
        "You cannot remove the admin role from your own account."
      );
      return;
    }

    const roleChanged = profile.role !== editRole;

    if (roleChanged) {
      setPendingAction({
        profile,
        type: "role",
        nextRole: editRole,
      });

      return;
    }

    void performSaveUser(profile);
  }

  async function performSaveUser(profile: Profile) {
    setError("");
    setSuccess("");
    setSaving(true);

    const name = editName.trim();

    if (!name) {
      setError("Full name cannot be empty.");
      setSaving(false);
      return;
    }

    if (
      profile.id === currentUserId &&
      editRole !== "admin"
    ) {
      setError(
        "You cannot remove the admin role from your own account."
      );
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        role: editRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      setPendingAction(null);
      return;
    }

    setEditingId(null);
    setEditName("");
    setEditRole("user");
    setPendingAction(null);

    await loadUsers();

    setSuccess("User profile updated successfully.");
    setSaving(false);
  }

  function requestStatusChange(profile: Profile) {
    setError("");
    setSuccess("");

    if (profile.id === currentUserId && profile.is_active) {
      setError(
        "You cannot deactivate your own account."
      );
      return;
    }

    setPendingAction({
      profile,
      type: "status",
      nextStatus: !profile.is_active,
    });
  }

  async function performStatusChange(
    profile: Profile,
    nextStatus: boolean
  ) {
    setError("");
    setSuccess("");
    setSaving(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_active: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      setPendingAction(null);
      return;
    }

    setPendingAction(null);

    await loadUsers();

    setSuccess(
      nextStatus
        ? "User account activated successfully."
        : "User account deactivated successfully."
    );

    setSaving(false);
  }

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesSearch =
        !query ||
        (profile.full_name ?? "")
          .toLowerCase()
          .includes(query) ||
        (profile.email ?? "")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "all" ||
        profile.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          profile.is_active) ||
        (statusFilter === "inactive" &&
          !profile.is_active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    profiles,
    search,
    roleFilter,
    statusFilter,
  ]);

  const adminCount = profiles.filter(
    (profile) => profile.role === "admin"
  ).length;

  const userCount = profiles.filter(
    (profile) => profile.role === "user"
  ).length;

  const activeCount = profiles.filter(
    (profile) => profile.is_active
  ).length;

  const inactiveCount = profiles.filter(
    (profile) => !profile.is_active
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              User Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Manage user profiles, access roles, and account
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Refreshing..." : "Refresh Users"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total"
          value={profiles.length}
          description="All profiles"
        />

        <StatCard
          title="Admins"
          value={adminCount}
          description="Admin accounts"
        />

        <StatCard
          title="Users"
          value={userCount}
          description="Standard accounts"
        />

        <StatCard
          title="Active"
          value={activeCount}
          description="Active accounts"
        />

        <StatCard
          title="Inactive"
          value={inactiveCount}
          description="Disabled accounts"
        />
      </div>

      {/* Info */}
      <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
            i
          </div>

          <div>
            <p className="font-semibold text-blue-900">
              Account management
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              You can edit profile information and application
              roles, or temporarily deactivate an account.
              Authentication-level account operations should
              remain in a protected server-side workflow.
            </p>
          </div>
        </div>
      </div>

      {/* User List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                User Profiles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredProfiles.length} of{" "}
                {profiles.length} profile
                {profiles.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[700px]">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name or email..."
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value as RoleFilter
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm font-medium text-slate-500">
              Loading users...
            </p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No profiles found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create an Authentication account and then add
              its profile.
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No matching users
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    User
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Role
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Created
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((profile) => {
                  const isEditing =
                    editingId === profile.id;

                  const isCurrentUser =
                    profile.id === currentUserId;

                  return (
                    <tr
                      key={profile.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* User */}
                      <td className="px-6 py-5 align-top">
                        {isEditing ? (
                          <div className="min-w-[260px]">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Full Name
                            </label>

                            <input
                              value={editName}
                              onChange={(event) =>
                                setEditName(
                                  event.target.value
                                )
                              }
                              placeholder="Full name"
                              autoFocus
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                              {profile.email ||
                                "Email unavailable"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {profile.full_name ||
                                  "Unnamed User"}
                              </p>

                              {isCurrentUser && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                  You
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                              {profile.email ||
                                "Email unavailable"}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-5 align-top">
                        {isEditing ? (
                          <div className="min-w-[150px]">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Access Role
                            </label>

                            <select
                              value={editRole}
                              onChange={(event) =>
                                setEditRole(
                                  event.target.value as
                                    | "admin"
                                    | "user"
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="admin">
                                Admin
                              </option>

                              <option value="user">
                                User
                              </option>
                            </select>
                          </div>
                        ) : (
                          <RoleBadge role={profile.role} />
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 align-top">
                        <StatusBadge
                          active={profile.is_active}
                        />
                      </td>

                      {/* Created */}
                      <td className="px-6 py-5 align-top text-sm text-slate-500">
                        {formatDate(profile.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 align-top">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                requestSaveUser(profile)
                              }
                              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {saving
                                ? "Saving..."
                                : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={cancelEditing}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(profile)
                              }
                              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusChange(
                                    profile
                                  )
                                }
                                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                  profile.is_active
                                    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                {profile.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Security Note */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
            !
          </div>

          <div>
            <p className="font-semibold text-amber-900">
              Admin safety
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              The currently signed-in admin cannot deactivate
              their own account or remove their own admin role.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "status"
            ? pendingAction.nextStatus
              ? "Activate user?"
              : "Deactivate user?"
            : "Confirm role change"
        }
        description={
          pendingAction
            ? pendingAction.type === "status"
              ? `You are ${
                  pendingAction.nextStatus
                    ? "activating"
                    : "deactivating"
                } ${
                  pendingAction.profile.full_name ||
                  pendingAction.profile.email ||
                  "this user"
                }.`
              : `You are changing ${
                  pendingAction.profile.full_name ||
                  pendingAction.profile.email ||
                  "this user's"
                } role from ${capitalize(
                  pendingAction.profile.role
                )} to ${capitalize(
                  pendingAction.nextRole ?? editRole
                )}.`
            : ""
        }
        confirmText={
          pendingAction?.type === "status"
            ? pendingAction.nextStatus
              ? "Activate"
              : "Deactivate"
            : "Change Role"
        }
        cancelText="Cancel"
        danger={
          pendingAction?.type === "status"
            ? pendingAction.nextStatus === false
            : pendingAction?.nextRole === "admin"
        }
        loading={saving}
        onConfirm={() => {
          if (!pendingAction) return;

          if (pendingAction.type === "status") {
            void performStatusChange(
              pendingAction.profile,
              pendingAction.nextStatus ?? true
            );

            return;
          }

          void performSaveUser(pendingAction.profile);
        }}
        onCancel={() => {
          if (!saving) {
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: "admin" | "user";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        role === "admin"
          ? "bg-purple-100 text-purple-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}