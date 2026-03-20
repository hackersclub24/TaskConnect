import { useState } from "react";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { loginWithGoogleToken } from "../services/api";

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;

      const profile = {
        name: user.displayName || "",
        email: user.email || "",
        photo: user.photoURL || ""
      };

      const idToken = await user.getIdToken();
      const { data } = await loginWithGoogleToken(idToken);

      localStorage.setItem("googleUser", JSON.stringify(profile));

      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      onSuccess?.({ profile, idToken, backendResponse: data });
    } catch (err) {
      const firebaseErrorCode = err?.code || "";
      const isPopupClosed =
        firebaseErrorCode === "auth/popup-closed-by-user" ||
        firebaseErrorCode === "auth/cancelled-popup-request";

      const isAxiosErr = axios.isAxiosError(err);
      const backendErrorMessage = isAxiosErr
        ? err.response?.data?.detail || err.response?.data?.message
        : "";
      const networkMessage = isAxiosErr && !err.response
        ? "Could not reach auth server. Check backend URL and CORS settings."
        : "";
      const providerError = GoogleAuthProvider.credentialFromError(err);
      const providerMessage = providerError
        ? "Google provider credentials could not be validated."
        : "";

      const message = isPopupClosed
        ? "Google sign-in was cancelled."
        : backendErrorMessage || networkMessage || providerMessage || err?.message || "Google sign-in failed. Please try again.";

      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? "Signing in with Google..." : "Login with Google"}
    </button>
  );
};

export default GoogleLoginButton;
