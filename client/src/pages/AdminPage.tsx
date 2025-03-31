import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Ad, PageContent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Trash2, Shield, ShieldAlert, Settings, FileText, Save, Wallet, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [siteName, setSiteName] = useState("ClassiSpot");
  const [footerText, setFooterText] = useState("© 2025 ClassiSpot - Post Free Classifieds Ads. All Rights Reserved.");
  const [selectedPage, setSelectedPage] = useState("about");
  const [pageContent, setPageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });

  const { data: ads = [], isLoading: adsLoading } = useQuery<Ad[]>({
    queryKey: ["/api/admin/ads"],
    enabled: activeTab === "ads",
  });

  // Site settings query
  const { data: settings, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    enabled: activeTab === "settings",
  });
  
  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    return users.filter((user: User) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const mobile = user.mobileNumber?.toLowerCase() || '';
      
      return (
        user.username.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        mobile.includes(query)
      );
    });
  }, [users, searchQuery]);

  // Update siteName and footerText whenever settings are updated
  useEffect(() => {
    if (settings) {
      if (settings.siteName) {
        setSiteName(settings.siteName);
      }
      if (settings.footerText) {
        setFooterText(settings.footerText);
      }
    }
  }, [settings]);

  // Page content query
  const { data: contentData, isLoading: contentLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content", selectedPage],
    enabled: activeTab === "content" && selectedPage !== "",
  });
  
  // Update pageContent whenever contentData is updated
  useEffect(() => {
    if (contentData?.content) {
      setPageContent(contentData.content);
    }
  }, [contentData]);

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/make-admin`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User has been made an admin",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const [pointsAmount, setPointsAmount] = useState<{ [userId: number]: number }>({});
  
  const updateUserPointsMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: number; points: number }) => {
      console.log("Updating points", { userId, points });
      try {
        const res = await apiRequest("POST", `/api/admin/users/${userId}/points`, { points });
        console.log("API response:", res);
        const data = await res.json();
        console.log("Response data:", data);
        return data;
      } catch (err) {
        console.error("Error in points mutation:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Points updated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User points have been updated",
      });
    },
    onError: (error: Error) => {
      console.error("Points update failed:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      const res = await apiRequest("POST", `/api/admin/ads/${adId}/verify`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({
        title: "Success",
        description: "Ad has been verified",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAdActiveMutation = useMutation({
    mutationFn: async ({ adId, isActive }: { adId: number; isActive: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/ads/${adId}/toggle-active`, {
        isActive,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({
        title: "Success",
        description: "Ad status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      await apiRequest("DELETE", `/api/ads/${adId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({
        title: "Success",
        description: "Ad has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update site name mutation
  const updateSiteNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await apiRequest("POST", "/api/admin/site-settings", {
        key: "siteName",
        value: newName
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Success",
        description: "Site name has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update footer text mutation
  const updateFooterTextMutation = useMutation({
    mutationFn: async (newText: string) => {
      const res = await apiRequest("POST", "/api/admin/site-settings", {
        key: "footerText",
        value: newText
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Success",
        description: "Footer text has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update page content mutation
  const updatePageContentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/admin/page-content/${selectedPage}`, {
        content
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/page-content", selectedPage] });
      toast({
        title: "Success",
        description: `${selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)} page content has been updated`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users and ads</p>
      </div>

      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="settings">Site Settings</TabsTrigger>
          <TabsTrigger value="content">Page Content</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Input
                className="max-w-sm"
                placeholder="Search by email, name, or mobile number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {usersLoading ? (
            <div className="flex justify-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableCaption>List of all users in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email / Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Admin Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found matching "{searchQuery}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium text-primary">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>{user.mobileNumber || "N/A"}</TableCell>
                      <TableCell className="flex items-center">
                        <div className="flex items-center">
                          <Wallet className="h-4 w-4 mr-1 text-primary" />
                          <span className="font-medium">{user.points || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-green-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!user.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center"
                              onClick={() => makeAdminMutation.mutate(user.id)}
                              disabled={makeAdminMutation.isPending}
                            >
                              <ShieldAlert className="w-4 h-4 mr-1" />
                              Make Admin
                            </Button>
                          )}
                          
                          <div className="flex items-center bg-slate-100 rounded-md pl-2">
                            <Input
                              className="w-16 h-8 text-sm border-0 bg-transparent"
                              type="number"
                              placeholder="0"
                              value={pointsAmount[user.id] || ""}
                              onChange={(e) => setPointsAmount({
                                ...pointsAmount,
                                [user.id]: parseInt(e.target.value) || 0
                              })}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-green-600"
                              onClick={() => {
                                if (pointsAmount[user.id]) {
                                  updateUserPointsMutation.mutate({
                                    userId: user.id,
                                    points: Math.abs(pointsAmount[user.id])
                                  });
                                  setPointsAmount({...pointsAmount, [user.id]: 0});
                                }
                              }}
                              disabled={updateUserPointsMutation.isPending || !pointsAmount[user.id]}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-600"
                              onClick={() => {
                                if (pointsAmount[user.id]) {
                                  updateUserPointsMutation.mutate({
                                    userId: user.id,
                                    points: -Math.abs(pointsAmount[user.id])
                                  });
                                  setPointsAmount({...pointsAmount, [user.id]: 0});
                                }
                              }}
                              disabled={updateUserPointsMutation.isPending || !pointsAmount[user.id]}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="ads" className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Ad Management</h2>
          {adsLoading ? (
            <div className="flex justify-center py-8">Loading ads...</div>
          ) : (
            <Table>
              <TableCaption>List of all ads in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>{ad.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ad.title}</TableCell>
                    <TableCell>{ad.location}</TableCell>
                    <TableCell>
                      {ad.isVerified ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ad.isActive || false}
                        onCheckedChange={(checked) =>
                          toggleAdActiveMutation.mutate({
                            adId: ad.id,
                            isActive: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="space-x-2">
                      {!ad.isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-600"
                          onClick={() => verifyAdMutation.mutate(ad.id)}
                          disabled={verifyAdMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-50 text-red-600"
                        onClick={() => deleteAdMutation.mutate(ad.id)}
                        disabled={deleteAdMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
          {settingsLoading ? (
            <div className="flex justify-center py-8">Loading settings...</div>
          ) : (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Website Configuration
                </CardTitle>
                <CardDescription>
                  Change the website name and other global settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="siteName" className="text-sm font-medium">
                      Site Name
                    </label>
                    <Input
                      id="siteName"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Enter site name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="footerText" className="text-sm font-medium">
                      Footer Text
                    </label>
                    <Input
                      id="footerText"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Enter footer text"
                    />
                    <p className="text-xs text-gray-500">
                      Use {"{year}"} to include the current year. Example: © {"{year}"} {siteName} - All Rights Reserved.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button 
                  onClick={() => updateSiteNameMutation.mutate(siteName)}
                  disabled={updateSiteNameMutation.isPending || (settings?.siteName === siteName)}
                  className="w-full"
                >
                  {updateSiteNameMutation.isPending ? (
                    "Saving Site Name..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Site Name
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => updateFooterTextMutation.mutate(footerText)}
                  disabled={updateFooterTextMutation.isPending || (settings?.footerText === footerText)}
                  className="w-full"
                >
                  {updateFooterTextMutation.isPending ? (
                    "Saving Footer Text..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Footer Text
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="content" className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Page Content Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Pages
                  </CardTitle>
                  <CardDescription>
                    Select a page to edit its content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['about', 'contact', 'terms', 'privacy', 'sitemap'].map((page) => (
                      <Button
                        key={page}
                        variant={selectedPage === page ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedPage(page)}
                      >
                        {page.charAt(0).toUpperCase() + page.slice(1)} Page
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Editing: {selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)} Page
                  </CardTitle>
                  <CardDescription>
                    Update the content shown on this page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="flex justify-center py-8">Loading content...</div>
                  ) : (
                    <Textarea
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      placeholder="Enter page content"
                      className="min-h-[300px]"
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => updatePageContentMutation.mutate(pageContent)}
                    disabled={updatePageContentMutation.isPending || (contentData?.content === pageContent)}
                    className="w-full"
                  >
                    {updatePageContentMutation.isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Content
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}