import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PointTransaction } from "@shared/schema";
import { Loader2, Wallet, ArrowUp, ArrowDown, CreditCard, FileText, History } from "lucide-react";
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
              <a href="#transactions" onClick={(e) => {
                e.preventDefault();
                document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth' });
              }} className="block">
                <div className="p-3 hover:bg-green-50 font-medium flex items-center border-l-4 border-transparent hover:border-green-500 transition-all">
                  <History className="h-4 w-4 mr-2 text-green-600" />
                  Transactions
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
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-5 mb-4">
                {settings?.paymentInfo ? (
                  <div className="payment-info whitespace-pre-wrap">
                    {settings.paymentInfo.split('\n').map((line, index) => {
                      // Check if line contains a phone number
                      if (line.includes('+')) {
                        // Extract the phone number from the line
                        const phoneNumber = line.match(/\+\d+/)?.[0];
                        if (phoneNumber) {
                          return (
                            <p key={index}>
                              {line.split(phoneNumber)[0]}
                              <a 
                                href={`https://wa.me/${phoneNumber.substring(1)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 font-bold hover:underline"
                              >
                                {phoneNumber}
                              </a>
                            </p>
                          );
                        }
                      }
                      return <p key={index}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="font-medium text-lg">₹ 1000 = 1500 points</p>
                      <p className="font-medium text-lg">₹ 2000 = 3000 points</p>
                      <p className="font-medium text-lg">₹ 5000 = 7500 points</p>
                      <p className="font-medium text-lg">₹ 10000 = 18000 points</p>
                      <p className="font-medium mt-4">Buy points in 2 easy steps</p>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold">To buy points for 1000,2000,3000 send screenshots to whatsapp</h3>
                      <p>
                        <a 
                          href="https://wa.me/447553078122" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          +447553078122
                        </a>
                      </p>
                      
                      <h3 className="text-lg font-semibold mt-6">To buy points for 5000 and 10000 send screenshots to whatsapp</h3>
                      <p>
                        <a 
                          href="https://wa.me/447818604647" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          +447818604647
                        </a>
                      </p>
                    </div>
                  </div>
                )}
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

          {/* My Listings Card */}
          <Card className="mb-6" id="my-listings-card">
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
              <CardDescription>
                Manage your posted advertisements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">
                  View, edit, and manage all your posted advertisements in one place.
                </p>
                <Button asChild className="bg-[#4ebb78] hover:bg-[#3da967]">
                  <Link href="/my-listings" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
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