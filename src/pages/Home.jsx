// File: src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-image.JPG';

// Import gallery images (add as many as you have)
import gallery1 from '../assets/gallery-1.JPG';
import gallery2 from '../assets/gallery-2.JPG';
import gallery3 from '../assets/gallery-3.JPG';
import gallery4 from '../assets/gallery-4.JPG';
import gallery5 from '../assets/gallery-5.JPG';
import gallery6 from '../assets/gallery-6.JPG';
import gallery7 from '../assets/gallery-7.JPG';
import gallery8 from '../assets/gallery-8.JPG';

function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Gallery images array – add/remove as needed
  const galleryImages = [
    { src: gallery1, alt: 'Community event 1' },
    { src: gallery2, alt: 'Tree planting activity' },
    { src: gallery3, alt: 'Youth workshop' },
    { src: gallery4, alt: 'Healthcare camp' },
    { src: gallery5, alt: 'Green Futures school nursery' },
    { src: gallery6, alt: 'Community gathering' },
    { src: gallery7, alt: 'Group photo' },
    { src: gallery8, alt: 'Pad giveaway' },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-primary-600 text-black min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 to-primary-500/80"></div>

        <img
          src={heroImage}
          alt="Community Development Hero Background"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'blur-0 scale-100' : 'blur-lg scale-105'
          }`}
        />

        <div className="relative container mx-auto px-4 text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
              Welcome to <span className="text-white font-extrabold">UYIH</span>
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto leading-relaxed text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-medium">
              Empowering communities through innovation and collaboration.
              Umoja Youth Impact Hub (UYIH) is a dynamic community-based
              organization founded in 2024 by a coalition of young
              professionals, dedicated to transforming underserved communities
              in Narok County through sustainable development initiatives,
              healthcare access, and environmental stewardship. Our flagship
              Green Futures Initiative empowers school communities through tree
              propagation and sustainable income generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/programs"
                className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Explore Programs
              </Link>

              <Link
                to="/about"
                className="border-2 border-black text-black px-8 py-4 rounded-lg hover:bg-black hover:text-white transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-to-br from-neutral-100 to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2">
              <h2 className="text-3xl font-bold text-primary-600 mb-4 text-center">Our Mission</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                To empower residents of underserved communities by providing access to healthcare, environmental
                solutions, and economic opportunities, thereby enhancing quality of life and promoting sustainable
                development.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2">
              <h2 className="text-3xl font-bold text-primary-600 mb-4 text-center">Our Vision</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                To foster healthier, more educated, and environmentally sustainable communities through integrated
                youth-led initiatives that create lasting positive change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === Gallery Section (Carousel) === */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-600 text-center mb-10">
            Moments of Impact
          </h2>

          {/* Carousel container */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll gap-6 px-4">
              {/* Duplicate the images for seamless infinite scroll */}
              {[...galleryImages, ...galleryImages].map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-80 md:w-96 h-64 md:h-80 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
