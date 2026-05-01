import { apiClient } from "@/services/apiClient";

export const getFeed = () => apiClient.get("/feed");
