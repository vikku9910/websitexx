import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useRef } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import MobileVerification from "@/components/MobileVerification";
import AdPromotion from "@/components/AdPromotion";
import { useAuth } from "@/hooks/use-auth";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 5;

const adSchema = z.object({
  state: z.string().min(1, "City is required"),
  city: z.string().optional(), // Make city optional as we're only using state now
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  gender: z.string().optional(),
  age: z.string().optional(),
  nationality: z.string().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  services: z.array(z.string()).optional(),
  photos: z.any(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type AdFormValues = z.infer<typeof adSchema>;

export default function PostAdPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMobileVerification, setShowMobileVerification] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [formData, setFormData] = useState<{
    formValues: AdFormValues | null;
    photoUrls: string[] | null;
  }>({
    formValues: null,
    photoUrls: null
  });
  const [createdAdId, setCreatedAdId] = useState<number | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      state: "",
      city: "",
      category: "",
      title: "",
      description: "",
      mobileNumber: "",
      gender: "",
      age: "",
      nationality: "",
      eyeColor: "",
      hairColor: "",
      height: "",
      weight: "",
      services: [],
      agreeTerms: false,
    },
  });
  
  // No need to watch state field anymore
  
  // No need to reset city as we don't use it anymore

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Validate file count
    if (files.length < MIN_PHOTOS || files.length > MAX_PHOTOS) {
      toast({
        title: "Invalid file count",
        description: `Please select between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos`,
        variant: "destructive"
      });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    // Validate file size and type
    let isValid = true;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds the 5MB size limit`,
          variant: "destructive"
        });
        isValid = false;
        break;
      }
      
      // Check file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not a supported image type. Please use JPG, PNG, or WebP.`,
          variant: "destructive"
        });
        isValid = false;
        break;
      }
    }
    
    if (!isValid) {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    setSelectedFiles(files);
    
    // Create preview URLs for selected images
    const newPreviewUrls: string[] = [];
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    });
    
    // Clear any old preview URLs to avoid memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls(newPreviewUrls);
  };

  // State for tracking error state
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const onSubmit = async (data: AdFormValues) => {
    try {
      setSubmitError(null); // Reset error state
      
      // Use the selected files from state instead of relying on form data
      if (!selectedFiles || selectedFiles.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one photo",
          variant: "destructive"
        });
        return;
      }
      
      // Validate minimum and maximum photo requirements
      if (!selectedFiles || selectedFiles.length < MIN_PHOTOS) {
        toast({
          title: "Error",
          description: `Please upload at least ${MIN_PHOTOS} photos`,
          variant: "destructive"
        });
        return;
      }
      
      if (selectedFiles.length > MAX_PHOTOS) {
        toast({
          title: "Error",
          description: `Please upload no more than ${MAX_PHOTOS} photos`,
          variant: "destructive"
        });
        return;
      }
      
      // Convert files to base64 strings for storage
      const photoPromises = Array.from(selectedFiles).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      
      const photoUrls = await Promise.all(photoPromises);
      
      // Instead of submitting directly, show the mobile verification step
      setFormData({
        formValues: data,
        photoUrls
      });
      
      // Show mobile verification step
      setShowMobileVerification(true);
    } catch (error) {
      console.error('Error processing ad:', error);
      
      // Set the error message for the UI
      const errorMessage = error instanceof Error ? error.message : "Failed to process ad data. Please try again.";
      setSubmitError(errorMessage);
      
      toast({
        title: "Error processing ad",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle completing the mobile verification
  const handleVerificationComplete = async () => {
    try {
      if (!formData.formValues || !formData.photoUrls) {
        throw new Error("Form data is missing. Please try again.");
      }
      
      // Create ad submission data
      const adData = {
        title: formData.formValues.title,
        description: formData.formValues.description,
        location: formData.formValues.state, // Just use the state field as city
        category: formData.formValues.category,
        contactNumber: formData.formValues.mobileNumber,
        contactEmail: user?.username || "",
        photoUrls: formData.photoUrls,
        isVerified: true, // Set to true as mobile is now verified
        // Add additional fields from our new form
        age: formData.formValues.age,
        gender: formData.formValues.gender,
        nationality: formData.formValues.nationality,
        eyeColor: formData.formValues.eyeColor,
        hairColor: formData.formValues.hairColor,
        height: formData.formValues.height,
        weight: formData.formValues.weight,
        services: formData.formValues.services?.join(", ") || "",
      };
      
      // Make API call to save the ad
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to post ad. Please try again.');
      }
      
      const newAd = await response.json();
      setCreatedAdId(newAd.id);
      
      toast({
        title: "Ad created successfully",
        description: "Your ad has been created and your mobile number is verified.",
      });
      
      // Hide mobile verification and show promotion options
      setShowMobileVerification(false);
      setShowPromotion(true);
    } catch (error) {
      console.error('Error posting ad:', error);
      
      // Set the error message for the UI
      const errorMessage = error instanceof Error ? error.message : "Failed to post ad. Please try again.";
      setSubmitError(errorMessage);
      setShowMobileVerification(false);
      
      toast({
        title: "Error posting ad",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle skipping the mobile verification
  const handleSkipVerification = async () => {
    try {
      if (!formData.formValues || !formData.photoUrls) {
        throw new Error("Form data is missing. Please try again.");
      }
      
      // Create ad submission data
      const adData = {
        title: formData.formValues.title,
        description: formData.formValues.description,
        location: formData.formValues.state, // Just use the state field as city
        category: formData.formValues.category,
        contactNumber: formData.formValues.mobileNumber,
        contactEmail: user?.username || "",
        photoUrls: formData.photoUrls,
        isVerified: false, // Set to false as mobile verification was skipped
        // Add additional fields from our new form
        age: formData.formValues.age,
        gender: formData.formValues.gender,
        nationality: formData.formValues.nationality,
        eyeColor: formData.formValues.eyeColor,
        hairColor: formData.formValues.hairColor,
        height: formData.formValues.height,
        weight: formData.formValues.weight,
        services: formData.formValues.services?.join(", ") || "",
      };
      
      // Make API call to save the ad
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to post ad. Please try again.');
      }
      
      const newAd = await response.json();
      setCreatedAdId(newAd.id);
      
      toast({
        title: "Ad created successfully",
        description: "Your ad has been created, but mobile verification was skipped.",
      });
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setSelectedFiles(null);
      setShowMobileVerification(false);
      
      // Reset the form after successful submission
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // No promotion step for unverified ads - go directly to the ad page
      window.location.href = `/ad/${newAd.id}`;
    } catch (error) {
      console.error('Error posting ad:', error);
      
      // Set the error message for the UI
      const errorMessage = error instanceof Error ? error.message : "Failed to post ad. Please try again.";
      setSubmitError(errorMessage);
      setShowMobileVerification(false);
      
      toast({
        title: "Error posting ad",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle promotion completion or skipping
  const handlePromotionComplete = async (promotionId: number | null) => {
    try {
      if (promotionId) {
        // If a promotion was created, update the ad with the promotion ID
        const response = await fetch(`/api/ads/${createdAdId}/promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ promotionId }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to link promotion to ad. Please contact support.');
        }
        
        toast({
          title: "Ad promoted successfully",
          description: "Your ad has been posted and promoted successfully.",
        });
      } else {
        toast({
          title: "Ad posted successfully",
          description: "Your ad has been posted successfully without promotion.",
        });
      }
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setSelectedFiles(null);
      setShowPromotion(false);
      
      // Reset the form after successful submission
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Redirect to the new ad page
      window.location.href = `/ad/${createdAdId}`;
    } catch (error) {
      console.error('Error promoting ad:', error);
      
      // Set the error message for the UI
      const errorMessage = error instanceof Error ? error.message : "Failed to promote ad. Please try again.";
      setSubmitError(errorMessage);
      
      toast({
        title: "Error promoting ad",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Still redirect to the ad page even if promotion linking fails
      window.location.href = `/ad/${createdAdId}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-[#4ebb78] hover:underline">
            <Home className="h-5 w-5 mr-1" />
            <span>Home</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 text-center flex-1">Post Your Ad Here</h1>
          <div className="w-20"></div> {/* This empty div helps balance the layout */}
        </div>
        
        {/* Mobile Verification Modal */}
        {showMobileVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <MobileVerification 
                mobileNumber={formData.formValues?.mobileNumber || ""}
                onVerificationComplete={handleVerificationComplete}
                onSkip={handleSkipVerification}
              />
            </div>
          </div>
        )}
        
        {/* Promotion Modal */}
        {showPromotion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-xl w-full overflow-y-auto max-h-[90vh]">
              <AdPromotion 
                adTitle={formData.formValues?.title || ""}
                adImage={previewUrls.length > 0 ? previewUrls[0] : null}
                onPromotionComplete={handlePromotionComplete}
                onCancel={() => handlePromotionComplete(null)}
              />
            </div>
          </div>
        )}
        
        {/* Error Banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Error posting ad</h3>
              <p className="text-sm">{submitError}</p>
              <p className="text-sm mt-1">Please try again or check your connection.</p>
            </div>
          </div>
        )}
        
        <form 
          className="bg-white p-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-4">
            <label htmlFor="state" className="block text-gray-700 text-sm mb-2">
              City*
            </label>
            <select
              id="state"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("state")}
            >
              <option value="">Select City</option>
              <option value="Agra">Agra</option>
              <option value="Ghaziabad">Ghaziabad</option>
              <option value="Kanpur">Kanpur</option>
              <option value="Varanasi">Varanasi</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Ranchi">Ranchi</option>
              <option value="Gwalior">Gwalior</option>
              <option value="Surat">Surat</option>
              <option value="Noida">Noida</option>
              <option value="Ludhiana">Ludhiana</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
              <option value="Nashik">Nashik</option>
              <option value="Meerut">Meerut</option>
              <option value="Visakhapatnam">Visakhapatnam</option>
              <option value="Jalandhar">Jalandhar</option>
              <option value="Dehradun">Dehradun</option>
              <option value="Lucknow">Lucknow</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Goa">Goa</option>
              <option value="Pune">Pune</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Jodhpur">Jodhpur</option>
              <option value="Udaipur">Udaipur</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Andheri">Andheri</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Patna">Patna</option>
              <option value="Raipur">Raipur</option>
              <option value="Bhubaneswar">Bhubaneswar</option>
              <option value="Vijayawada">Vijayawada</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
            {errors.state && (
              <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="category" className="block text-gray-700 text-sm mb-2">
              Category*
            </label>
            <select
              id="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("category")}
            >
              <option value="">Select Category</option>
              <option value="Call Girl">Call Girl</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm mb-2">
              Title*
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 text-sm mb-2">
              Description*
            </label>
            <textarea
              id="description"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("description")}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="mobileNumber" className="block text-gray-700 text-sm mb-2">
              Mobile Number*
            </label>
            <input
              type="tel"
              id="mobileNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("mobileNumber")}
            />
            {errors.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="gender" className="block text-gray-700 text-sm mb-2">
              Gender
            </label>
            <select
              id="gender"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("gender")}
            >
              <option value="">Please select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="age" className="block text-gray-700 text-sm mb-2">
              Age
            </label>
            <input
              type="text"
              id="age"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("age")}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="nationality" className="block text-gray-700 text-sm mb-2">
              Nationality
            </label>
            <select
              id="nationality"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("nationality")}
            >
              <option value="">Please select nationality</option>
              <option value="Indian">Indian</option>
              <option value="American">American</option>
              <option value="British">British</option>
              <option value="Canadian">Canadian</option>
              <option value="Australian">Australian</option>
              <option value="Russian">Russian</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="eyeColor" className="block text-gray-700 text-sm mb-2">
              Eye Color
            </label>
            <input
              type="text"
              id="eyeColor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("eyeColor")}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="hairColor" className="block text-gray-700 text-sm mb-2">
              Hair Color
            </label>
            <input
              type="text"
              id="hairColor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("hairColor")}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="height" className="block text-gray-700 text-sm mb-2">
              Height
            </label>
            <input
              type="text"
              id="height"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("height")}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="weight" className="block text-gray-700 text-sm mb-2">
              Weight
            </label>
            <input
              type="text"
              id="weight"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              {...register("weight")}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              Services Offered
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service1" 
                  className="mr-2"
                  value="24/7 Available"
                  {...register("services")}
                />
                <label htmlFor="service1">24/7 Available</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service2" 
                  className="mr-2"
                  value="Home Service"
                  {...register("services")}
                />
                <label htmlFor="service2">Home Service</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service3" 
                  className="mr-2"
                  value="Free Consultation"
                  {...register("services")}
                />
                <label htmlFor="service3">Free Consultation</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service4" 
                  className="mr-2"
                  value="Cash Payment"
                  {...register("services")}
                />
                <label htmlFor="service4">Cash Payment</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service5" 
                  className="mr-2"
                  value="Online Payment"
                  {...register("services")}
                />
                <label htmlFor="service5">Online Payment</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service6" 
                  className="mr-2"
                  value="Free Delivery"
                  {...register("services")}
                />
                <label htmlFor="service6">Free Delivery</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service7" 
                  className="mr-2"
                  value="Warranty Available"
                  {...register("services")}
                />
                <label htmlFor="service7">Warranty Available</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="service8" 
                  className="mr-2"
                  value="Certificate Provided"
                  {...register("services")}
                />
                <label htmlFor="service8">Certificate Provided</label>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="photos" className="block text-gray-700 text-sm mb-2">
              Photos
            </label>
            <div className="relative">
              <input
                type="file"
                id="photos"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <p className="text-xs mt-1 text-gray-500">Please select at least 2 images (max 5)</p>
            </div>
            
            {/* Image Preview Section */}
            {previewUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border border-gray-300"
                      />
                      <span className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl-md rounded-tr-md px-1.5 py-0.5 text-xs">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="agreeTerms" 
                className="mr-2"
                {...register("agreeTerms")}
              />
              <label htmlFor="agreeTerms" className="text-sm">
                I confirm that I am the owner of this advertisement or I am authorized to post this advertisement. I agree to the <Link to="/terms" className="text-blue-500 hover:underline">Terms and Conditions</Link> and <Link to="/guidelines" className="text-blue-500 hover:underline">Advert Guidelines</Link>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.agreeTerms.message}</p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              Request Your Ad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}