"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationPage() {
  const [notifications, setNotifications] = useState({
    essential: true,
    tipsAndEducation: false,
    newFeatures: true,
  });

  const handleToggle = (type: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [type]: !prev[type] }));
    // NOTIFICATION SETTINGS ARE NOT IMPLEMENTED YET IN THE BACKEND
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground mt-1">
          Manage your email preferences and notification settings
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Choose what emails you get from us</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="essential" className="">
                Essential
              </Label>
              <p className="text-muted-foreground text-sm">
                Important account and security updates
              </p>
            </div>
            <Switch
              id="essential"
              checked={notifications.essential}
              onCheckedChange={() => handleToggle("essential")}
              disabled
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tipsAndEducation">Tips and Education</Label>
              <p className="text-muted-foreground text-sm">
                Learn how to get the most out of our platform
              </p>
            </div>
            <Switch
              id="tipsAndEducation"
              checked={notifications.tipsAndEducation}
              onCheckedChange={() => handleToggle("tipsAndEducation")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newFeatures">New Features</Label>
              <p className="text-muted-foreground text-sm">
                Be the first to know about new features and updates
              </p>
            </div>
            <Switch
              id="newFeatures"
              checked={notifications.newFeatures}
              onCheckedChange={() => handleToggle("newFeatures")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
