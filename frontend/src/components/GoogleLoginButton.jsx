import { useState } from "react";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { loginWithGoogleToken, persistAuthTokens } from "../services/api";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5c-5.3 0-9.5 4.3-9.5 9.5s4.2 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
    />
    <path
      fill="#34A853"
      d="M3.6 7.7l3.2 2.3C7.6 8 9.6 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 8.2 2.5 4.8 4.6 3.6 7.7z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.5c2.5 0 4.6-.8 6.2-2.2l-2.9-2.4c-.8.5-1.9.9-3.3.9-2.5 0-4.6-1.6-5.4-3.9l-3.2 2.5c1.2 3.2 4.4 5.1 8.6 5.1z"
    />
    <path
      fill="#4285F4"
      d="M21.1 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.5-1.2 2.7-2.4 3.4l2.9 2.4c1.7-1.6 3.1-4 3.1-8.1z"
    />
  </svg>
);

const GoogleLoginButton = ({
  onSuccess,
  onError,
  idleText = "Sign in with Google",
  loadingText = "Signing in with Google...",
}) => {
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
        persistAuthTokens(data.access_token, data.refresh_token);
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
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <GoogleIcon />
      <span>{loading ? loadingText : idleText}</span>
    </button>
  );
};

export default GoogleLoginButton;
