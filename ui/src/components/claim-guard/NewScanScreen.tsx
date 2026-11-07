"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Shield, Sparkles, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";

interface NewScanScreenProps {
  onStartScan: (payload: {
    campaignName: string;
    adText: string;
    landingPageUrl: string;
    productCategory: "cosmetics" | "general";
    adImageName: string;
    documentNames: string[];
  }) => void;
}

export function NewScanScreen({ onStartScan }: NewScanScreenProps) {
  const [campaignName, setCampaignName] = useState("");
  const [adText, setAdText] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [productCategory, setProductCategory] = useState<"cosmetics" | "general">("cosmetics");
  const [adImageName, setAdImageName] = useState<string>("");
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLoadDemo = () => {
    setCampaignName("HydraGlow Botanical Serum – Autumn Promo");
    setAdText(
      "100% eco-friendly packaging and formula! Clinically proven 48h continuous hydration protection. Zero carbon footprint – 100% climate neutral skincare. Flash Sale: Get 50% OFF everything today + Free express delivery on all orders, no minimum spend! Hurry, only 2 items left in stock!"
    );
    // Demo landing page served by this app (public/demo-site), so the demo scan works offline.
    setLandingPageUrl(`${window.location.origin}/demo-site/flawed-shop/index.html`);
    setProductCategory("cosmetics");
    setAdImageName("hydraglow-instagram-ad.png");
    setDocumentNames(["eco-serum-spec.pdf", "hydration-study-2026.pdf"]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !adText.trim() || !landingPageUrl.trim()) {
      setError("Please fill in the campaign name, ad copy, and a valid landing page URL.");
      return;
    }
    try {
      new URL(landingPageUrl);
    } catch {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setError(null);
    onStartScan({
      campaignName,
      adText,
      landingPageUrl,
      productCategory,
      adImageName: adImageName || "uploaded-ad-creative.png",
      documentNames: documentNames.length ? documentNames : ["product-technical-dossier.pdf"],
    });
  };

  return (
    <Card className="bg-card border-border text-foreground max-w-3xl mx-auto shadow-xl">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Badge className="bg-accent text-beam-fg border-beam/40 mb-2">
              AI Marketing Red Team
            </Badge>
            <CardTitle className="text-xl text-foreground">Launch New Campaign Audit</CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-1">
              Cross-examine your ad claims, landing page, and product evidence against EU Directive 2024/825 & UX risks.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            className="bg-background border-beam/40 text-beam-fg hover:bg-accent text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Prefill Demo Campaign
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-sev-critical-bg border border-sev-critical/40 text-sev-critical-fg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Campaign Name *</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., HydraGlow Serum Q4 Launch"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Product Category *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductCategory("cosmetics")}
                  className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                    productCategory === "cosmetics"
                      ? "bg-accent border-beam/40 text-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  Cosmetics
                </button>
                <button
                  type="button"
                  onClick={() => setProductCategory("general")}
                  className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                    productCategory === "general"
                      ? "bg-accent border-beam/40 text-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  General
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Ad Copy / Promotional Text *</label>
            <Textarea
              rows={4}
              value={adText}
              onChange={(e) => setAdText(e.target.value)}
              placeholder="Paste the headline, primary text, and promotional claims from your ad..."
              className="bg-background border-border text-foreground text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Target Landing Page URL *</label>
            <Input
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
              placeholder="https://yourbrand.com/landing-page"
              className="bg-background border-border text-foreground font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ad Creative Upload */}
            <div className="p-4 rounded-xl bg-background border border-dashed border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-beam-fg" /> Ad Image Creative
                </span>
                <Badge variant="outline" className="text-[10px] border-border-strong text-muted-foreground">
                  PNG / JPG / WebP
                </Badge>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAdImageName(file.name);
                }}
                className="bg-card border-border text-xs text-muted-foreground cursor-pointer"
              />
              {adImageName && (
                <p className="text-[11px] text-ok-fg font-mono truncate">
                  Selected: {adImageName}
                </p>
              )}
            </div>

            {/* Product Evidence PDFs Upload */}
            <div className="p-4 rounded-xl bg-background border border-dashed border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-beam-fg" /> Product Substantiation Docs
                </span>
                <Badge variant="outline" className="text-[10px] border-border-strong text-muted-foreground">
                  PDF Dossiers
                </Badge>
              </div>
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).map((f) => f.name);
                  if (files.length) setDocumentNames(files);
                }}
                className="bg-card border-border text-xs text-muted-foreground cursor-pointer"
              />
              {documentNames.length > 0 && (
                <p className="text-[11px] text-ok-fg font-mono truncate">
                  Loaded ({documentNames.length}): {documentNames.join(", ")}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary text-primary-foreground font-semibold py-5"
          >
            <Shield className="w-4 h-4 mr-2" /> Run Red Team Campaign Audit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}