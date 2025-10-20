import { useState } from 'react';
import { ExternalLink, Zap, Users, Shield, Vote, Trophy } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const About = () => {
  const [imageError, setImageError] = useState(false);
  
  const handleVisitWebsite = () => {
    window.open('https://aptitudex.app/', '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Header title="About AptitudeX" subtitle="Turn team recognition into on-chain rewards" />
      
      <div className="px-6 pb-24">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-primary rounded-xl p-6 mb-6 shadow-glow">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-3">
                AptitudeX Alpha version
              </h1>
              <p className="text-white/90 text-sm leading-relaxed">
                This application is the first iteration of what you can configure and adapt for your organization with AptitudeX.
              </p>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <Button
              onClick={handleVisitWebsite}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
            >
              Visit aptitudex.app
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Vote Banner */}
          <div className="mb-8">
            <Card className="bg-gradient-subtle border-primary/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Base Batches 002: Builder Track</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    We're competing in Base Batches 002! Your vote helps us build the future of on-chain recognition.
                  </p>
                  <Button
                    onClick={() => window.open('https://devfolio.co/projects/kudos-protocol-d7e4', '_blank', 'noopener,noreferrer')}
                    className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Vote className="w-4 h-4" />
                    Vote for us
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Description */}
        <div className="mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What is AptitudeX?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AptitudeX turns team recognition into on-chain rewards.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It helps startups and organizations boost engagement by automating how tokens are distributed for achievements, challenges, or peer kudos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Who am I Section */}
        <div className="mb-8">
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Who am I?
              </h2>
              
              {/* Profile Section */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
                  {!imageError ? (
                    <img
                      src="https://pbs.twimg.com/profile_images/1967679647635623936/Rx0V84lS_400x400.jpg"
                      alt="Aiden P2P"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                      AP
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">Aiden P2P</h3>
                    <Button
                      onClick={() => window.open('https://x.com/0xAidenP2P', '_blank', 'noopener,noreferrer')}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs bg-card hover:bg-muted border-border flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      @0xAidenP2P
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    CTO & entrepreneur — building the next wave of on-chain engagement tools on Base.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Founder of AptitudeX (Base Batches 002) — turning recognition into ownership.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    10+ years delivering enterprise innovation (50+ projects) in banking, insurance, mobility & telecom.
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Focused on Web3, AI, incentives and org transformation.
                  </p>
                </div>
              </div>

              {/* Why I build this */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Why I build this
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Because most "engagement" tools are just dashboards — no ownership, no transparency, no memory.
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  On-chain incentives fix 3 things traditional HR can't:
                </p>
                <div className="space-y-2 ml-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Proof {'>'} trust</span> — recognition is verifiable, not invisible
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Ownership {'>'} vanity points</span> — rewards are transferable and programmable
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Fairness at scale</span> — same rules for everyone, enforced by code
                  </p>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Base gives the perfect playground to prove that.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Custom Incentive Tokens</h4>
                    <p className="text-sm text-muted-foreground">
                      Think of it as Pump.fun for organizations — but instead of spinning speculative coins, companies spin up a custom incentive token with predefined logic for claims, streaks, milestones, and allowances.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Team Recognition</h4>
                    <p className="text-sm text-muted-foreground">
                      It makes recognition transparent, programmable, and instant — bringing the fairness and true ownership of Web3 to workplace motivation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Built on Base</h4>
                    <p className="text-sm text-muted-foreground">
                      Built on Base with a top-tier UX, AptitudeX leverages the newest OnchainKit features, supports Basenames, and enables gas-free usage via Paymaster.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-subtle border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Ready to Transform Your Organization?
              </h3>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                Discover how AptitudeX can help your team embrace transparent, on-chain recognition and rewards.
              </p>
              <Button 
                onClick={handleVisitWebsite}
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-lg flex items-center gap-2 mx-auto"
              >
                Learn More
                <ExternalLink className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default About;