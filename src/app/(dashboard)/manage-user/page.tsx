"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Save, X, RefreshCw, Eye, EyeOff, Search, Edit, Trash2, Eye as EyeIcon, ShieldAlert, FileText, UserCheck, Users } from "lucide-react";
import { getAuthHeaders } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function ManageUsersPage() {
    const [activeTab, setActiveTab] = useState<"add" | "list" | "logs" | "status">("add");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        mobileNumber: "",
        designation: "",
        role: "",
        username: "",
        password: "",
        confirmPassword: "",
        modules: [] as string[],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    const { isReadOnly } = usePermission("User Management");

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const [viewingUser, setViewingUser] = useState<any>(null);
    const [isViewLoading, setIsViewLoading] = useState(false);

    // Password reset state for Super Admin
    const [resettingPasswordUserId, setResettingPasswordUserId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isResetLoading, setIsResetLoading] = useState(false);

    // Dynamic User logs state for Tab 3
    const [userLogs, setUserLogs] = useState<any[]>([
        { id: 1, username: "9403226464 (Super Admin)", action: "Logged In", timestamp: "2026-07-03 14:30:22", ipAddress: "192.168.1.45" },
    ]);

    // Current logged-in user context
    const currentLoggedUserRole = "Super Admin";
    const currentLoggedUsername = "9403226464";

    const addAuditLog = (actionText: string) => {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newLog = {
            id: Date.now(),
            username: `${currentLoggedUsername} (${currentLoggedUserRole})`,
            action: actionText,
            timestamp: timestamp,
            ipAddress: "127.0.0.1 (Localhost)"
        };
        setUserLogs(prevLogs => [newLog, ...prevLogs]);
    };

    const fetchUsers = async () => {
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
            const res = await fetch(`${BACKEND_URL}/users/view`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                const mappedUsers = data.map((u: any) => ({
                    id: u.user_id,
                    employeeId: u.contact_number,
                    fullName: u.full_name,
                    username: u.username || u.contact_number,
                    role: u.role,
                    email: u.email_id,
                    mobileNumber: u.contact_number,
                    lastLogin: u.last_login || "Never",
                    modules: u.modules_access || [],
                    designation: u.designation || "",
                    status: u.status || "Active",
                }));
                setUsers(mappedUsers);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleView = async (user: any) => {
        setIsViewLoading(true);
        setViewingUser({ ...user, isLoading: true });
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
            const res = await fetch(`${BACKEND_URL}/users/view/${user.id}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    setViewingUser(data.user);
                    addAuditLog(`Viewed details for user: ${user.fullName}`);
                } else {
                    alert("User not found.");
                    setViewingUser(null);
                }
            } else {
                alert("Unable to load user details.");
                setViewingUser(null);
            }
        } catch (e) {
            console.error(e);
            alert("Unable to load user details.");
            setViewingUser(null);
        } finally {
            setIsViewLoading(false);
        }
    };

    const modulesList = [
        "Dashboard", "Order Initiation", "Specifications", "Stock Check",
        "BOM Calculation", "Inventory Check", "Material Allocation", "Procurement",
        "Production", "Quality & Packing", "Logistics", "Accounts",
        "Store", "Reports", "System Logs", "User Management"
    ];

    const roles = [
        "Super Admin", "Admin", "Store Manager", "Inventory Manager",
        "Procurement Manager", "Production Manager", "Quality & Packing Manager",
        "Logistics Manager", "Accounts Manager", "Sales Manager", "Operator", "Viewer"
    ];

    const handleModuleToggle = (mod: string) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules.includes(mod)
                ? prev.modules.filter(m => m !== mod)
                : [...prev.modules, mod]
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.mobileNumber) newErrors.mobileNumber = "Contact No. is required";
        else if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = "Invalid mobile number (10 digits)";
        if (!formData.role) newErrors.role = "Role is required";
        if (!editingUserId && !formData.password) newErrors.password = "Password is required";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        if (users.some(u => u.employeeId === formData.mobileNumber && u.id !== editingUserId)) newErrors.mobileNumber = "Contact No. already exists";
        if (formData.email && users.some(u => u.email === formData.email && u.id !== editingUserId)) newErrors.email = "Email already exists";
        if (users.some(u => (u.mobileNumber === formData.mobileNumber || u.username === formData.mobileNumber) && u.id !== editingUserId)) newErrors.mobileNumber = "Contact No already registered as Username";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (validate()) {
            setIsLoading(true);
            try {
                const payload = {
                    fullName: formData.fullName,
                    contactNumber: formData.mobileNumber,
                    email_id: formData.email,
                    designation: formData.designation,
                    role: formData.role,
                    username: formData.mobileNumber,
                    password: formData.password,
                    modulesAccess: formData.modules,
                    status: "Active"
                };

                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
                const url = editingUserId ? `${BACKEND_URL}/users/update/${editingUserId}` : `${BACKEND_URL}/users/add`;
                const method = editingUserId ? "PUT" : "POST";
                const headers = getAuthHeaders(true);

                const res = await fetch(url, {
                    method,
                    headers,
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert(`User ${editingUserId ? "updated" : "saved"} successfully!`);

                    if (editingUserId) {
                        addAuditLog(`Updated user account and permissions for: ${formData.fullName} (${formData.role})`);
                    } else {
                        addAuditLog(`Created new user account: ${formData.fullName} with role: ${formData.role}`);
                    }

                    handleReset();
                    fetchUsers();
                    setActiveTab("list");
                } else {
                    alert(`Error: ${data.message || data.error || "Failed to save user"}`);
                }
            } catch (e: any) {
                alert("Network error: " + e.message);
            }
            setIsLoading(false);
        } else {
            alert("Please fix the validation errors.");
        }
    };

    const handleEdit = (user: any) => {
        setEditingUserId(user.id);
        setFormData({
            fullName: user.fullName || "",
            email: user.email || "",
            mobileNumber: user.mobileNumber || "",
            designation: user.designation || "",
            role: user.role || "",
            username: user.username || "",
            password: "",
            confirmPassword: "",
            modules: user.modules || [],
        });
        setErrors({});
        setActiveTab("add");
    };

    const handleDelete = async (userId: number) => {
        const targetUser = users.find(u => u.id === userId);
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
                const res = await fetch(`${BACKEND_URL}/users/delete/${userId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(true)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    alert("User deleted successfully!");
                    if (targetUser) addAuditLog(`Deleted user account entirely: ${targetUser.fullName}`);
                    fetchUsers();
                } else {
                    alert(`Error: ${data.error || "Failed to delete user"}`);
                }
            } catch (e) {
                alert("Network error");
            }
        }
    };

    const handleToggleStatus = async (user: any) => {
        const nextStatus = user.status === "Active" ? "Disabled" : "Active";
        if (confirm(`Are you sure you want to change status to ${nextStatus}?`)) {

            const targetUser = users.find(u => u.id === user.id);
            if (!targetUser) {
                alert("User record context not found.");
                return;
            }

            setIsLoading(true);
            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
                const res = await fetch(`${BACKEND_URL}/users/update/${user.id}`, {
                    method: "PUT",
                    headers: getAuthHeaders(true),
                    body: JSON.stringify({
                        fullName: targetUser.fullName,
                        contactNumber: targetUser.mobileNumber,
                        email_id: targetUser.email,
                        designation: targetUser.designation,
                        role: targetUser.role,
                        username: targetUser.username || targetUser.mobileNumber,
                        modulesAccess: targetUser.modules,
                        status: nextStatus
                    })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    alert(`User successfully ${nextStatus === "Active" ? "enabled" : "disabled"}!`);
                    addAuditLog(`Altered account status for ${targetUser.fullName} to: [${nextStatus}]`);
                    fetchUsers();
                } else {
                    alert(`Error: ${data.message || data.error || "Failed to alter status"}`);
                }
            } catch (e) {
                alert("Network error");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSuperAdminPasswordReset = async () => {
        if (!newPassword || newPassword !== confirmNewPassword) {
            alert("Passwords mismatch or fields are empty.");
            return;
        }

        const targetUser = users.find(u => u.id === resettingPasswordUserId);
        if (!targetUser) {
            alert("User not found.");
            return;
        }

        setIsResetLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
            const url = `${BACKEND_URL}/users/update/${resettingPasswordUserId}`;
            const headers = getAuthHeaders(true);

            const payload = {
                fullName: targetUser.fullName,
                contactNumber: targetUser.mobileNumber,
                email_id: targetUser.email,
                designation: targetUser.designation,
                role: targetUser.role,
                username: targetUser.username,
                password: newPassword,
                modulesAccess: targetUser.modules,
                status: targetUser.status
            };

            const res = await fetch(url, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                alert("Password reset successfully by Super Admin!");
                addAuditLog(`Force reset account login credentials for user: ${targetUser.fullName}`);
                setResettingPasswordUserId(null);
                setNewPassword("");
                setConfirmNewPassword("");
                fetchUsers();
            } else {
                alert(`Error: ${data.message || data.error || "Failed to reset password"}`);
            }
        } catch (e: any) {
            alert("Network error: " + e.message);
        } finally {
            setIsResetLoading(false);
        }
    };

    const handleReset = () => {
        setEditingUserId(null);
        setFormData({
            fullName: "", email: "", mobileNumber: "",
            designation: "", role: "", username: "", password: "", confirmPassword: "", modules: []
        });
        setErrors({});
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "All" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="max-w-full mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-indigo-600" />
                        Manage Users
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Create, audit, and manage role-based users and configuration statuses for the ERP system.
                    </p>
                </div>
            </div>

            {/* Tabs Layout */}
            <div className="flex border-b border-border space-x-4">
                <button
                    onClick={() => setActiveTab("add")}
                    className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "add"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                        }`}
                >
                    Add User
                </button>
                <button
                    onClick={() => setActiveTab("list")}
                    className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "list"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                        }`}
                >
                    User List
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                        }`}
                >
                    User Log
                </button>
                <button
                    onClick={() => setActiveTab("status")}
                    className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "status"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                        }`}
                >
                    User Enable/Disable
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-12 space-y-6">

                    {/* TAB 1 CONTENT: ADD / EDIT FORM */}
                    {activeTab === "add" && (
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50">
                                <h2 className="text-lg font-semibold text-card-foreground">
                                    User Details {editingUserId && "(Editing User)"}
                                </h2>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* SECTION 1: USER DETAILS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input type="text" placeholder="Enter Full Name (Name, Middle Name, Surname)" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Contact No. <span className="text-red-500">*</span> <span className="normal-case">(User ID)</span>
                                        </label>
                                        <input type="text" placeholder="Enter 10-digit Mobile Number" value={formData.mobileNumber} onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setFormData({ ...formData, mobileNumber: val });
                                        }} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                        {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Email ID
                                        </label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">Designation</label>
                                        <input type="text" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                    </div>
                                </div>

                                {/* SECTION 2 & 3: ROLE & LOGIN DETAILS */}
                                <hr className="border-border" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none disabled:opacity-60 disabled:cursor-not-allowed">
                                            <option value="">Select a Role...</option>
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Username
                                        </label>
                                        <input type="text" value={formData.mobileNumber} readOnly disabled placeholder="Same as Contact No" className="w-full px-3 py-2 border border-border rounded-lg text-muted-foreground bg-neutral-50 dark:bg-card/50 text-sm focus:outline-none cursor-not-allowed" />
                                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Password {!editingUserId && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                                            Confirm Password {!editingUserId && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                {/* SECTION 4: MODULE ACCESS */}
                                <hr className="border-border" />
                                <div>
                                    <h3 className="text-sm font-semibold text-card-foreground mb-4">Module Access / Permissions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {modulesList.map(mod => (
                                            <label key={mod} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.modules.includes(mod)}
                                                    onChange={() => handleModuleToggle(mod)}
                                                    disabled={isReadOnly}
                                                    className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 dark:border-neutral-600 dark:bg-card disabled:opacity-60 disabled:cursor-not-allowed"
                                                />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">{mod}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 5: ACTION BUTTONS */}
                                <hr className="border-border" />
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={handleReset} className="px-5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 dark:bg-card dark:text-neutral-300 dark:border-border dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                    <button onClick={handleReset} className="px-5 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 flex items-center gap-2 transition-colors">
                                        <RefreshCw className="w-4 h-4" /> Reset
                                    </button>
                                    <PermissionGuard module="User Management">
                                        <button onClick={handleSave} disabled={isLoading || isReadOnly} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                                            <Save className="w-4 h-4" /> {isLoading ? "Saving..." : "Save User"}
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2 CONTENT: USER LIST TABLE */}
                    {activeTab === "list" && (
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    User Records Directory
                                </h2>

                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Search User..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 text-foreground"
                                        />
                                    </div>
                                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground appearance-none min-w-[120px]">
                                        <option value="All">All Roles</option>
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed min-w-full">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-card/70 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            <th className="px-3 py-4 w-[110px]">Employee ID</th>
                                            <th className="px-3 py-4 w-[140px]">Full Name</th>
                                            <th className="px-3 py-4 w-[120px]">Username</th>
                                            <th className="px-3 py-4 w-[100px]">Role</th>
                                            <th className="px-3 py-4 w-[180px]">Email</th>
                                            <th className="px-3 py-4 w-[120px]">Last Login</th>
                                            <th className="px-3 py-4 w-[90px]">Status</th>
                                            <th className="px-3 py-4 w-[140px] text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-card">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground italic">
                                                    No users found matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-3 py-4 text-sm font-medium text-foreground truncate" title={user.employeeId}>{user.employeeId}</td>
                                                    <td className="px-3 py-4 text-sm text-neutral-700 dark:text-neutral-300 truncate" title={user.fullName}>{user.fullName}</td>
                                                    <td className="px-3 py-4 text-sm text-muted-foreground truncate" title={user.username}>{user.username}</td>
                                                    <td className="px-3 py-4 text-sm text-muted-foreground">
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 dark:bg-card dark:text-neutral-300 border border-border truncate max-w-full" title={user.role}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 text-sm text-muted-foreground truncate" title={user.email}>{user.email}</td>
                                                    <td className="px-3 py-4 text-sm text-muted-foreground truncate" title={user.lastLogin}>{user.lastLogin}</td>
                                                    <td className="px-3 py-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="View" onClick={() => handleView(user)}>
                                                                <EyeIcon className="w-4 h-4" />
                                                            </button>

                                                            {/* Super Admin Restricted Password Reset Control */}
                                                            {currentLoggedUserRole === "Super Admin" && (
                                                                <button className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors" title="Reset Password" onClick={() => setResettingPasswordUserId(user.id)}>
                                                                    <ShieldAlert className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            <PermissionGuard module="User Management" hideIfNoAccess>
                                                                <button className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="Edit" onClick={() => handleEdit(user)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete" onClick={() => handleDelete(user.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </PermissionGuard>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3 CONTENT: USER LOGS */}
                    {activeTab === "logs" && (
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50">
                                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    User Activity Audit Trail
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-full">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-card/70 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            <th className="px-6 py-4">Operator & Role</th>
                                            <th className="px-6 py-4">Action Performed</th>
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-card">
                                        {userLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-foreground">{log.username}</td>
                                                <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">{log.action}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{log.timestamp}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{log.ipAddress}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4 CONTENT: ENABLE/DISABLE ACCESS CONTROL */}
                    {activeTab === "status" && (
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50">
                                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-indigo-500" />
                                    Enable / Disable Access Status
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-full">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-card/70 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            <th className="px-6 py-4">Full Name</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Current Status</th>
                                            <th className="px-6 py-4 text-center">Toggle Operation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-card">
                                        {filteredUsers.map((user, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-foreground">{user.fullName}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{user.role}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${user.status === "Active"
                                                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                                            : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                                            }`}
                                                    >
                                                        {user.status === "Active" ? "Disable Account" : "Enable Account"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* MODAL: VIEW USER */}
                {viewingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-border">
                                <h3 className="text-xl font-bold text-foreground">User Details</h3>
                                <button onClick={() => setViewingUser(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {viewingUser.isLoading || isViewLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Basic User Information Grid */}
                                        <div>
                                            <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-100 dark:border-border pb-2">User Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Employee ID</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.contact_number || viewingUser.employeeId}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Full Name</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.full_name || viewingUser.fullName}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Contact Number</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.contact_number || viewingUser.mobileNumber}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Email ID</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.email_id || viewingUser.email || "N/A"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Designation</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.designation || "N/A"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Role</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.role}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Username</label>
                                                    <div className="text-sm font-medium text-foreground">{viewingUser.username}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block">Account Status</label>
                                                    <div className="text-sm font-medium text-foreground">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium border ${viewingUser.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                                                            {viewingUser.status || "Active"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Allotted Access Pages / Modules Grid */}
                                        <div>
                                            <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-100 dark:border-border pb-2">Allotted Access Pages</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {viewingUser.modules_access && viewingUser.modules_access.length > 0 ? (
                                                    viewingUser.modules_access.map((mod: string) => (
                                                        <div
                                                            key={mod}
                                                            className="flex items-center gap-2 p-2 rounded-lg border text-sm border-blue-100 bg-blue-50/50 text-blue-700 dark:border-blue-900/30 dark:bg-card/10 dark:text-blue-400"
                                                        >
                                                            <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-blue-600 text-white">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                            <span className="font-medium truncate" title={mod}>{mod}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full text-sm text-neutral-500 italic py-2">
                                                        No functional system pages allotted to this user account.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card/50 flex justify-end">
                                <button onClick={() => setViewingUser(null)} className="px-6 py-2 bg-card border border-border rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors font-medium text-sm">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: SUPER ADMIN PASSWORD RESET */}
                {resettingPasswordUserId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-border">
                            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-border">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-purple-600" />
                                    Super Admin Password Reset
                                </h3>
                                <button onClick={() => setResettingPasswordUserId(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">New Password</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">Confirm New Password</label>
                                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="p-4 border-t border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card/50 flex justify-end gap-2">
                                <button onClick={() => setResettingPasswordUserId(null)} className="px-4 py-2 text-xs font-medium bg-white border rounded-lg text-neutral-700 dark:bg-card dark:text-neutral-300 dark:border-border">Cancel</button>
                                <button onClick={handleSuperAdminPasswordReset} disabled={isResetLoading} className="px-4 py-2 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                                    {isResetLoading ? "Resetting..." : "Confirm Reset"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}