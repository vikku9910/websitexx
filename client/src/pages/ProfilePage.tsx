import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Ad, PointTransaction } from "@shared/schema";
import { Loader2, Edit, Trash, Wallet, ArrowUp, ArrowDown, CreditCard, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Handle hash navigation on page load
  useEffect(() => {
    // Wait a moment for the page to render before scrolling
    setTimeout(() => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  }, [location]);
  
  const { data: myAds, isLoading: adsLoading } = useQuery<Ad[]>({
    queryKey: ["/api/my-ads"],
    enabled: !!user,
  });
  
  const { data: transactions, isLoading: transactionsLoading } = useQuery<PointTransaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: !!user,
  });
  
  // Get site settings for payment info
  const { data: settings, isLoading: settingsLoading } = useQuery<{
    siteName: string;
    footerText: string;
    paymentInfo: string;
  }>({
    queryKey: ["/api/site-settings"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (adId: number) => {
      await apiRequest("DELETE", `/api/ads/${adId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-ads"] });
      toast({
        title: "Ad deleted",
        description: "Your ad has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete ad",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (adId: number) => {
    if (confirm("Are you sure you want to delete this ad?")) {
      deleteMutation.mutate(adId);
    }
  };

  const loadingState = adsLoading || transactionsLoading || settingsLoading;
  
  if (loadingState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <a href="#account" onClick={(e) => {
                e.preventDefault();
                document.getElementById('account')?.scrollIntoView({ behavior: 'smooth' });
              }} className="block">
                <div className="p-3 hover:bg-green-50 font-medium flex items-center border-l-4 border-transparent hover:border-green-500 transition-all">
                  <Wallet className="h-4 w-4 mr-2 text-green-600" />
                  Account
                </div>
              </a>
              <a href="#buy-points" onClick={(e) => {
                e.preventDefault();
                document.getElementById('buy-points')?.scrollIntoView({ behavior: 'smooth' });
              }} className="block">
                <div className="p-3 hover:bg-green-50 font-medium flex items-center border-l-4 border-transparent hover:border-green-500 transition-all">
                  <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                  Buy Points
                </div>
              </a>
              <a href="#ads" onClick={(e) => {
                e.preventDefault();
                document.getElementById('ads')?.scrollIntoView({ behavior: 'smooth' });
              }} className="block">
                <div className="p-3 hover:bg-green-50 font-medium flex items-center border-l-4 border-transparent hover:border-green-500 transition-all">
                  <FileText className="h-4 w-4 mr-2 text-green-600" />
                  My Listings
                </div>
              </a>
            </CardContent>
          </Card>
          
          {/* Account Balance Card */}
          <Card className="mt-4" id="account">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-2xl font-semibold">{user?.points || 0}</span>
                </div>
                <Badge variant="outline">Points</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Buy Points */}
          <Card className="mb-6" id="buy-points">
            <CardHeader>
              <CardTitle>Buy Points with Paytm / PhonePe, UPI</CardTitle>
              <CardDescription>
                Add points to your account with convenient payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-5 mb-4">
                <div className="space-y-3">
                  <p className="font-medium text-lg">₹ 1000 = 1500 points</p>
                  <p className="font-medium text-lg">₹ 2000 = 3000 points</p>
                  <p className="font-medium text-lg">₹ 5000 = 7500 points</p>
                  <p className="font-medium text-lg">₹ 10000 = 18000 points</p>
                  <p className="font-medium mt-4">Buy points in 2 easy steps</p>
                </div>
                
                <div className="mt-8 space-y-4">
                  {settings?.paymentInfo ? (
                    <div className="payment-info whitespace-pre-wrap">
                      {settings.paymentInfo}
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">To buy points for 1000,2000,3000 send screenshots to whatsapp</h3>
                      <p className="text-blue-600 font-bold">+447553078122</p>
                      
                      <h3 className="text-lg font-semibold mt-6">To buy points for 5000 and 10000 send screenshots to whatsapp</h3>
                      <p className="text-blue-600 font-bold">+447818604647</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Transactions */}
          <Card className="mb-6" id="transactions">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your account activity and point balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            {transaction.type === 'credit' ? (
                              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right font-medium">{transaction.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transaction history yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Ads */}
          <Card id="ads">
            <CardHeader>
              <CardTitle>My Ads</CardTitle>
              <CardDescription>
                Manage your posted advertisements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAds && myAds.length > 0 ? (
                <div className="space-y-4">
                  {myAds.map((ad) => (
                    <div key={ad.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-primary mb-2">
                            <Link href={`/ad/${ad.id}`} className="hover:underline">
                              {ad.title}
                            </Link>
                          </h3>
                          <p className="text-gray-500 text-sm mb-2">
                            Location: {ad.location}
                          </p>
                          <p className="text-gray-700 line-clamp-2">
                            {ad.description.substring(0, 150)}...
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            {ad.isVerified !== null && (
                              <Badge variant={ad.isVerified ? "default" : "outline"} className="mr-2">
                                {ad.isVerified ? "Verified" : "Pending Verification"}
                              </Badge>
                            )}
                            {ad.isActive !== null && (
                              <Badge variant={ad.isActive ? "default" : "destructive"}>
                                {ad.isActive ? "Active" : "Inactive"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/edit-ad/${ad.id}`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(ad.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-3 mt-2">
                          <span>Views: {ad.viewCount || 0}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>Posted: {new Date(ad.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You don't have any ads yet.</p>
                  <Button asChild>
                    <Link href="/post-ad">Post Your First Ad</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}