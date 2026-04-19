import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "../../config/api";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient()],   
});

export const { signIn, signUp, signOut, useSession } = authClient;
