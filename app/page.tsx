"use client";

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';

// Dynamically import PictoChat with no SSR
const PictoChat = dynamic(
  () => import('@/components/PictoChat'),
  { ssr: false }
);

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const { toast } = useToast();

  // Example contract address - replace with your actual contract
  const contractAddress = "0x742d35Cc6634C0532925a3b8D444431f3c4a8E68";

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Contract address functions
  const copyContractAddress = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setContractCopied(true);
      setTimeout(() => setContractCopied(false), 2000);
      
      toast({
        title: "Contract copied!",
        description: "Address copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const openEtherscan = () => {
    window.open(`https://etherscan.io/address/${contractAddress}`, '_blank');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen relative">
        {/* Loading Background */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: 'url(/shiddy_red.png)',
            backgroundSize: '400px',
            backgroundRepeat: 'repeat',
            filter: 'blur(4px)',
          }}
        />

        {/* Loading Content */}
        <div className="h-screen flex flex-col items-center justify-center">
          <div className="text-center">
            {/* Shiddy GIF */}
            <img 
              src="/shiddy.gif" 
              alt="Shiddy Loading" 
              className="w-32 h-32 mx-auto mb-6 drop-shadow-lg animate-bounce"
            />
            
            {/* Loading Text */}
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
              Loading Shiddy's World...
            </h2>
            
            {/* Loading Bar */}
            <div className="w-64 mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-full h-4 shadow-lg border border-white/30">
                <div className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 h-full rounded-full animate-pulse shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className="text-white/80 text-sm mt-2 animate-pulse">
                Preparing the chaos...
              </p>
            </div>
          </div>
        </div>

        {/* Loading Animation Styles */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Simple Scaled Background with Blur */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: 'url(/shiddy_red.png)',
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
          filter: 'blur(4px)',
        }}
      />

      {/* PNG Rain Effect */}
      <div className="absolute inset-0 -z-5 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animation: `fall ${Math.random() * 4 + 6}s linear infinite`,
            }}
          >
            <img
              src="/shiddy-png.png"
              alt=""
              className="opacity-100"
              style={{
                width: `${Math.random() * 60 + 50}px`,
                height: `${Math.random() * 60 + 50}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>



      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
          }
        }
        

      `}</style>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-start pt-6 px-4 sm:px-8 space-y-2">
        {/* Header */}
        <div className="text-center">
          <img 
            src="/shiddy.gif" 
            alt="Shiddy" 
            className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2"
          />
          <div 
            className="mx-auto mb-2 drop-shadow-lg overflow-hidden rounded-lg"
            style={{
              width: '180px',
              height: '60px',
              position: 'relative'
            }}
          >
            <img 
              src="http://www.gigaglitters.com/created/WUPWtzaPll.gif" 
              alt="Shiddy Title" 
              style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '226px',
                height: '93px',
                transform: 'scale(0.8)'
              }}
            />
          </div>
        </div>

        {/* Contract & Social Side by Side */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 w-full max-w-4xl px-2">
          {/* Contract Widget */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl px-3 py-2 sm:px-6 sm:py-3 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-xs sm:text-sm text-white/80 font-medium">Contract:</div>
              <div className="font-mono text-xs sm:text-sm text-white bg-black/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2 break-all text-center">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyContractAddress}
                  className="bg-white/20 hover:bg-white/30 p-2 sm:p-2.5 rounded-lg text-white transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Copy Address"
                >
                  {contractCopied ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                </button>
                <button
                  onClick={openEtherscan}
                  className="bg-white/20 hover:bg-white/30 p-2 sm:p-2.5 rounded-lg text-white transition-all duration-200 hover:scale-110 active:scale-95"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="flex space-x-3">
            <a 
              href="https://t.me/+n71nvnK7Ctw1M2Ux" 
              target="_blank" 
              rel="noopener noreferrer"
              className="backdrop-blur-sm bg-white/10 border border-white/20 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-white/20"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 9.728-.896 9.728-.694 4.15-2.613 4.91-5.432 3.65l-3.06-2.68-1.502-1.432-2.581-1.03c-.613-.25-.634-.611.138-.931l17.118-6.336c.535-.214.988.04.715 1.03h.002z"/>
              </svg>
            </a>
            <a 
              href="https://x.com/ShiddyAbstract" 
              target="_blank" 
              rel="noopener noreferrer"
              className="backdrop-blur-sm bg-white/10 border border-white/20 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-white/20"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* MAIN FOCAL POINT - Enhanced PictoChat */}
        <div className="relative flex justify-center">
          <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-60"></div>
          <PictoChat roomName="Global Shiddy Board" userName="Anon" />
        </div>
      </div>
    </div>
  );
}