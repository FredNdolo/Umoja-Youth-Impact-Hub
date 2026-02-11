// File: src/pages/About.jsx
import React, { useState, useEffect } from 'react';
import storyImage from '../assets/story-image.JPG';

function About() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const teamMembers = [
    {
      name: "Fred Ndolo",
      role: "Executive Director",
      bio: "Visionary leader with extensive experience in community development and youth empowerment. Fred brings strategic leadership and a deep commitment to sustainable community transformation."
    },
    {
      name: "Joseph Ndolo",
      role: "Director of Health and Environmental Programs",
      bio: "Public health specialist and environmental advocate with expertise in community health initiatives and sustainable environmental practices."
    },
    {
      name: "Nikki Cherotich",
      role: "Director of Operations and Finance",
      bio: "Financial management expert and operations specialist with a passion for organizational efficiency."
    }
  ];

  const values = [
    { icon: "🤝", title: "Community First", description: "We believe in putting the community at the center of all our initiatives and decisions." },
    { icon: "🌱", title: "Sustainability", description: "Our programs are designed to create lasting positive change for future generations." },
    { icon: "💡", title: "Innovation", description: "We embrace creative solutions and new approaches to address community challenges." },
    { icon: "🎯", title: "Impact", description: "Every action we take is measured by its positive impact on the community." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-white">

      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About UYIH</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Transforming communities through youth-led initiatives and sustainable development
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <img
                src={storyImage}
                alt="UYIH Story"
                className="w-full rounded-xl shadow-lg"
                loading="lazy"
              />
            </div>

            <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-600 mb-6">Our Story</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Umoja Youth Impact Hub (UYIH) is a dynamic community-based organization founded in 2024 by a coalition of young professionals committed to transforming underserved communities in Narok County, Kenya.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We focus on healthcare access, environmental sustainability, and youth economic empowerment through community-led solutions and strategic partnerships.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div key={index} className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-primary-600 mb-3">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section (no images) */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center">
                <h3 className="text-xl font-bold text-primary-600 mb-2">{member.name}</h3>
                <p className="text-secondary-500 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-700 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
