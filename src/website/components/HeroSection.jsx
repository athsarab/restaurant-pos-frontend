import { useState, useEffect } from "react";
import { 
  Star, Truck, Car , Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ✅ Import your images from public folder
const hero1 = "/hero/hero1.png";
const hero2 = "/hero/hero2.png";
const hero3 = "/hero/hero3.png";
const hero4 = "/hero/hero4.png";
const BG = "/hero/BG_2.png";
const flower = "/hero/flower.png";
const flower2 = "/hero/flower2.png";

const HeroSection = ({ onViewMenu, tableNumber, onReserveTable }) => {
  const [currentImage, setCurrentImage] = useState(0);

  // ✅ Put all hero images into array
  const images = [BG]; 

  // Background image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    onViewMenu?.();
  };

  const socials = [
    {
      image: hero1,

      link: "https://www.instagram.com/",
    },
    {
      image: hero2,
  
      link: "https://www.facebook.com/WOWRestaurant",
    },
    {
      image: hero3,
  
      link: "https://www.tiktok.com/",
    },
    {
      image: hero4,
   
      link: "#menu",
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${img})` }}
          >
            {/* Dark overlay for better text readability */}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-12 text-center text-white">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
<img
  src={flower2}
  alt="Flower"
  className="w-full max-w-[25rem] sm:max-w-[25rem] md:max-w-[25rem] h-auto object-contain mx-auto mb-4"
/>

{/* Brand */}
<div className="animate-slide-in-left space-y-2 sm:space-y-3">
  <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight mb-2">
    <span className="text-white drop-shadow-2xl">Restaurants</span>
    <br />
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-400 drop-shadow-2xl">
      By Ronan
    </span>
  </h1>

  <img
    src={flower}
    alt="Flower"
    className="w-full max-w-[25rem] sm:max-w-[25rem] md:max-w-[25rem] h-auto object-contain mx-auto mt-2"
  />

            <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-xl sm:max-w-2xl mx-auto text-center leading-relaxed font-light py-1">
              Experience the rich flavors of Hungary with our traditional dishes,
              crafted with authentic recipes passed down through generations.
            </p>
          </div>

          {/* Socials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-1 max-w-2xl mx-auto px-2 sm:px-2 animate-fade-in-up animate-delay-200">
            {socials.map((social, index) => (
              <div
                key={index}
                className="cursor-pointer"
                onClick={() => {
                  if (social.link.startsWith("#")) {
                    document
                      .getElementById(social.link.substring(1))
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.open(social.link, "_blank");
                  }
                }}
              >
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={social.image}
                    alt={social.value}
                    className="w-full h-28 sm:h-36 object-cover rounded-xl"
                  />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white truncate px-1">
                  {social.value}
                </h3>
                <p className="text-gray-400 text-[10px] sm:text-xs">{social.label}</p>
              </div>
            ))}
          </div>

          {/* Delivery Service Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-6 animate-fade-in-up animate-delay-400">
            <Button 
              onClick={() => window.open('https://www.ubereats.com', '_blank')}
              size="sm"
              className="w-full sm:w-auto bg-green-500 hover:bg-green-500 text-black border-0 px-6 sm:px-8 py-3 rounded-xl shadow-glow hover-scale transition-smooth group"
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
              Uber Eats
            </Button>
            <Button 
              onClick={() => window.open('https://www.pickme.lk', '_blank')}
              size="sm"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white border-0 px-6 sm:px-8 py-3 rounded-xl shadow-glow hover-scale transition-smooth group"
            >
              <Bike className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
              PickMe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
