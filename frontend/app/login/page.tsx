"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import EcoHarvest from "../images/ecoHarvestLogo.png";

// Base URL for API requests
const BASE_URL = "/api/proxy/api/auth";

// Define interfaces for type safety
interface LoginResponse {
  role: "Vendor" | "Company" | "Customer" | "Admin";
}

const Login: React.FC = () => {
  const router = useRouter();

  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [registrationType, setRegistrationType] = useState<"Individual" | "Business">("Individual");
  const [registrationPage, setRegistrationPage] = useState<number>(1);

  // Individual registration fields
  const [regFirstName, setRegFirstName] = useState<string>("");
  const [regLastName, setRegLastName] = useState<string>("");
  const [regDateOfBirth, setRegDateOfBirth] = useState<string>("");
  const [regGender, setRegGender] = useState<string>("");
  const [regAddress, setRegAddress] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhoneNumber, setRegPhoneNumber] = useState<string>("");
  const [regUserName, setRegUserName] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regRepeatPassword, setRegRepeatPassword] = useState<string>("");

  // Business registration fields
  const [comFirstName, setComFirstName] = useState<string>("");
  const [comLastName, setComLastName] = useState<string>("");
  const [comDateOfBirth, setComDateOfBirth] = useState<string>("");
  const [comGender, setComGender] = useState<string>("");
  const [comAddress, setComAddress] = useState<string>("");
  const [comEmail, setComEmail] = useState<string>("");
  const [comPhoneNumber, setComPhoneNumber] = useState<string>("");
  const [comUserName, setComUserName] = useState<string>("");
  const [comPassword, setComPassword] = useState<string>("");
  const [comRepeatPassword, setComRepeatPassword] = useState<string>("");
  const [comCompanyName, setComCompanyName] = useState<string>("");
  const [comCategory, setComCategory] = useState<string>("");

  const [loginError, setLoginError] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<boolean>(false);

  const handleToggleView = (): void => {
    setIsLoginView(!isLoginView);
    setRegistrationPage(1);
  };

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post<LoginResponse>(
        `${BASE_URL}/login`,
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      setLoginError(false);

      setTimeout(() => {
        switch (response.data.role) {
          case "Vendor":
            router.push("/vendor");
            break;
          case "Company":
          case "Customer":
            router.push("/");
            break;
          case "Admin":
            router.push("/admin");
            break;
          default:
            console.error("Unknown role:", response.data.role);
            break;
        }
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndividualRegistration = async (): Promise<void> => {
    if (regPassword !== regRepeatPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!regUserName || !regPassword || !regRepeatPassword) {
      setRegistrationError(true);
      return;
    }

    try {
      await axios.post(`${BASE_URL}/registerIndividualCustomer`, {
        firstName: regFirstName,
        lastName: regLastName,
        phoneNumber: regPhoneNumber,
        email: regEmail,
        dateOfBirth: regDateOfBirth,
        gender: regGender,
        address: regAddress,
        username: regUserName,
        password: regPassword,
      });
      window.location.reload();
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response) {
        alert(`Registration failed: ${error.response.data.message || error.response.statusText}`);
      } else {
        alert("Registration failed: " + error.message);
      }
    }
  };

  const handleBusinessRegistration = async (): Promise<void> => {
    if (comPassword !== comRepeatPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!comUserName || !comPassword || !comRepeatPassword) {
      setRegistrationError(true);
      return;
    }

    try {
      await axios.post(`${BASE_URL}/registerCompanyCustomer`, {
        firstName: comFirstName,
        lastName: comLastName,
        companyName: comCompanyName,
        phoneNumber: comPhoneNumber,
        email: comEmail,
        dateOfBirth: comDateOfBirth,
        gender: comGender,
        address: comAddress,
        category: comCategory,
        username: comUserName,
        password: comPassword,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error in registering:", error);
    }
  };

  // Reusable input component
  const FormInput = ({
    type = "text",
    value,
    onChange,
    placeholder,
    label,
  }: {
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    label: string;
  }) => (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || " "}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base
          placeholder-transparent peer focus:outline-none focus:border-[#FDAA1C] focus:bg-white transition-all"
      />
      <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent
        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[#FDAA1C] peer-focus:bg-white">
        {label}
      </label>
    </div>
  );

  // Step indicator component
  const StepIndicator = ({ currentStep, totalSteps = 3 }: { currentStep: number; totalSteps?: number }) => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div
            onClick={() => step < currentStep && setRegistrationPage(step)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all
              ${step === currentStep
                ? 'bg-[#FDAA1C] text-white shadow-lg scale-110'
                : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'}`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div className={`w-8 h-1 rounded-full ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Brand Section - Hidden on mobile when viewing forms */}
      <div className={`${isLoginView ? 'flex' : 'hidden lg:flex'} lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 
        flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#FDAA1C] rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 text-center lg:text-left max-w-md">
          <Image
            src={EcoHarvest}
            alt="EcoHarvest Logo"
            className="w-48 md:w-64 lg:w-72 mx-auto lg:mx-0 mb-8"
          />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-[#FDAA1C]">EcoHarvest</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Your sustainable marketplace for eco-friendly products. Join thousands of conscious consumers.
          </p>

          {/* Demo credentials card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hidden lg:block">
            <h3 className="text-[#FDAA1C] font-semibold mb-4">Demo Credentials</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Customer</p>
                <p className="text-white">aaa / aaa</p>
              </div>
              <div>
                <p className="text-gray-400">Vendor</p>
                <p className="text-white">test / test</p>
              </div>
              <div>
                <p className="text-gray-400">Admin</p>
                <p className="text-white">tony / tony</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile view toggle */}
        <button
          onClick={handleToggleView}
          className="lg:hidden mt-8 px-6 py-3 bg-[#FDAA1C] text-gray-900 rounded-full font-semibold 
            hover:bg-yellow-400 transition-all shadow-lg"
        >
          {isLoginView ? "Create Account" : "Back to Login"}
        </button>
      </div>

      {/* Forms Section */}
      <div className={`${!isLoginView ? 'flex' : 'hidden lg:flex'} lg:w-1/2 flex-col items-center justify-center p-4 sm:p-8`}>
        <div className="w-full max-w-md">
          {/* Login Form */}
          {isLoginView ? (
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-500 mb-6">Welcome back! Please enter your details.</p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <FormInput
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  label="Username"
                />
                <FormInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                />

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    Invalid username or password. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#FDAA1C] text-gray-900 rounded-xl font-semibold text-lg
                    hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl disabled:opacity-50
                    disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-gray-600 mt-6">
                Don&apos;t have an account?{" "}
                <button
                  onClick={handleToggleView}
                  className="text-[#FDAA1C] font-semibold hover:text-yellow-600 transition-colors"
                >
                  Create account
                </button>
              </p>

              {/* Mobile demo credentials */}
              <div className="lg:hidden mt-6 p-4 bg-gray-100 rounded-xl text-sm">
                <p className="font-medium text-gray-700 mb-2">Demo Accounts:</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Customer:</span> aaa/aaa</div>
                  <div><span className="font-medium">Vendor:</span> test/test</div>
                  <div><span className="font-medium">Admin:</span> tony/tony</div>
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-500 mb-6">Join our community of eco-conscious shoppers.</p>

              {/* Account Type Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                {["Individual", "Business"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRegistrationType(type as "Individual" | "Business")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${registrationType === type
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Individual Registration */}
              {registrationType === "Individual" && (
                <>
                  <StepIndicator currentStep={registrationPage} />

                  {registrationPage === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} label="First Name" />
                        <FormInput value={regLastName} onChange={(e) => setRegLastName(e.target.value)} label="Last Name" />
                      </div>
                      <FormInput type="date" value={regDateOfBirth} onChange={(e) => setRegDateOfBirth(e.target.value)} label="Date of Birth" />
                      <div className="relative">
                        <select
                          value={regGender}
                          onChange={(e) => setRegGender(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base
                            focus:outline-none focus:border-[#FDAA1C] focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <FormInput value={regAddress} onChange={(e) => setRegAddress(e.target.value)} label="Address" />
                    </div>
                  )}

                  {registrationPage === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                      <FormInput type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} label="Email Address" />
                      <FormInput value={regPhoneNumber} onChange={(e) => setRegPhoneNumber(e.target.value)} label="Phone Number" />
                    </div>
                  )}

                  {registrationPage === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Account Credentials</h3>
                      <FormInput value={regUserName} onChange={(e) => setRegUserName(e.target.value)} label="Username" />
                      <FormInput type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} label="Password" />
                      <FormInput type="password" value={regRepeatPassword} onChange={(e) => setRegRepeatPassword(e.target.value)} label="Confirm Password" />
                    </div>
                  )}

                  {registrationError && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      Please fill in all required fields.
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {registrationPage > 1 && (
                      <button
                        onClick={() => setRegistrationPage(registrationPage - 1)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                    )}
                    {registrationPage < 3 ? (
                      <button
                        onClick={() => {
                          if (registrationPage === 1 && regFirstName && regLastName && regDateOfBirth && regGender && regAddress) {
                            setRegistrationPage(2);
                            setRegistrationError(false);
                          } else if (registrationPage === 2 && regEmail && regPhoneNumber) {
                            setRegistrationPage(3);
                            setRegistrationError(false);
                          } else {
                            setRegistrationError(true);
                          }
                        }}
                        className="flex-1 py-3 bg-[#FDAA1C] text-gray-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all shadow-lg"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleIndividualRegistration}
                        className="flex-1 py-3 bg-[#FDAA1C] text-gray-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all shadow-lg"
                      >
                        Create Account
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Business Registration */}
              {registrationType === "Business" && (
                <>
                  <StepIndicator currentStep={registrationPage} />

                  {registrationPage === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Business Information</h3>
                      <FormInput value={comCompanyName} onChange={(e) => setComCompanyName(e.target.value)} label="Company Name" />
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput value={comFirstName} onChange={(e) => setComFirstName(e.target.value)} label="First Name" />
                        <FormInput value={comLastName} onChange={(e) => setComLastName(e.target.value)} label="Last Name" />
                      </div>
                      <FormInput type="date" value={comDateOfBirth} onChange={(e) => setComDateOfBirth(e.target.value)} label="Date of Birth" />
                      <div className="relative">
                        <select
                          value={comGender}
                          onChange={(e) => setComGender(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base
                            focus:outline-none focus:border-[#FDAA1C] focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <FormInput value={comCategory} onChange={(e) => setComCategory(e.target.value)} label="Business Category" />
                    </div>
                  )}

                  {registrationPage === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                      <FormInput type="email" value={comEmail} onChange={(e) => setComEmail(e.target.value)} label="Email Address" />
                      <FormInput value={comAddress} onChange={(e) => setComAddress(e.target.value)} label="Business Address" />
                      <FormInput value={comPhoneNumber} onChange={(e) => setComPhoneNumber(e.target.value)} label="Phone Number" />
                    </div>
                  )}

                  {registrationPage === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Account Credentials</h3>
                      <FormInput value={comUserName} onChange={(e) => setComUserName(e.target.value)} label="Username" />
                      <FormInput type="password" value={comPassword} onChange={(e) => setComPassword(e.target.value)} label="Password" />
                      <FormInput type="password" value={comRepeatPassword} onChange={(e) => setComRepeatPassword(e.target.value)} label="Confirm Password" />
                    </div>
                  )}

                  {registrationError && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      Please fill in all required fields.
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {registrationPage > 1 && (
                      <button
                        onClick={() => setRegistrationPage(registrationPage - 1)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                    )}
                    {registrationPage < 3 ? (
                      <button
                        onClick={() => {
                          if (registrationPage === 1 && comCompanyName && comFirstName && comLastName && comDateOfBirth && comGender && comCategory) {
                            setRegistrationPage(2);
                            setRegistrationError(false);
                          } else if (registrationPage === 2 && comEmail && comAddress && comPhoneNumber) {
                            setRegistrationPage(3);
                            setRegistrationError(false);
                          } else {
                            setRegistrationError(true);
                          }
                        }}
                        className="flex-1 py-3 bg-[#FDAA1C] text-gray-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all shadow-lg"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleBusinessRegistration}
                        className="flex-1 py-3 bg-[#FDAA1C] text-gray-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all shadow-lg"
                      >
                        Create Account
                      </button>
                    )}
                  </div>
                </>
              )}

              <p className="text-center text-gray-600 mt-6">
                Already have an account?{" "}
                <button
                  onClick={handleToggleView}
                  className="text-[#FDAA1C] font-semibold hover:text-yellow-600 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
