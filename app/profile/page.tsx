"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  task: string;
  persona: string;
  mission_objective: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    task: "",
    persona: "",
    mission_objective: "",
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          router.push("/login");
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${baseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data: UserProfile = await response.json();
        setProfile(data);
        setFormData({
          task: data.task || "",
          persona: data.persona || "",
          mission_objective: data.mission_objective || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || "Failed to update profile"
        );
      }

      const updatedProfile: UserProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        task: profile.task || "",
        persona: profile.persona || "",
        mission_objective: profile.mission_objective || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load profile</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b bg-card flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-card border rounded-lg overflow-hidden">
            {/* Header Section with Avatar */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                  {getInitials(profile.full_name || profile.email)}
                </div>

                {/* Basic Info */}
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile.full_name || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {profile.role?.toLowerCase() || "user"} • Joined{" "}
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Content Section */}
            <div className="px-6 py-8">
              {/* Read-Only Fields */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Account Information
                </h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded">
                      {profile.email}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Role</label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded capitalize">
                      {profile.role?.toLowerCase() || "user"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-8" />

              {/* Editable Fields */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Learning Profile
                  </h3>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-6">
                    {/* Task */}
                    <div>
                      <label htmlFor="task" className="text-sm font-medium text-foreground">
                        Task
                      </label>
                      <textarea
                        id="task"
                        name="task"
                        value={formData.task}
                        onChange={handleInputChange}
                        placeholder="What are you learning?"
                        rows={3}
                        className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Describe the main task or subject you want to learn.
                      </p>
                    </div>

                    {/* Persona */}
                    <div>
                      <label htmlFor="persona" className="text-sm font-medium text-foreground">
                        Persona
                      </label>
                      <textarea
                        id="persona"
                        name="persona"
                        value={formData.persona}
                        onChange={handleInputChange}
                        placeholder="What role would you like the AI to take?"
                        rows={3}
                        className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Specify how the AI should interact with you (e.g., "Friendly tutor", "Strict mentor").
                      </p>
                    </div>

                    {/* Mission Objective */}
                    <div>
                      <label
                        htmlFor="mission_objective"
                        className="text-sm font-medium text-foreground"
                      >
                        Mission Objective
                      </label>
                      <textarea
                        id="mission_objective"
                        name="mission_objective"
                        value={formData.mission_objective}
                        onChange={handleInputChange}
                        placeholder="What do you want to achieve?"
                        rows={3}
                        className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Set your specific goal or objective for this learning journey.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    {/* Task */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Task</label>
                      <p className="text-sm text-foreground mt-1 p-3 bg-muted rounded whitespace-pre-wrap">
                        {formData.task || "Not set"}
                      </p>
                    </div>

                    {/* Persona */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Persona</label>
                      <p className="text-sm text-foreground mt-1 p-3 bg-muted rounded whitespace-pre-wrap">
                        {formData.persona || "Not set"}
                      </p>
                    </div>

                    {/* Mission Objective */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Mission Objective
                      </label>
                      <p className="text-sm text-foreground mt-1 p-3 bg-muted rounded whitespace-pre-wrap">
                        {formData.mission_objective || "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {profile.updated_at && (
            <div className="mt-6 text-xs text-muted-foreground text-center">
              Last updated: {new Date(profile.updated_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
