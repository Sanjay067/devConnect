import { apiClient } from "@/services/apiClient";

export const toggleLikePost = (postId) => {
    apiClient.post(`/posts/${postId}/like`);
}