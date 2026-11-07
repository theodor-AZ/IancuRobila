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
    setLandingPageUrl("https://demo-glowbotanics.ro/promo");
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
    <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl mx-auto shadow-xl">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 mb-2">
              AI Marketing Red Team
            </Badge>
            <CardTitle className="text-xl text-white">Launch New Campaign Audit</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Cross-examine your ad claims, landing page, and product evidence against EU Directive 2024/825 & UX risks.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            className="bg-slate-950 border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/50 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Prefill Demo Campaign
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Campaign Name *</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., HydraGlow Serum Q4 Launch"
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Product Category *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductCategory("cosmetics")}
                  className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                    productCategory === "cosmetics"
                      ? "bg-indigo-600/25 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Cosmetics
                </button>
                <button
                  type="button"
                  onClick={() => setProductCategory("general")}
                  className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                    productCategory === "general"
                      ? "bg-indigo-600/25 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  General
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Ad Copy / Promotional Text *</label>
            <Textarea
              rows={4}
              value={adText}
              onChange={(e) => setAdText(e.target.value)}
              placeholder="Paste the headline, primary text, and promotional claims from your ad..."
              className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target Landing Page URL *</label>
            <Input
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
              placeholder="https://yourbrand.com/landing-page"
              className="bg-slate-950 border-slate-800 text-slate-100 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ad Creative Upload */}
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-pink-400" /> Ad Image Creative
                </span>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
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
                className="bg-slate-900 border-slate-800 text-xs text-slate-300 cursor-pointer"
              />
              {adImageName && (
                <p className="text-[11px] text-emerald-400 font-mono truncate">
                  Selected: {adImageName}
                </p>
              )}
            </div>

            {/* Product Evidence PDFs Upload */}
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Product Substantiation Docs
                </span>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
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
                className="bg-slate-900 border-slate-800 text-xs text-slate-300 cursor-pointer"
              />
              {documentNames.length > 0 && (
                <p className="text-[11px] text-emerald-400 font-mono truncate">
                  Loaded ({documentNames.length}): {documentNames.join(", ")}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-5"
          >
            <Shield className="w-4 h-4 mr-2" /> Run Red Team Campaign Audit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}