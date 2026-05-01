import * as feedService from "@/services/feedService";

export const getFeed = async () => {
    const res = await feedService.getFeed();
    return res.data;
};
