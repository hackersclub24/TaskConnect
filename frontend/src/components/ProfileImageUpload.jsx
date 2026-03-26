import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const ProfileImageUpload = ({ currentImageUrl, onImageUpdate, userName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large (max 5MB)");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated. Please login.");
        return;
      }

      // Upload to backend endpoint
      const response = await fetch(`${API_BASE_URL}/users/me/upload-profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Upload failed";

        if (contentType?.includes("application/json")) {
          const data = await response.json();
          errorMessage = data.detail || data.message || errorMessage;
        } else {
          errorMessage = `Server error: ${response.status}`;
        }

        console.error("Upload error response:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Upload response:", data);

      let imageUrl = data.profile_image_url;

      if (!imageUrl) {
        console.error("No image URL in response:", data);
        throw new Error("No image URL returned from server");
      }

      // Convert relative URLs to absolute
      if (imageUrl.startsWith("/")) {
        imageUrl = `http://127.0.0.1:8000${imageUrl}`;
        console.log("Converted to absolute URL:", imageUrl);
      }

      console.log("Image URL set to:", imageUrl);

      setSuccess("✓ Profile image updated!");
      onImageUpdate(imageUrl);

      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload profile image");
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Current Image */}
      <div className="relative w-32 h-32">
        {currentImageUrl ? (
          <img
            src={currentImageUrl.startsWith("/") ? `http://127.0.0.1:8000${currentImageUrl}` : currentImageUrl}
            alt={userName}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-200 to-sky-200 dark:from-primary-800 dark:to-sky-800 flex items-center justify-center text-slate-400">
            <span className="text-4xl">👤</span>
          </div>
        )}

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Click to upload profile image"
          className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-full p-2.5 shadow-lg transition-colors"
        >
          <Upload className="w-5 h-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
          style={{ display: "none" }}
        />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">
          <span>✓</span>
          {success}
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {loading ? (
          <span className="text-primary-500">Uploading...</span>
        ) : (
          "Click camera icon to upload image"
        )}
      </p>
    </div>
  );
};

export default ProfileImageUpload;
