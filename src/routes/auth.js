import express from "express";
import Auth from "../controller/auth.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { supabase } from "../utils/supabase.js";
import auth from "../controller/auth.js";

const isProd = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    ...(maxAge !== undefined ? { maxAge } : {})
});

const router=express.Router();
// router.post("/send-otp",Auth.sendotp);
// router.post("/verify-otp",Auth.verifyOTP);
router.post("/approve/:role/:id",authenticate,Auth.approve);
router.post("/reject/:id",authenticate,Auth.reject);
router.post("/signup/patient",Auth.Patientsignup);
router.post("/signup/doctor",Auth.Doctorsignup);
router.post("/signup/hospital",Auth.Hospitalsignup);
router.post("/signup/hospital-staff",Auth.Staffsignup);
router.post("/login/patient",Auth.Patientlogin);
router.post("/login/doctor",Auth.Doctorlogin);
router.post("/login/hospital",Auth.Hospitallogin);
router.post("/login/hospital-staff",Auth.Stafflogin);
router.get("/me",authenticate,Auth.getMe);
router.put("/update",authenticate,Auth.updateUser)
router.get("/role",authenticate,(req,res)=>{
try {
  const role=req.user.user_metadata.role;
  console.log(role);
  return res.status(200).json({message:"ok"});
} catch (error) {
  console.log("error",error);
}
})

router.post("/refresh", async (req, res) => {

  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refresh_token,
  });

  if (error) {
    return res.status(403).json({ message: error.message });
  }

  const { access_token, refresh_token: new_refresh } = data.session;

  // new access token
  res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));

  // rotated refresh token
  res.cookie("refresh_token", new_refresh, cookieOptions(7 * 24 * 60 * 60 * 1000));

  res.json({
    message: "Access token refreshed",
  });

});
router.post("/logout",async(req,res)=>{
 try {
    res.clearCookie("access_token", cookieOptions());
    res.clearCookie("refresh_token", cookieOptions());

    return res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
      error: error.message
    });
  }
})
export default router;