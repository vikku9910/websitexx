import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  photos: z.any()
});

type AdFormValues = z.infer<typeof adSchema>;

export default function PostAdPage() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      // Use the selected files from state instead of relying on form data
      if (!selectedFiles || selectedFiles.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one photo",
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
      
      // Create ad submission data
      const adData = {
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        contactNumber: data.contactNumber,
        contactEmail: data.contactEmail,
        photoUrls,
        age: 25, // Default age value
        isVerified: true // Set to true for demo purposes
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
      
      toast({
        title: "Ad posted successfully",
        description: "Your ad has been posted successfully.",
      });
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setSelectedFiles(null);
      
      // Reset the form after successful submission
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Redirect to the new ad page
      window.location.href = `/ad/${newAd.id}`;
      
    } catch (error) {
      console.error('Error posting ad:', error);
      toast({
        title: "Error posting ad",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Post Your Ad</h1>
        
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
                {...register("location")}
              >
                <option value="">Select Location</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
                <option value="bangalore">Bangalore</option>
                <option value="chennai">Chennai</option>
                <option value="kolkata">Kolkata</option>
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
                <option value="escort">Escort</option>
                <option value="massage">Massage</option>
                <option value="call-girl">Call Girl</option>
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
            <label htmlFor="photos" className="block text-gray-700 text-sm mb-2">
              Photos* <span className="text-xs text-gray-500">(Upload at least one photo)</span>
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
                <p className="text-red-500 text-xs mt-1">At least one photo is required</p>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-600">
              <p className="font-semibold">Please note the following rules:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Putting keywords like Escort, Call Girl is not allowed</li>
                <li>Do not put any offensive language/words</li>
                <li>Do not insert any link or phone number in the title or description</li>
                <li>Do not upload any adult content or pictures</li>
              </ol>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-[#4ebb78] text-white py-3 rounded-md hover:bg-opacity-90 font-medium"
          >
            Post Your Ad
          </button>
        </form>
      </div>
    </div>
  );
}
