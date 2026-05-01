import React from 'react'
import Like from './Like'
import MediaCarousel from './MediaCarousel'

function PostCard({ post }) {
    return (
        <div className="group w-full max-w-2xl mx-auto my-6 rounded-3xl p-6 md:p-8 
                        bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl 
                        transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-sky-500/10">

            {/* 1. Header: Author Info */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-sky-400 transition-colors">
                    {post.author?.profilePicture ? (
                        <img 
                            src={post.author.profilePicture} 
                            alt={post.author.name} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-600"></div>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white tracking-tight">{post.author?.name}</h3>
                    <p className="text-sm text-sky-400 font-medium">@{post.author?.username}</p>
                </div>
            </div>

            {/* 2. Body: The Post Text */}
            <div className="flex flex-col gap-3 mb-6">
                <h2 className="text-2xl font-extrabold text-white leading-tight">
                    {post.title}
                </h2>

                {post.shortDescription && (
                    <p className="text-gray-300 leading-relaxed text-base">
                        {post.shortDescription}
                    </p>
                )}

                {/* Attached Media Carousel */}
                <MediaCarousel media={post.media} />
            </div>

            {/* 3. Footer: Action Buttons */}
            <div className="flex items-center gap-8 mt-2 pt-5 border-t border-white/10 text-gray-400">

                {/* Like Button Component (Your Yellow Star!) */}
                <Like post={post} />

                {/* Comment Button */}
                <button className="flex items-center gap-2 group/btn transition-colors hover:text-white">
                    <div className="p-2 rounded-full bg-white/5 group-hover/btn:bg-blue-500/20 transition-colors">
                        <i className="fa-regular fa-comment text-lg group-hover/btn:text-blue-400"></i>
                    </div>
                    <span className="font-semibold">{post.commentCount || 0}</span>
                </button>

                {/* Share Button */}
                <button className="flex items-center gap-2 ml-auto group/btn transition-colors hover:text-white">
                    <div className="p-2 rounded-full bg-white/5 group-hover/btn:bg-emerald-500/20 transition-colors">
                        <i className="fa-regular fa-share-from-square text-lg group-hover/btn:text-emerald-400"></i>
                    </div>
                </button>

            </div>
        </div>
    )
}

export default PostCard
