"use client";

import PostCard from "@/features/feed/components/PostCard";
import { useFeed } from "@/features/feed/hooks/useFeed";

function Feed() {
    const { data: feed, isLoading, isError, error } = useFeed();

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-red-500 p-10">
                Error loading feed: {error.message}
            </div>
        );
    }
    return (
        <main>
            {
                feed?.posts?.map((post) => (
                    <PostCard key={post._id} post={post} />
                ))
            }
        </main>
    )
}

export default Feed;