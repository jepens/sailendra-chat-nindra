
import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const { toast } = useToast();
  
  // API Settings
  const [whatsappToken, setWhatsappToken] = useState("MOCK_WA_TOKEN_123456");
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  
  // Webhook Settings
  const [webhookUrl, setWebhookUrl] = useState("https://example.com/webhook/send-message");
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  
  // Admin Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const handleSaveToken = () => {
    if (!whatsappToken) {
      toast({
        title: "Error",
        description: "WhatsApp token cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsTokenLoading(true);
    
    // TODO: Replace with actual API call to update token
    setTimeout(() => {
      toast({
        title: "Success",
        description: "WhatsApp API token updated successfully",
      });
      setIsTokenLoading(false);
    }, 1000);
  };
  
  const handleSaveWebhook = () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Webhook URL cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsWebhookLoading(true);
    
    // TODO: Replace with actual API call to update webhook URL
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Webhook URL updated successfully",
      });
      setIsWebhookLoading(false);
    }, 1000);
  };
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsPasswordLoading(true);
    
    // TODO: Replace with actual API call to change password
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setIsPasswordLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="api" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="api">WhatsApp API</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp API Configuration</CardTitle>
                <CardDescription>
                  Manage your WhatsApp API credentials for the chatbot system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wa-token">WhatsApp API Token</Label>
                  <div className="flex">
                    <Input
                      id="wa-token"
                      type={isTokenVisible ? "text" : "password"}
                      value={whatsappToken}
                      onChange={(e) => setWhatsappToken(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTokenVisible(!isTokenVisible)}
                      className="ml-2"
                    >
                      {isTokenVisible ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    The WhatsApp API token is used to authenticate requests to the WhatsApp Business API. 
                    Keep this token secure and never share it publicly.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveToken} disabled={isTokenLoading}>
                  {isTokenLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="webhook">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Configure the webhook URL for sending WhatsApp messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">n8n Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    This webhook URL will be called when sending messages from the chatbot system.
                    Make sure your n8n workflow is configured to receive requests at this URL.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveWebhook} disabled={isWebhookLoading}>
                  {isWebhookLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your administrator account credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleChangePassword} disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
