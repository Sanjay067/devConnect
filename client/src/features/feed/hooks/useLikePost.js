import { toggleLikePost } from "@/services/postService";
import { useQueryClient, useMutation } from "@tanstack/react-query";


export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleLikePost,

        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["feed"] });

            const previousFeed = queryClient.getQueryData(["feed"]);

            queryClient.setQueryData(["feed"], (oldFeed) => {
                if (!oldFeed?.posts) return oldFeed;

                return {
                    ...oldFeed,
                    posts: oldFeed.posts.map((post) =>
                        post._id === postId
                            ? {
                                ...post,
                                likeCount: post.isLiked
                                    ? post.likeCount - 1
                                    : post.likeCount + 1,
                                isLiked: !post.isLiked,
                            }
                            : post
                    ),
                };
            });

            return { previousFeed };
        },

        onError: (err, postId, context) => {
            if (context?.previousFeed) {
                queryClient.setQueryData(["feed"], context.previousFeed);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
    });
};