import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import { locations } from "@/data/locations";
import MobileVerification from "@/components/MobileVerification";
import AdPromotion from "@/components/AdPromotion";
import { useAuth } from "@/hooks/use-auth";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 5;

// Function to validate minimum word count
const validateWordCount = (text: string, minWords: number, fieldName: string) => {
  const words = text.trim().split(/\s+/);
  return words.length >= minWords || `${fieldName} must contain at least ${minWords} words`;
};

const adSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .refine(
      (value) => validateWordCount(value, 10, "Title") === true,
      {
        message: "Title must contain at least 10 words"
      }
    ),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .refine(
      (value) => validateWordCount(value, 50, "Description") === true,
      {
        message: "Description must contain at least 50 words"
      }
    ),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  photos: z.any()
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
    formState: { errors },
  } = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "",
      contactNumber: "",
      contactEmail: "",
    },
  });

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
      if (selectedFiles.length < MIN_PHOTOS) {
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
        location: formData.formValues.location,
        category: formData.formValues.category,
        contactNumber: formData.formValues.contactNumber,
        contactEmail: formData.formValues.contactEmail,
        photoUrls: formData.photoUrls,
        isVerified: true // Set to true as mobile is now verified
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
        location: formData.formValues.location,
        category: formData.formValues.category,
        contactNumber: formData.formValues.contactNumber,
        contactEmail: formData.formValues.contactEmail,
        photoUrls: formData.photoUrls,
        isVerified: false // Set to false as mobile verification was skipped
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
          <h1 className="text-2xl font-semibold text-gray-800 text-center flex-1">Post Your Ad</h1>
          <div className="w-20"></div> {/* This empty div helps balance the layout */}
        </div>
        
        {/* Mobile Verification Modal */}
        {showMobileVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <MobileVerification 
                mobileNumber={formData.formValues?.contactNumber || ""}
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
          className="bg-white rounded-md shadow p-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm mb-2">
              Ad Title*
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="location" className="block text-gray-700 text-sm mb-2">
                Location*
              </label>
              <select
                id="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78] max-h-60 overflow-y-auto"
                {...register("location")}
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.name.toLowerCase()}>
                    {location.name}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="category" className="block text-gray-700 text-sm mb-2">
                Category*
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                {...register("category")}
              >
                <option value="">Select Category</option>
                <option value="services">Services</option>
                <option value="real-estate">Real Estate</option>
                <option value="jobs">Jobs</option>
                <option value="electronics">Electronics</option>
                <option value="vehicles">Vehicles</option>
                <option value="furniture">Furniture</option>
                <option value="fashion">Fashion</option>
                <option value="education">Education</option>
                <option value="pets">Pets</option>
                <option value="others">Others</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="contactNumber" className="block text-gray-700 text-sm mb-2">
                Contact Number*
              </label>
              <input
                type="tel"
                id="contactNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                {...register("contactNumber")}
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="contactEmail" className="block text-gray-700 text-sm mb-2">
                Contact Email*
              </label>
              <input
                type="email"
                id="contactEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="photos" className="block text-gray-700 text-sm mb-2">
              Photos* <span className="text-xs text-gray-500">(Upload {MIN_PHOTOS}-{MAX_PHOTOS} photos)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="photos"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className={`w-full px-3 py-2 border ${previewUrls.length === 0 ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]`}
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {previewUrls.length === 0 && (
                <p className="text-red-500 text-xs mt-1">{MIN_PHOTOS}-{MAX_PHOTOS} photos are required</p>
              )}
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
                <div className="mt-2 flex items-center text-xs text-gray-700">
                  <span className={previewUrls.length < MIN_PHOTOS ? "text-red-500" : "text-green-500"}>
                    {previewUrls.length} of {MIN_PHOTOS}-{MAX_PHOTOS} photos selected
                  </span>
                  {previewUrls.length >= MIN_PHOTOS && previewUrls.length <= MAX_PHOTOS && (
                    <span className="ml-2 text-green-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      OK
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-600">
              <p className="font-semibold">Please note the following rules:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Provide accurate and detailed information about your listing</li>
                <li>Do not use offensive language or post prohibited items</li>
                <li>Upload clear, high-quality photos (JPG, PNG, or WebP format)</li>
                <li>Maximum file size: 5MB per photo</li>
                <li>Include {MIN_PHOTOS}-{MAX_PHOTOS} photos to give a complete view of your item</li>
              </ol>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <button
              type="submit"
              className="w-full bg-[#4ebb78] hover:bg-[#3da967] text-white py-2 px-4 rounded-md transition-colors"
            >
              Post Ad
            </button>
            <p className="mt-3 text-gray-500 text-xs text-center">
              By posting this ad, you agree to our <Link href="/terms" className="text-[#4ebb78] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#4ebb78] hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}