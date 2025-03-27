import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if user is already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobileNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.email,
      password: data.password
    }, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber
    }, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Column */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="bg-white rounded-md shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome Back</h2>
                <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
                  <div className="mb-4">
                    <label htmlFor="login-email" className="block text-gray-700 text-sm mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="login-email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...loginRegister("email")}
                    />
                    {loginErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{loginErrors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="login-password" className="block text-gray-700 text-sm mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="login-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...loginRegister("password")}
                    />
                    {loginErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{loginErrors.password.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-[#4ebb78] text-white py-2 rounded-md hover:bg-opacity-90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </button>
                  
                  <div className="mt-2 text-center">
                    <a href="#" className="text-sm text-blue-500 hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="bg-white rounded-md shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Create an Account</h2>
                <form onSubmit={handleRegisterSubmit(onRegisterSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="firstName" className="block text-gray-700 text-sm mb-2">
                        First Name*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                        {...registerRegister("firstName")}
                      />
                      {registerErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{registerErrors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-gray-700 text-sm mb-2">
                        Last Name*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                        {...registerRegister("lastName")}
                      />
                      {registerErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{registerErrors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="mobileNumber" className="block text-gray-700 text-sm mb-2">
                      Mobile Number*
                    </label>
                    <input
                      type="text"
                      id="mobileNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...registerRegister("mobileNumber")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Please insert +1 (USA), you will need to verify your mobile number
                    </p>
                    {registerErrors.mobileNumber && (
                      <p className="text-red-500 text-xs mt-1">{registerErrors.mobileNumber.message}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="register-email" className="block text-gray-700 text-sm mb-2">
                      Email address*
                    </label>
                    <input
                      type="email"
                      id="register-email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...registerRegister("email")}
                    />
                    {registerErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{registerErrors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="register-password" className="block text-gray-700 text-sm mb-2">
                      Password*
                    </label>
                    <input
                      type="password"
                      id="register-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...registerRegister("password")}
                    />
                    {registerErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{registerErrors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-gray-700 text-sm mb-2">
                      Repeat Password*
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                      {...registerRegister("confirmPassword")}
                    />
                    {registerErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{registerErrors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-[#4ebb78] text-white py-2 rounded-md hover:bg-opacity-90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Hero Section */}
        <div className="bg-[#f9fafb] p-8 rounded-md shadow hidden md:block">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Find Your Perfect Match</h2>
          <p className="text-gray-600 mb-6">
            Join the world's largest escort directory with thousands of active listings. Schloka offers a secure and user-friendly platform to connect with verified escorts in your area.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-[#4ebb78] rounded-full p-2 mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Verified Profiles</h3>
                <p className="text-sm text-gray-600">All profiles are verified to ensure authenticity</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[#4ebb78] rounded-full p-2 mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Global Coverage</h3>
                <p className="text-sm text-gray-600">Access services in over 500+ cities worldwide</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[#4ebb78] rounded-full p-2 mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Easy Contact</h3>
                <p className="text-sm text-gray-600">Direct contact with service providers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}