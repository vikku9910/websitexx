import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { AlertCircle, Home, Loader2 } from "lucide-react";
import { locations } from "@/data/locations";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  photos: z.any(),
  gender: z.string().optional(),
  age: z.string().optional(),
  nationality: z.string().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  services: z.array(z.string()).optional()
});

type AdFormValues = z.infer<typeof adSchema>;

export default function EditAdPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adData, setAdData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for tracking error state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
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
      gender: "",
      age: "",
      nationality: "",
      eyeColor: "",
      hairColor: "",
      height: "",
      weight: "",
      services: []
    },
  });

  useEffect(() => {
    async function fetchAdData() {
      try {
        setIsLoading(true);
        setLoadingError(null);
        
        const response = await fetch(`/api/ads/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load ad data. Please try again.');
        }
        
        const data = await response.json();
        setAdData(data);
        
        // Set form values
        reset({
          title: data.title,
          description: data.description,
          location: data.location,
          category: data.category,
          contactNumber: data.contactNumber,
          contactEmail: data.contactEmail,
          // Add additional fields from our data
          age: data.age || "",
          gender: data.gender || "",
          nationality: data.nationality || "",
          eyeColor: data.eyeColor || "",
          hairColor: data.hairColor || "",
          height: data.height || "",
          weight: data.weight || "",
          services: data.services ? data.services.split(",").map((s: string) => s.trim()) : []
        });
        
        // Set existing photos
        if (data.photoUrls && Array.isArray(data.photoUrls)) {
          setExistingPhotos(data.photoUrls);
        }
        
      } catch (error) {
        console.error('Error loading ad data:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load ad data. Please try again.";
        setLoadingError(errorMessage);
        
        toast({
          title: "Error loading ad",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAdData();
  }, [id, reset, toast]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Validate file count in combination with existing photos
    const totalCount = existingPhotos.length + files.length;
    if (totalCount < MIN_PHOTOS || totalCount > MAX_PHOTOS) {
      toast({
        title: "Invalid file count",
        description: `Total photos must be between ${MIN_PHOTOS} and ${MAX_PHOTOS}`,
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

  const onSubmit = async (data: AdFormValues) => {
    try {
      setSubmitError(null); // Reset error state
      
      // Ensure the total count of photos is within the allowed range
      const totalCount = existingPhotos.length + (selectedFiles ? selectedFiles.length : 0);
      if (totalCount < MIN_PHOTOS) {
        toast({
          title: "Error",
          description: `Please have at least ${MIN_PHOTOS} photos in total`,
          variant: "destructive"
        });
        return;
      }
      
      if (totalCount > MAX_PHOTOS) {
        toast({
          title: "Error",
          description: `Please have no more than ${MAX_PHOTOS} photos in total`,
          variant: "destructive"
        });
        return;
      }
      
      // Create update data
      let updatedAdData: any = {
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        contactNumber: data.contactNumber,
        contactEmail: data.contactEmail,
        // Include additional fields
        age: data.age,
        gender: data.gender,
        nationality: data.nationality,
        eyeColor: data.eyeColor,
        hairColor: data.hairColor,
        height: data.height,
        weight: data.weight,
        services: data.services ? data.services.join(", ") : ""
      };
      
      // If new files are selected, convert them to base64 and merge with existing photos
      if (selectedFiles && selectedFiles.length > 0) {
        const photoPromises = Array.from(selectedFiles).map((file: File) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          });
        });
        
        const newPhotoUrls = await Promise.all(photoPromises);
        updatedAdData.photoUrls = [...existingPhotos, ...newPhotoUrls];
      } else {
        // Use existing photos if no new ones were added
        updatedAdData.photoUrls = existingPhotos;
      }
      
      // Make API call to update the ad
      const response = await apiRequest('PATCH', `/api/ads/${id}`, updatedAdData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ad. Please try again.');
      }
      
      const updatedAd = await response.json();
      
      // Invalidate queries to ensure fresh data is loaded
      queryClient.invalidateQueries({ queryKey: ['/api/my-ads'] });
      queryClient.invalidateQueries({ queryKey: [`/api/ads/${id}`] });
      
      toast({
        title: "Ad updated successfully",
        description: "Your ad has been updated successfully.",
      });
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setSelectedFiles(null);
      
      // Redirect to the ad detail page
      setLocation(`/ad/${id}`);
      
    } catch (error) {
      console.error('Error updating ad:', error);
      
      // Set the error message for the UI
      const errorMessage = error instanceof Error ? error.message : "Failed to update ad. Please try again.";
      setSubmitError(errorMessage);
      
      toast({
        title: "Error updating ad",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const removeExistingPhoto = (index: number) => {
    const updatedPhotos = [...existingPhotos];
    updatedPhotos.splice(index, 1);
    setExistingPhotos(updatedPhotos);
    
    // Check if remaining photos are below minimum
    if (updatedPhotos.length + (selectedFiles ? selectedFiles.length : 0) < MIN_PHOTOS) {
      toast({
        title: "Warning",
        description: `You must have at least ${MIN_PHOTOS} photos. Please add more before saving.`,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#4ebb78] mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600">Loading ad data...</h2>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-md">
            <AlertCircle className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-center mb-4">Error Loading Ad</h2>
            <p className="text-center mb-4">{loadingError}</p>
            <div className="flex justify-center">
              <Link href="/my-listings" className="bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                Go Back to My Listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/my-listings" className="flex items-center text-[#4ebb78] hover:underline">
            <Home className="h-5 w-5 mr-1" />
            <span>My Listings</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 text-center flex-1">Edit Your Ad</h1>
          <div className="w-20"></div> {/* This empty div helps balance the layout */}
        </div>
        
        {/* Error Banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Error updating ad</h3>
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
                <option value="hobbies">Hobbies</option>
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
                type="text"
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
            {/* Current Photos Display */}
            {existingPhotos.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">
                  Current Photos
                </label>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((url, index) => (
                    <div key={`existing-${index}`} className="relative w-24 h-24">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border border-gray-300"
                      />
                      <span className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl-md rounded-tr-md px-1.5 py-0.5 text-xs">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {existingPhotos.length} existing photos
                </p>
              </div>
            )}
            
            <label htmlFor="photos" className="block text-gray-700 text-sm mb-2">
              Add Photos <span className="text-xs text-gray-500">(Total must be {MIN_PHOTOS}-{MAX_PHOTOS} photos)</span>
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
              {existingPhotos.length + previewUrls.length < MIN_PHOTOS && (
                <p className="text-red-500 text-xs mt-1">Total of {MIN_PHOTOS}-{MAX_PHOTOS} photos are required</p>
              )}
            </div>
            
            {/* New Photos Preview */}
            {previewUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">New photos to add:</p>
                <div className="flex flex-wrap gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative w-24 h-24">
                      <img
                        src={url}
                        alt={`New photo ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border border-gray-300"
                      />
                      <span className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl-md rounded-tr-md px-1.5 py-0.5 text-xs">
                        New {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Total photos counter */}
            <div className="mt-2 flex items-center text-xs text-gray-700">
              <span className={existingPhotos.length + previewUrls.length < MIN_PHOTOS ? "text-red-500" : "text-green-500"}>
                Total: {existingPhotos.length + previewUrls.length} of {MIN_PHOTOS}-{MAX_PHOTOS} photos
              </span>
              {existingPhotos.length + previewUrls.length >= MIN_PHOTOS && 
                existingPhotos.length + previewUrls.length <= MAX_PHOTOS && (
                <span className="ml-2 text-green-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  OK
                </span>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-600">
              <p className="font-semibold">Please note the following rules:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Provide accurate and detailed information about your listing</li>
                <li>Do not use offensive language or post inappropriate content</li>
                <li>Do not insert external links in the title or description</li>
                <li>Upload clear, high-quality photos of the actual item or service</li>
                <li>Ensure your contact information is current and accurate</li>
              </ol>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="gender" className="block text-gray-700 text-sm mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                  {...register("gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nationality" className="block text-gray-700 text-sm mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  id="nationality"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                  {...register("nationality")}
                />
              </div>
              
              <div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
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
              
              <div>
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
                    value="69 Position"
                    {...register("services")}
                  />
                  <label htmlFor="service1">69 Position</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service2" 
                    className="mr-2"
                    value="French Kissing"
                    {...register("services")}
                  />
                  <label htmlFor="service2">French Kissing</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service3" 
                    className="mr-2"
                    value="Kissing"
                    {...register("services")}
                  />
                  <label htmlFor="service3">Kissing</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service4" 
                    className="mr-2"
                    value="Cum on Face"
                    {...register("services")}
                  />
                  <label htmlFor="service4">Cum on Face</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service5" 
                    className="mr-2"
                    value="Handjob"
                    {...register("services")}
                  />
                  <label htmlFor="service5">Handjob</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service6" 
                    className="mr-2"
                    value="Cum in Mouth"
                    {...register("services")}
                  />
                  <label htmlFor="service6">Cum in Mouth</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service7" 
                    className="mr-2"
                    value="Swallow"
                    {...register("services")}
                  />
                  <label htmlFor="service7">Swallow</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service8" 
                    className="mr-2"
                    value="Deep Throat"
                    {...register("services")}
                  />
                  <label htmlFor="service8">Deep Throat</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service9" 
                    className="mr-2"
                    value="Ball Sucking"
                    {...register("services")}
                  />
                  <label htmlFor="service9">Ball Sucking</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service10" 
                    className="mr-2"
                    value="Anal"
                    {...register("services")}
                  />
                  <label htmlFor="service10">Anal</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service11" 
                    className="mr-2"
                    value="Rimming"
                    {...register("services")}
                  />
                  <label htmlFor="service11">Rimming</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service12" 
                    className="mr-2"
                    value="Doggy"
                    {...register("services")}
                  />
                  <label htmlFor="service12">Doggy</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service13" 
                    className="mr-2"
                    value="Couples"
                    {...register("services")}
                  />
                  <label htmlFor="service13">Couples</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service14" 
                    className="mr-2"
                    value="Massage"
                    {...register("services")}
                  />
                  <label htmlFor="service14">Massage</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service15" 
                    className="mr-2"
                    value="Body to Body"
                    {...register("services")}
                  />
                  <label htmlFor="service15">Body to Body</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="service16" 
                    className="mr-2"
                    value="Strip Tease"
                    {...register("services")}
                  />
                  <label htmlFor="service16">Strip Tease</label>
                </div>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-[#4ebb78] text-white py-3 rounded-md hover:bg-opacity-90 font-medium"
          >
            Update Your Ad
          </button>
        </form>
      </div>
    </div>
  );
}