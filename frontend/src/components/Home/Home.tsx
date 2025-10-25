/* ++++++++++ IMPORTS ++++++++++ */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ++++++++++ SLIDER ++++++++++ */
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/* ++++++++++ SUBSCRIPTION ++++++++++ */
import useAuth from '../../authorization/useAuth';
import { SubscriptionCheckout } from '../Stripe/SubscriptionCheckout';

/* ++++++++++ ICONS ++++++++++ */
import { IconType } from 'react-icons';
import { FaStopwatch, FaCalculator, FaDollarSign, FaFootballBall, FaFilter, FaSearch } from "react-icons/fa";
import { ArrowRight } from 'lucide-react';

/* ++++++++++ GSAP ++++++++++ */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sportsbooks = [
  'draftkings',
  'caesars',
  'betus',
  'fanduel',
  'mybookie',
  'betrivers',
  'betmgm',
  'betonline',
  'lowvig',
  'bovada',
  'ballybet',
  'betanysports',
  'betparx',
  'espnbet',
  'fliff',
  'hardrock',
  'windcreek',
  'prizepicks'
];

const Home = () => {
  // 
  const { user } = useAuth();

  // Reference for features section
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (featuresRef.current) {
      const cards = featuresRef.current.children;

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 100
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  {/* Slider settings */}
  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    speed: 3500,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: false,
    pauseOnFocus: false,
    draggable: false,
    swipe: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2
        }
      }
    ]
  };

  const LoggedOutView = () => (
    <>
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-evenly">
    {/* Hero Section */}
    <section className="py-20 px-4 bg-[url('/3d-gradient.jpg')] bg-cover bg-center w-[70%] rounded-b-xl">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 text-white">
          Find Your Edge with Oddsly
        </h1>
        <p className="text-xl text-white mb-8">
          Compare odds across major sportsbooks and discover value bets using advanced analytics
        </p>

        {!user ? (
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-neon rounded-lg hover:bg-opacity-90 transition-all"
          >
            Get Started <ArrowRight className="ml-2" size={20} />
          </Link>
        ) : (
          <SubscriptionCheckout 
            onError={(error) => console.error(error)} 
          />
        )}
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-16 px-4 bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Powerful Features for Smart Betting
        </h2>
        <div ref={featuresRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={FaStopwatch}
            title="Real-Time Odds Comparison"
            description="Compare odds from major sportsbooks including DraftKings, FanDuel, BetMGM, and more in real-time"
          />
          <FeatureCard
            icon={FaCalculator}
            title="Kelly Criterion Calculator"
            description="Optimize your bet sizing with built-in Kelly Criterion calculations based on your bankroll"
          />
          <FeatureCard
            icon={FaDollarSign}
            title="Value Bet Detection"
            description="Automatically identify positive expected value opportunities across all markets"
          />
          <FeatureCard
            icon={FaFootballBall}
            title="Multiple Sports Coverage"
            description="Access odds for NFL, NBA, MLB, NHL, MMA, Tennis, and major soccer leagues"
          />
          <FeatureCard
            icon={FaFilter}
            title="Advanced Filters"
            description="Filter by market type, bookmaker, minimum EV percentage, and more"
          />
          <FeatureCard
            icon={FaSearch}
            title="Detailed Match Analysis"
            description="Deep dive into individual matches with comprehensive odds movement tracking"
          />
        </div>
      </div>
    </section>

    {/* Sportsbooks Slider Section */}
    <section className="w-full py-16 bg-secondary">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Supported Sportsbooks
        </h2>
        <Slider {...settings} className="sportsbooks-slider">
          {sportsbooks.map((book) => (
            <div key={book} className="px-4">
              <img
                src={`/sportsbooks/${book}.svg`}
                alt={book}
                className="h-12 w-auto mx-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const currentSrc = target.src;

                  if (currentSrc.endsWith('.svg')) {
                    target.src = `/sportsbooks/${book}.png`;
                  } else if (currentSrc.endsWith('.png')) {
                    target.src = `/sportsbooks/${book}.jpg`;
                  } else if (currentSrc.endsWith('.jpg')) {
                    target.src = `/sportsbooks/${book}.webp`;
                  } else {
                    console.error(`Failed to load image for ${book} in any format`);
                  }
                }}
              />
            </div>
          ))}
        </Slider>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-20 px-4 bg-secondary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-white">
          Ready to Make Smarter Bets?
        </h2>
        <p className="text-xl text-white mb-8">
          Join Oddsly today and gain access to professional-grade betting tools and analytics
        </p>
        <Link
          to="/login"
          className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-neon rounded-lg hover:bg-opacity-90 transition-all"
        >
          Sign up <ArrowRight className="ml-2" size={20} />
        </Link>
      </div>
    </section>
  </div>
  </>
  );

  const LoggedInView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-secondary rounded-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
          <SubscriptionCheckout onError={(error) => console.error(error)} />
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/odds" className="block px-4 py-2 bg-neon text-white rounded hover:bg-opacity-90 text-center">
                View Odds
              </Link>
              <Link to="/profile" className="block px-4 py-2 bg-neon text-white rounded hover:bg-opacity-90 text-center">
                Profile Settings
              </Link>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            {/* Add recent activity content */}
          </div>

          {/* Account Stats Card */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Account Stats</h2>
            {/* Add stats content */}
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-[#171717]">
      {user ? <LoggedInView /> : <LoggedOutView />}
    </div>
  );
};

/* Feature Card Component */
const FeatureCard = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: IconType;
}) => {
  return (
    <div className="p-8 bg-[#1E1B2E] rounded-xl border border-[#2D2B3C] hover:border-neon transition-all duration-300">
      <div className="mb-6 bg-gradient-to-br from-neon to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-white opacity-90" />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
};

export default Home;
