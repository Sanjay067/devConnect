import React, { useState, useEffect, useRef } from 'react';
import { useLikePost } from '../hooks/useLikePost';

function Like({ post }) {
    const { mutate: toggleLike } = useLikePost();


    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);


    const debounceTimer = useRef(null);


    useEffect(() => {
        setIsLiked(post.isLiked);
        setLikeCount(post.likeCount || 0);
    }, [post.isLiked, post.likeCount]);

    const handleLikeClick = () => {

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prev) => newIsLiked ? prev + 1 : prev - 1);


        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }


        debounceTimer.current = setTimeout(() => {
            toggleLike(post._id);
        }, 1000);
    };

    return (
        <button
            onClick={handleLikeClick}

            className={`flex items-center gap-2 group/btn transition-all duration-300 ${isLiked ? 'text-yellow-500' : 'hover:text-white text-gray-400'
                }`}
        >
            <div>
                <i className={`${isLiked ? 'fa-solid' : 'fa-regular'} fa-star`}
                >
                </i>
            </div>
            <span className="font-semibold text-gray-300">{likeCount}</span>
        </button>
    )
}

export default Like;
