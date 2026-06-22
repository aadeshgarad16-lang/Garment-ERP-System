"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Factory,
  Mail,
  Lock,
  UserCog,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";

const ROLES = [
  "Super Admin",
  "Director",
  "Production Head",
  "Production Coordinator",
  "Production Supervisor",
  "Store Manager",
  "Cutting Master",
  "Accounts Manager",
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: ROLES[0] as string,
    rememberMe: false,
  });

  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);

    try {
      const email = localStorage.getItem("rememberedEmail");
      const role = localStorage.getItem("rememberedRole");

      if (email) {
        setFormData((prev) => ({
          ...prev,
          email,
          role: role || ROLES[0],
          rememberMe: true,
        }));
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setError("");

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email";
    }

    if (!formData.password.trim()) {
      return "Password is required";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    return null;
  };

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        if (formData.rememberMe) {
          localStorage.setItem(
            "rememberedEmail",
            formData.email
          );
          localStorage.setItem(
            "rememberedRole",
            formData.role
          );
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedRole");
        }
      } catch (err) {
        console.error(err);
      }

      const result = login({
        name: "",
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (!result.success) {
        setError(result.error || "Login failed");
        return;
      }

      router.push("/language");
    },
    [formData, login, router]
  );

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${isDark
        ? "bg-neutral-900"
        : "bg-neutral-100"
        }`}
    >
      <div className="absolute top-5 right-5">
        <button
          onClick={() =>
            setTheme(
              isDark ? "light" : "dark"
            )
          }
          className="p-2 rounded-full"
        >
          {isDark ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}
        </button>
      </div>

      <div
        className={`w-full max-w-md rounded-2xl shadow-xl border p-8 ${isDark
          ? "bg-neutral-800 border-neutral-700"
          : "bg-white border-neutral-200"
          }`}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Factory className="text-white" />
          </div>

          <h1 className="text-3xl font-bold mt-4">
            Sason ERP
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label className="block mb-2 text-sm font-medium">
              Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="admin@sason.com"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="********"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Role
            </label>

            <div className="relative">
              <UserCog className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              >
                {ROLES.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            Remember Me
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            Sign In
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="text-center mt-6 text-sm">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}