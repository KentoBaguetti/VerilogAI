import { Check, ArrowLeft } from "lucide-react";

interface PricingPageProps {
  onBack: () => void;
}

export default function PricingPage({ onBack }: PricingPageProps) {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Get started with essential features",
      features: [
        "Access to basic models",
        "Limited messages per day",
        "Standard response time",
        "Community support",
        "Web interface access",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$20",
      period: "per month",
      description: "For professionals who need more power",
      features: [
        "Access to advanced models",
        "10x more messages",
        "Priority response time",
        "Early access to new features",
        "Extended conversation history",
        "Automated Testing",
        "Automated Waveform Diagrams",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      description: "Advanced capabilities for your organization",
      features: [
        "Unlimited messages",
        "Custom Local Models",
        "Dedicated support team",
        "Custom integrations",
        "SSO & advanced security",
        "Admin dashboard",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">
            Choose your plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade, downgrade, or
            cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto justify-center">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl bg-white p-8 shadow-sm border-2 transition-all hover:shadow-lg ${
                tier.highlighted
                  ? "border-amber-600 shadow-xl scale-105"
                  : "border-gray-200"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  {tier.price !== "Custom" && (
                    <span className="text-gray-500 ml-2">/ {tier.period}</span>
                  )}
                </div>
                {tier.price === "Custom" && (
                  <span className="text-gray-500">{tier.period}</span>
                )}
                <p className="text-gray-600 mt-4">{tier.description}</p>
              </div>

              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors mb-8 ${
                  tier.highlighted
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {tier.cta}
              </button>

              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-900 mb-4">
                  What's included:
                </p>
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-16 pb-16"></div>
      </div>
    </div>
  );
}
