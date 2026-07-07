import {
    PatientSignin,
    DoctorSignin,
    HospitalSignin,
    PatientLogin,
    DoctorLogin,
    HospitalLogin,
    StaffLogin,
    StaffSignin,
    ApproveDoctor,
    ApproveStaff,
    RejectRequest,
    Login,
    updateProfile,
    getMe
} from "../services/auth.js";
import { redisClient } from "../utils/redis.js";
import { supabase } from "../utils/supabase.js";

const isProd = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge
});

class Auth{
    sendotp=async(req,res,next)=>{
        try {
             const {email}=req.body;
          const { data, error } = await supabase.auth.signInWithOtp({
    email: email
  })
  if(error) throw error;
res.status(200).json({ message: "OTP sent to email" })
        } catch (error) {
            next(error);
        }
    }
verifyOTP=async(req,res,next)=>{
    try {
  const { email, otp, password } = req.body

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email"
  })

  if (error) {
   throw error;
  }
  res.status(200).json({ message: "Email verified" })
    } catch (error) {
        next(error);
    }

}
    approve = async (req, res, next) => {
        let { role, id } = req.params;
        let hospital_id = req.user.id;
        console.log(hospital_id);
        id = id?.trim();
        hospital_id = hospital_id?.trim();
        try {
            if (role === "doctor") {
                const approval = await ApproveDoctor(id, hospital_id);
                return res.status(200).json(approval);
            } 
            else if (role === "staff") {
                const approval = await ApproveStaff(id, hospital_id);
                return res.status(200).json(approval);
            } 
            else {
                return res.status(400).json({ message: "Invalid role" });
            }
        } catch (error) {
            next(error);
        }
    };


    reject=async(req,res,next)=>{
        const id=req.params.id;
        const hospital_id=req.user.id;

        try{
            const rejection = await RejectRequest(id,hospital_id);

            return res.status(200).json(rejection);

        }catch(error){
            next(error);
        }
    };

    Patientsignup = async (req, res, next) => {
    try {
        const { name, email, phone, password, address, dob, gender } = req.body;

        if (!name || !password || !email || !phone) {
        return res.status(400).json({
            message: "All credentials required",
        });
        }

        // ✅ Optional DOB validation (DATE type safe)
        if (dob && isNaN(Date.parse(dob))) {
        return res.status(400).json({
            message: "Invalid DOB format (use YYYY-MM-DD)",
        });
        }

        // ✅ Optional gender validation
        const allowedGenders = ["male", "female", "other"];
        if (gender && !allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
            message: "Invalid gender value",
        });
        }

        const patient = await PatientSignin(
        name,
        email,
        phone,
        password,
        address,
        dob || null,
        gender ? gender.toLowerCase() : null
        );

        const { access_token, refresh_token } = patient.session;

        res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
        res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));

        return res.status(200).json({
        message: "patient signup successful",
        patient,
        access_token,
        refresh_token,
        });
    } catch (error) {
        next(error);
    }
    };

    Doctorsignup=async(req,res,next)=>{
        try {
        const {name,email,address,phone,password,speciality,hospital_id}=req.body;
       if(!name || !password || !email || !address || !phone || !hospital_id){
            return res.status(400).json({
                message:"All credentials required"
            })
        }
        const doctor=await DoctorSignin(name,email,address,phone,password,speciality,hospital_id);
          const { access_token, refresh_token } = doctor.session;
   await redisClient.del(`doctor:${hospital_id}`);
    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
        return res.status(200).json({
        message:"Doctor registration request send successfully.",
        doctor,
        access_token,
        refresh_token
        })

        } catch (error) {
            next(error);
        }

    }

    Hospitalsignup=async(req,res,next)=>{
        try {
        const {name,email,phone,password,address}=req.body;
       if(!name || !password || !email || !phone || !address){
            return res.status(400).json({
                message:"All credentials required"
            })
        }
        const hospital=await HospitalSignin(name,email,phone,password,address);
          const { access_token, refresh_token } = hospital.session;
    await redisClient.del("allHospitals");
    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
        return res.status(200).json({
        message:"hospital signin succesfull",
        hospital,
        access_token,
        refresh_token
        })

        } catch (error) {
            next(error);
        }

    }

    Staffsignup=async(req,res,next)=>{
        try{
            const {hospital_id,name,email,phone,password,dept}=req.body;
            if(!hospital_id || !name || !password || !email || !phone){
                    return res.status(400).json({
                        message:"All credentials required"
                    })
            }
            const staff=await StaffSignin(hospital_id,name,email,phone,password,dept);
              const { access_token, refresh_token } = staff.session;

    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
            return res.status(200).json({
                message:"Staff registration request send succesfully.",
                staff,
                access_token,
                refresh_token
            })
        }catch(error){
            next(error);
        }
    }
Login=async(req,res,next)=>{
      try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password required"
                });
            }
            const result = await Login(email, password);
            const { access_token, refresh_token } = result.session;

    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
            

                return res.status(200).json({
                    message: "Login successful",
                    ...result,
                    access_token,
                    refresh_token

                });

        } catch (error) {
            next(error);
        }
}
    Patientlogin = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password required"
                });
            }
            const result = await PatientLogin(email, password);
            const { access_token, refresh_token } = result.session;

    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
            

                return res.status(200).json({
                    message: "Login successful",
                    ...result,
                    access_token,
                    refresh_token

                });

        } catch (error) {
            next(error);
        }
    }

    Doctorlogin = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password required"
                });
            }
            const result = await DoctorLogin(email, password);
              const { access_token, refresh_token } = result.session;

    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));


           
                return res.status(200).json({
                    message: "Login successful",
                    ...result,
                    access_token,
                    refresh_token
                });

        } catch (error) {
            next(error);
        }
    }

    Hospitallogin = async (req, res, next) => {
        try {
            // console.log(req.body);
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password required"
                });
            }
            const result = await HospitalLogin(email, password);
            const { access_token, refresh_token } = result.session;
            // console.log(access_token);
    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));

                return res.status(200).json({
                    message: "Login successful",
                    ...result,
                    access_token,
                    refresh_token
                });
        
        } catch (error) {
            next(error);
        }
    }

    Stafflogin = async(req,res,next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password required"
                });
            }
            const result = await StaffLogin(email, password);
            const { access_token, refresh_token } = result.session;

    res.cookie("access_token", access_token, cookieOptions(60 * 60 * 1000));
    res.cookie("refresh_token", refresh_token, cookieOptions(7 * 24 * 60 * 60 * 1000));
           

                return res.status(200).json({
                    message: "Login successful",
                    ...result,
                    access_token,
                    refresh_token
                });
          
        } catch (error) {
            next(error);
        }
    }
updateUser=async(req,res,next)=>{
    try {
        const id=req.user.id;
      
        const role=req.user.user_metadata.role;
        //   console.log(role);
        const data=req.body;
        const resp=await updateProfile(id,role,data);
        return res.status(201).json({
            message:"Profile updated"
        })
    } catch (error) {
        next(error)
    }
}
    getMe=async(req,res,next)=>{
        try {
             const user = req.user; 

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const me=await getMe(user);
  return res.json({
    message:"user fetched",
    user:me
  })
        } catch (error) {
            next(error);
        }
    }
};

export default new Auth();
