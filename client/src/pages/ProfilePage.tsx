import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PointTransaction } from "@shared/schema";
import { Loader2, Wallet, ArrowUp, ArrowDown, CreditCard, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const loadingState = transactionsLoading || settingsLoading;
  
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
              <Link href="/my-listings" className="block">
                <div className="p-3 hover:bg-green-50 font-medium flex items-center border-l-4 border-transparent hover:border-green-500 transition-all">
                  <FileText className="h-4 w-4 mr-2 text-green-600" />
                  My Listings
                </div>
              </Link>
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

          {/* My Listings Link Card */}
          <Card id="ads">
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
              <CardDescription>
                View and manage your posted advertisements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-6">
                  Visit the dedicated My Listings page to view and manage all your advertisements in one place.
                </p>
                <Button asChild>
                  <Link href="/my-listings">
                    <FileText className="h-4 w-4 mr-1" />
                    Go to My Listings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}