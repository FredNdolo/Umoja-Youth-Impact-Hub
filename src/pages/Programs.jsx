// File: src/pages/Programs.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Programs() {
  const [activeProgram, setActiveProgram] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setRegistrationData(prev => ({ ...prev, program: program.title }));
    setShowRegistrationModal(true);
  };

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store registration in localStorage for demo
      const registrations = JSON.parse(localStorage.getItem('programRegistrations') || '[]');
      registrations.push({
        ...registrationData,
        id: Date.now(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('programRegistrations', JSON.stringify(registrations));
      
      setIsSubmitted(true);
      setRegistrationData({ name: '', email: '', phone: '', program: '', message: '' });
      
      setTimeout(() => {
        setIsSubmitted(false);
        setShowRegistrationModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const programs = [
    {
      id: 1,
      title: "Healthcare Access Initiatives",
      description: "Community medical camps reaching over 5,000 residents annually, Health education programs focused on preventive care, Mental health awareness campaigns and support services, Healthcare referral networks with major Nairobi hospitals.",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      icon: "🏥",
      stats: "5,000+ residents reached annually"
    },
    {
      id: 2,
      title: "Green Futures Initiative",
      description: "Empowering school communities through tree propagation and sustainable income generation. This flagship program combines environmental education with economic empowerment by training students and community members in tree nursery management, agroforestry, and sustainable income-generating activities. Schools establish tree nurseries that serve as learning centers while generating income through seedling sales and environmental services.",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      icon: "🌳",
      stats: "15+ schools engaged, 3,000+ trees propagated"
    },
    {
      id: 3,
      title: "Environmental Stewardship",
      description: "Urban greening initiatives with 3,000+ trees planted since 2019, School-based environmental clubs established in 15 local schools, Waste management education and recycling programs, Community clean-up drives engaging 1,000+ volunteers annually.",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      icon: "🌱",
      stats: "3,000+ trees planted"
    },
    {
      id: 4,
      title: "Youth Empowerment",
      description: "Skills development workshops benefiting 800+ youth, Environmental entrepreneurship incubation programs, Community leadership training, Green business startup support.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      icon: "👥",
      stats: "800+ youth trained"
    },
    {
      id: 5,
      title: "Community Events",
      description: "Organizing events to connect, inspire, and create positive change. We host regular community gatherings, educational workshops, and celebration events that bring people together.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      icon: "🎉",
      stats: "Monthly community events"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-white">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Programs</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Transforming communities through comprehensive initiatives in healthcare, environment, and youth empowerment
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, index) => (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onMouseEnter={() => setActiveProgram(program.id)}
                onMouseLeave={() => setActiveProgram(null)}
                onClick={() => handleProgramClick(program)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 left-4 text-4xl">{program.icon}</div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{program.title}</h3>
                    <div className="bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold inline-block">
                      {program.stats}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed">
                    {program.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary-600 font-semibold">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Green Futures Initiative Details */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🌳</div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-600 mb-4">Green Futures Initiative</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Empowering school communities through tree propagation and sustainable income generation
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-4">Program Components</h3>
                <ul className="text-gray-700 space-y-2 list-disc pl-5">
                  <li>School-based tree nursery establishment and management</li>
                  <li>Training in tree propagation techniques and agroforestry</li>
                  <li>Environmental education and climate literacy programs</li>
                  <li>Income generation through seedling sales and environmental services</li>
                  <li>Community tree planting and care initiatives</li>
                  <li>Partnership development with local nurseries and markets</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-4">Expected Outcomes</h3>
                <ul className="text-gray-700 space-y-2 list-disc pl-5">
                  <li>Increased tree cover in school compounds and surrounding communities</li>
                  <li>Enhanced environmental awareness among students and community members</li>
                  <li>Sustainable income streams for participating schools</li>
                  <li>Improved climate resilience in target communities</li>
                  <li>Youth engagement in environmental stewardship</li>
                  <li>Long-term sustainability through income-generating activities</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 p-6 bg-primary-50 rounded-lg">
              <h3 className="text-lg font-bold text-primary-600 mb-2">Program Impact</h3>
              <p className="text-gray-700">
                The Green Futures Initiative combines environmental conservation with economic empowerment, creating a sustainable model that benefits both the environment and local communities. By training students and community members in tree propagation and nursery management, we're building a generation of environmental stewards while generating income that supports continued program activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program KPIs & Outcomes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-600 mb-4">Key Performance Indicators</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              We measure what matters: reach, adoption, behavior change, and sustainability. Below are example KPIs we track quarterly with partners.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-xl shadow card-hover">
              <h3 className="text-xl font-bold text-primary-600 mb-2">Healthcare</h3>
              <ul className="text-gray-700 space-y-1 list-disc pl-5 text-sm">
                <li>Residents served per camp</li>
                <li>Referrals completed within 14 days</li>
                <li>Health literacy score improvement</li>
                <li>Preventive care adoption rates</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-xl shadow card-hover">
              <h3 className="text-xl font-bold text-primary-600 mb-2">Environment</h3>
              <ul className="text-gray-700 space-y-1 list-disc pl-5 text-sm">
                <li>Trees planted and survival rate (12m)</li>
                <li>Seedlings propagated in school nurseries</li>
                <li>Income generated from tree-related activities</li>
                <li>Tonnes of waste recovered/recycled</li>
                <li>Schools with active eco-clubs</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-xl shadow card-hover">
              <h3 className="text-xl font-bold text-primary-600 mb-2">Livelihoods</h3>
              <ul className="text-gray-700 space-y-1 list-disc pl-5 text-sm">
                <li>Youth completing trainings</li>
                <li>Job placement or internship rate</li>
                <li>New micro-enterprises sustained (6m)</li>
                <li>Income generation from green businesses</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Be part of the change. Whether you want to volunteer, partner with us, or support our programs, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="bg-secondary-500 text-white px-8 py-4 rounded-lg hover:bg-secondary-600 transform hover:scale-105 transition-all duration-300 font-semibold text-lg text-center"
            >
              Get Involved
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transform hover:scale-105 transition-all duration-300 font-semibold text-lg text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Program Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-primary-600">Register for Program</h3>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {selectedProgram && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                  <h4 className="font-semibold text-primary-600">{selectedProgram.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedProgram.stats}</p>
                </div>
              )}

              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-primary-600 mb-2">Registration Successful!</h4>
                  <p className="text-gray-700">We'll contact you soon with program details.</p>
                </div>
              ) : (
                <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={registrationData.name}
                      onChange={handleRegistrationChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={registrationData.email}
                      onChange={handleRegistrationChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                      name="message"
                      value={registrationData.message}
                      onChange={handleRegistrationChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Tell us about your interest in this program..."
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRegistrationModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-primary-500 hover:bg-primary-600 text-white'
                      }`}
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}