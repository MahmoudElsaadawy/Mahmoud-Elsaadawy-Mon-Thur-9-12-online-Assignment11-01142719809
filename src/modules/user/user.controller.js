import { Router } from "express";
import { signUpService, loginService, profileService, refreshToken, socialLogin } from "./user.service.js";
import { auth, authorization } from "../../middleware/auth.middleware.js";
import { RoleEnum } from "../../utils/enums/user.enum.js";
import { validation } from "../../middleware/valdation.middleware.js";
import { signUpSchema, loginSchema } from "../user/user.validation.js"

const router = Router()

router.post("/signup", validation(signUpSchema),signUpService)
router.post("/login", validation(loginSchema), loginService)
router.post("/refresh-token", refreshToken)
router.post("/social-login", socialLogin)
router.get("/profile", auth, authorization(0), profileService)


export default router