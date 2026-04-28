import * as authService from "@/services/authService";

export const login = async (data) => {
    const res = await authService.login(data);
    return res.data;
};

export const register = async (data) => {
    const res = await authService.register(data);
    return res.data;
};

export const logout = async () => {
    const res = await authService.logout();
    return res.data;
};