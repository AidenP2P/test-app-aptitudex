import { ExternalLink, Zap, Users, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const About = () => {
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
                AptitudeX Demo
              </h1>
              <p className="text-white/90 text-sm leading-relaxed">
                This application is an example of what you can configure and adapt for your organization with AptitudeX.
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

        {/* Technical Details */}
        <div className="mb-8">
          <Card className="bg-background-accent border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Technical Stack
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Blockchain</p>
                  <p className="text-foreground font-medium">Base Network</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Framework</p>
                  <p className="text-foreground font-medium">OnchainKit</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Gas Experience</p>
                  <p className="text-foreground font-medium">Gas-free via Paymaster</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Identity</p>
                  <p className="text-foreground font-medium">Basenames Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
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