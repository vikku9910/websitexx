import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
});

type AdFormValues = z.infer<typeof adSchema>;

export default function PostAdPage() {
  const { toast } = useToast();
  
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

  const onSubmit = (data: AdFormValues) => {
    // In a real application, this would make an API call to save the ad
    console.log("Ad data:", data);
    
    toast({
      title: "Ad posted successfully",
      description: "Your ad has been posted successfully.",
    });
    
    // Reset the form after successful submission
    reset();
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
