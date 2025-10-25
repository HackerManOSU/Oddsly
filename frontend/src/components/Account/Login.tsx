import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { signIn, signUp, forgotPassword } from "../../authorization/AuthService";
import useAuth from "../../authorization/useAuth";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

// GSAP
import { gsap } from "gsap";

function Login() {
  // ----------------------------------------
  // 1) STATES
  // ----------------------------------------
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [captchaVerified, setCaptchaVerified] = useState(false);
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

  const [validations, setValidations] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    fullName: false,
    dateOfBirth: false,
  });

  // GSAP REFS
  const blackPanelRef = useRef<HTMLDivElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);


  // ----------------------------------------
  // 2) BASIC HOOKS & VALIDATIONS
  // ----------------------------------------
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return {
      hasLength: password.length >= 8,
      hasCapital: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const validateConfirmPassword = (pw: string, cpw: string) => {
    return pw === cpw && pw !== "";
  };

  const validateFullName = (name: string) => {
    return name.length >= 2 && /^[a-zA-Z\s]*$/.test(name);
  };

  const validateDateOfBirth = (dob: string) => {
    if (!dob) return false;
    const age = calculateAge(new Date(dob));
    return age >= 18;
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const passwordValidations = {
    hasLength: password.length >= 8,
    hasCapital: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  };

  // ----------------------------------------
  // 3) MOUNT: SET INITIAL BLACK PANEL POSITION
  // ----------------------------------------
  useEffect(() => {
    if (!formContainerRef.current) return;
  
    // Set initial position for form container
    gsap.set(formContainerRef.current, {
      x: isSigningUp ? -1000 : 1000,
    });
  }, [windowWidth]);
  
  // 4) SLIDE THE FORM CONTAINER WHEN isSigningUp CHANGES
  useEffect(() => {
    if (!formContainerRef.current) return;
    
    // Animate the form container
    gsap.fromTo(
      formContainerRef.current,
      { x: isSigningUp ? -1000 : 1000 }, // Starting position
      {
        x: 0, // End position
        duration: 0.7,
        ease: "power2.inOut",
      }
    );
  
    // Only animate black panel for desktop
    if (windowWidth >= 900 && blackPanelRef.current) {
      gsap.to(blackPanelRef.current, {
        duration: 0.7,
        left: isSigningUp ? "58%" : "0%",
        ease: "power2.inOut",
      });
    }
  }, [isSigningUp, windowWidth]);

  // ----------------------------------------
  // 4) SLIDE THE BLACK PANEL WHEN isSigningUp CHANGES
  // ----------------------------------------
  useEffect(() => {
    if (!blackPanelRef.current || !formContainerRef.current || windowWidth < 900) return;
    
    // 1) Animate black panel
    gsap.to(blackPanelRef.current, {
      duration: 0.7,
      left: isSigningUp ? "58%" : "0%",
      ease: "power2.inOut",
    });
  
    // 2) Animate the form container
    // If isSigningUp, slide it in from the left (x = -1000 => x = 0)
    // If logging in, slide it in from the right (x = 1000 => x = 0)
    gsap.fromTo(
      formContainerRef.current,
      { x: isSigningUp ? -1000 : 1000 },
      {
        x: 0,
        duration: 0.7,
        ease: "power2.inOut",
      }
    );
  }, [isSigningUp, windowWidth]);

  // ----------------------------------------
  // 5) AUTH HANDLERS
  // ----------------------------------------
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");

    // For production, flip this if check
    if (!captchaVerified) {
      setError("Please complete the reCAPTCHA");
      setIsLoading(false);
      return;
    }

    try {
      if (isSigningUp) {
        if (!Object.values(validations).every(Boolean) || !agreeToTerms) {
          setError("Please ensure all fields are valid");
          return;
        }
        await signUp(email, password, { fullName, dateOfBirth });
        setInfo("A verification email has been sent. Please check your inbox.");
        setIsSigningUp(false);
        resetForm();
      } else {
        if (!validations.email || !validations.password) {
          setError("Invalid email or password");
          return;
        }
        await signIn(email, password);
        await refreshAuth();
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");

    try {
      if (!email) {
        setError("Please enter your email address.");
        return;
      }

      await forgotPassword(email);
      setInfo("Password reset email sent. Please check your inbox.");
      setIsResettingPassword(false);
      resetForm();
    } catch (error) {
      console.error("Password reset error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setDateOfBirth("");
    setConfirmPassword("");
    setError("");
    setInfo("");
  };

  // ----------------------------------------
  // 6) VALIDATION EFFECT
  // ----------------------------------------
  useEffect(() => {
    setValidations({
      email: validateEmail(email),
      password:
        !!password && Object.values(validatePassword(password)).every(Boolean),
      confirmPassword:
        !!confirmPassword && validateConfirmPassword(password, confirmPassword),
      fullName: fullName ? validateFullName(fullName) : false,
      dateOfBirth: !!dateOfBirth && validateDateOfBirth(dateOfBirth),
    });
  }, [email, password, confirmPassword, fullName, dateOfBirth]);

  // ----------------------------------------
  // 7) RENDER FORMS
  // ----------------------------------------
  const renderAuthForms = () => {
    const headingText = isSigningUp
      ? "Sign Up"
      : isResettingPassword
      ? "Reset Password"
      : "Login";

    return (
      <div
        className="w-full max-w-md p-8 rounded-3xl bg-white border-neon border-4 
        shadow-[0_0_250px_rgba(0,255,255,0.5)]"
      >
        <h2 className="text-6xl text-center text-[#171717] mb-8">
          {headingText}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            {info}
          </div>
        )}

        {/* LOGIN / SIGNUP FORM */}
        {!isResettingPassword && (
          <form onSubmit={handleAuth} className="w-full max-w-md space-y-6">
            <div className="space-y-6">
              {isSigningUp && (
                <>
                  {/* FULL NAME */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border p-2 rounded"
                      required
                    />
                    {fullName && validations.fullName === false && (
                      <p className="text-sm text-red-500">
                        Please enter a valid full name
                      </p>
                    )}
                  </div>

                  {/* DATE OF BIRTH */}
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full border p-2 rounded"
                      required
                    />
                    {dateOfBirth && validations.dateOfBirth === false && (
                      <p className="text-sm text-red-500">
                        Must be 18 or older
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* EMAIL */}
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
                {email && validations.email === false && (
                  <p className="text-sm text-red-500">
                    Please enter a valid email
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="relative space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {isSigningUp && (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center">
                      {passwordValidations.hasLength ? (
                        <CheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <XCircle className="text-red-500 mr-2" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center">
                      {passwordValidations.hasCapital ? (
                        <CheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <XCircle className="text-red-500 mr-2" />
                      )}
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center">
                      {passwordValidations.hasNumber ? (
                        <CheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <XCircle className="text-red-500 mr-2" />
                      )}
                      <span>One number</span>
                    </div>
                    <div className="flex items-center">
                      {passwordValidations.hasSpecial ? (
                        <CheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <XCircle className="text-red-500 mr-2" />
                      )}
                      <span>One special character (!@#$...)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD (Sign Up only) */}
              {isSigningUp && (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border p-2 rounded"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && validations.confirmPassword === false && (
                    <p className="text-sm text-red-500">
                      Passwords must match
                    </p>
                  )}
                </div>
              )}

              {/* AGREE TO TERMS (Sign Up only) */}
              {isSigningUp && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-neon border-gray-300 rounded"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neon hover:underline"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neon hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <ReCAPTCHA sitekey={SITE_KEY} onChange={() => setCaptchaVerified(true)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-neon text-white font-medium
                transform transition-all duration-300
                hover:bg-neonhover hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:scale-100"
            >
              {isLoading ? "Loading..." : isSigningUp ? "Sign Up" : "Login"}
            </button>
          </form>
        )}

        {/* PASSWORD RESET FORM */}
        {isResettingPassword && (
          <form onSubmit={handlePasswordReset} className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
              {email && validations.email === false && (
                <p className="text-sm text-red-500">
                  Please enter a valid email
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-neon text-white font-medium
                transform transition-all duration-300
                hover:bg-neonhover hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:scale-100"
            >
              {isLoading ? "Loading..." : "Send Password Reset Email"}
            </button>
          </form>
        )}

        {/* NAV LINKS */}
        {!isResettingPassword && (
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={() => {
                setIsSigningUp(!isSigningUp);
                setIsResettingPassword(false);
                resetForm();
              }}
              disabled={isLoading}
              className="text-neon hover:underline"
            >
              {isSigningUp ? "Have an account? Login" : "New here? Sign Up"}
            </button>

            {!isSigningUp && (
              <button
                onClick={() => {
                  setIsResettingPassword(true);
                  resetForm();
                }}
                disabled={isLoading}
                className="text-neon hover:underline"
              >
                Forgot Password?
              </button>
            )}
          </div>
        )}

        {isResettingPassword && (
          <button
            onClick={() => {
              setIsResettingPassword(false);
              resetForm();
            }}
            disabled={isLoading}
            className="mt-6 text-neon hover:underline"
          >
            Back to Login
          </button>
        )}
      </div>
    );
  };

  // ----------------------------------------
  // 8) RENDER
  // ----------------------------------------
  return (
    <div
      className={`relative w-screen min-h-screen overflow-y-auto bg-[url('/3d-gradient.jpg')] 
      bg-cover bg-center ${windowWidth < 900 ? "py-8 px-4" : ""}`}
    >
      {/* Black panel for wide screens only */}
      {windowWidth >= 900 && (
        <div
          ref={blackPanelRef}
          className="absolute top-0 h-full bg-black"
          style={{ width: "42%", left: 0 }} 
          // We only set left:0 initially; GSAP will animate to left:58% if isSigningUp
        >
          <div className="h-full px-12 text-white relative">
            {isSigningUp ? (
              <div className="text-center absolute top-0 left-0 right-0">
                <div className="flex flex-row items-center justify-center absolute top-32 left-0 right-0">
                  <Link to="/">
                    <img className="h-[300px]" src="/logo-white.png" alt="Oddsly Logo" />
                  </Link>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-sm text-gray-300 mb-12 px-12">
                  &copy; 2025 Anvil LLC. All Rights Reserved.
                </p>
              </div>
            ) : (
              <div className="text-center absolute top-0 left-0 right-0">
                <div className="flex flex-row items-center justify-center absolute top-32 left-0 right-0">
                  <Link to="/">
                    <img className="h-[300px]" src="/logo-white.png" alt="Oddsly Logo" />
                  </Link>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-sm text-gray-300 mb-12 px-12">
                  &copy; 2025 Anvil LLC. All Rights Reserved.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign-up or Login/Reset forms (centered if mobile) */}
      <div
        ref={formContainerRef}
        className={`${
          windowWidth >= 900
            ? isSigningUp
              ? "absolute top-0 left-[1%] w-[58%] h-full -translate-x-1/2 flex items-center justify-center"
              : "absolute top-0 right-[0%] w-[58%] h-full translate-x-1/2 flex items-center justify-center"
            : "w-full max-w-[500px] mx-auto my-4" // Updated for mobile
        }`}
      >
        {/* Update the form wrapper div's classes */}
        <div>
          {renderAuthForms()}
        </div>
      </div>
    </div>
  );
}

export default Login;
