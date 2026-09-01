"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_URL } from "@/lib/api";

type Status = "idle" | "loading" | "ok" | "error";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Not checked yet");

  async function pingApi() {
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: { message: string } = await response.json();
      setStatus("ok");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("Could not reach the Express API. Is it running on port 4000?");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Express API</CardTitle>
          <Badge
            variant={
              status === "ok"
                ? "default"
                : status === "error"
                  ? "destructive"
                  : "secondary"
            }
          >
            {status}
          </Badge>
        </div>
        <CardDescription>
          Frontend talks to the backend at{" "}
          <code className="font-mono text-foreground">{API_URL}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={pingApi} disabled={status === "loading"}>
          {status === "loading" ? "Checking..." : "Ping API"}
        </Button>
      </CardFooter>
    </Card>
  );
}
