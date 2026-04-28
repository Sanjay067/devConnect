import jwt from "jsonwebtoken";
import User from "../user/users.model.js";
import { accessCookieOptions } from "../../utils/cookieOptions.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "60m" },
    );

    return res
      .cookie("accessToken", newAccessToken, accessCookieOptions())
      .status(200)
      .json({ message: "Access token Refreshed" });
  } catch (error) {

    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
});
